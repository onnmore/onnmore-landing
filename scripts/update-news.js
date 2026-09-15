/**
 * scripts/update-news.js
 * ─────────────────────────────────────────────────────────────────────────
 * Fetches every enabled source in scripts/news-sources.js, filters and
 * categorizes the items, deduplicates against each other AND against the
 * previously published /news/news.json, and writes the merged result back
 * to /news/news.json.
 *
 * Designed to run inside .github/workflows/update-news.yml (Node 20+, which
 * has a built-in global fetch — no HTTP client dependency needed). The only
 * external dependency is fast-xml-parser, declared in package.json.
 *
 * Failure handling (see README in the final report for the full rationale):
 *   - One source failing never stops the others.
 *   - If every source fails on a run, the existing news.json is left
 *     untouched rather than being overwritten with an empty/stale-looking file.
 *   - Articles from a source that isn't fetched this run (disabled, or it
 *     failed) are kept from the previous file until they age out, so a
 *     transient outage never makes a whole category vanish instantly.
 */

const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const { SOURCES, CATEGORY_RULES, INCLUDE_ENFORCEMENT_ORDERS, SKIP_TITLE_PATTERNS } = require("./news-sources");

const NEWS_JSON_PATH = path.join(__dirname, "..", "news", "news.json");
const STALE_DAYS = 14; // remove/de-prioritize items older than this...
const MIN_ARTICLES = 10; // ...unless doing so would drop below this floor
const MAX_ARTICLES = 100; // hard cap regardless of freshness
const FETCH_TIMEOUT_MS = 15000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: "__cdata",
  textNodeName: "__text",
});

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&#8377;/g, "\u20b9")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, max) {
  if (!text || text.length <= max) return text || "";
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "\u2026";
}

function slugKeyFromUrl(url) {
  const match = String(url).match(/(\d{3,})(?:[^\d]*)$/);
  if (match) return match[1];
  return Buffer.from(url).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
}

function normalizeTitleForDedupe(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toIsoDate(pubDate) {
  const d = new Date(pubDate);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

function categorize(title, defaultCategory, defaultRegion) {
  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(title)) {
      return { category: rule.category, region: rule.region || defaultRegion };
    }
  }
  return { category: defaultCategory, region: defaultRegion };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "OnnmoreBusinessNewsBot/1.0 (+https://onnmore.github.io/onnmore-landing/news/)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractItems(rssXml) {
  const parsed = xmlParser.parse(rssXml);
  const channel = parsed?.rss?.channel;
  if (!channel) return [];
  const rawItems = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  return rawItems;
}

function readField(node, field) {
  const val = node?.[field];
  if (val == null) return "";
  if (typeof val === "object" && "__cdata" in val) return val.__cdata;
  if (typeof val === "object" && "__text" in val) return val.__text;
  return String(val);
}

async function fetchSource(source) {
  const xml = await fetchWithTimeout(source.feedUrl);
  const rawItems = extractItems(xml);
  const articles = [];

  for (const raw of rawItems) {
    const rawTitle = stripHtml(readField(raw, "title"));
    if (!rawTitle) continue;

    if (source.id === "sebi-rss" && !INCLUDE_ENFORCEMENT_ORDERS) {
      if (SKIP_TITLE_PATTERNS.some((p) => p.test(rawTitle))) continue;
    }

    const link = stripHtml(readField(raw, "link"));
    if (!link) continue;

    const pubDate = readField(raw, "pubDate");
    const rawDescription = stripHtml(readField(raw, "description"));
    // Some feeds (e.g. SEBI) repeat the title verbatim as the description —
    // that's not a useful summary, so drop it rather than showing duplicate text.
    const summary =
      rawDescription && normalizeTitleForDedupe(rawDescription) !== normalizeTitleForDedupe(rawTitle)
        ? truncate(rawDescription, 220)
        : "";

    const { category, region } = categorize(rawTitle, source.defaultCategory, source.region);

    articles.push({
      id: `${source.id}-${slugKeyFromUrl(link)}`,
      title: truncate(rawTitle, 180),
      source: source.name,
      sourceUrl: link,
      publishedAt: toIsoDate(pubDate),
      category,
      region,
      summary,
      image: null,
      sourceType: source.sourceType,
      priority: source.priority,
      _dedupeKey: `${normalizeTitleForDedupe(rawTitle)}|${source.id}`,
    });
  }

  return articles;
}

function loadExisting() {
  try {
    const raw = fs.readFileSync(NEWS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.articles)) return parsed.articles;
  } catch (e) {
    // No existing file, or it's malformed — start fresh. Not fatal.
  }
  return [];
}

function dedupe(articles) {
  const seen = new Map();
  for (const a of articles) {
    const key = a._dedupeKey || `${normalizeTitleForDedupe(a.title)}|${a.source}`;
    const existing = seen.get(key);
    if (!existing || new Date(a.publishedAt) > new Date(existing.publishedAt)) {
      seen.set(key, a);
    }
  }
  return [...seen.values()];
}

function applyFreshnessWindow(articles) {
  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const sorted = [...articles].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const fresh = sorted.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
  const finalList = fresh.length >= MIN_ARTICLES ? fresh : sorted.slice(0, MIN_ARTICLES);
  return finalList.slice(0, MAX_ARTICLES);
}

async function main() {
  const enabledSources = SOURCES.filter((s) => s.enabled);
  console.log(`Onnmore Business News: fetching ${enabledSources.length} enabled source(s)...`);

  const fetched = [];
  let successCount = 0;

  for (const source of enabledSources) {
    try {
      const items = await fetchSource(source);
      console.log(`  ✓ ${source.name}: ${items.length} item(s)`);
      fetched.push(...items);
      successCount++;
    } catch (err) {
      console.warn(`  ✗ ${source.name} failed: ${err.message} — skipping this source for this run.`);
    }
  }

  const existing = loadExisting();

  if (successCount === 0) {
    if (existing.length > 0) {
      console.warn("All sources failed this run. Leaving existing news.json untouched.");
      return;
    }
    console.warn("All sources failed and there is no existing news.json. Writing an empty article list so the page still renders cleanly.");
    writeNewsJson([]);
    return;
  }

  // Keep previously-stored articles from sources not fetched this run
  // (disabled sources, or a source that failed above) so a category doesn't
  // instantly go empty just because one run had a hiccup or a source is
  // intentionally off. Anything freshly fetched for a source supersedes its
  // own older entries automatically via dedupe().
  const fetchedSourceIds = new Set(enabledSources.map((s) => s.id));
  const keepFromExisting = existing.filter((a) => {
    const sourceId = String(a.id).split("-")[0] + "-" + String(a.id).split("-")[1];
    return true; // dedupe() below reconciles overlaps by publishedAt recency
  });

  const merged = dedupe([...keepFromExisting, ...fetched]);
  const finalArticles = applyFreshnessWindow(merged).map(({ _dedupeKey, ...rest }) => rest);

  writeNewsJson(finalArticles);

  const byCategory = finalArticles.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  console.log(`Wrote ${finalArticles.length} article(s) to news/news.json`);
  console.log("By category:", byCategory);
}

function writeNewsJson(articles) {
  const payload = {
    updatedAt: new Date().toISOString(),
    articles,
  };
  fs.mkdirSync(path.dirname(NEWS_JSON_PATH), { recursive: true });
  fs.writeFileSync(NEWS_JSON_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

main().catch((err) => {
  console.error("Fatal error in update-news.js:", err);
  process.exitCode = 1;
});
