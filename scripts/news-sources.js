/**
 * scripts/news-sources.js
 * ─────────────────────────────────────────────────────────────────────────
 * Centralized configuration for every "Onnmore Business News" source.
 *
 * Launch decision (confirmed by client, Sep 2026): ONLY official / government
 * sources are enabled at launch. Commercial media publishers (Business
 * Standard, Economic Times, etc.) are listed below but disabled, because
 * their Terms of Use do not clearly grant a licence to redisplay even
 * headlines + snippets on a commercial third-party site. Do not flip a
 * media source to enabled:true without written confirmation from the
 * publisher (a syndication/API agreement) or from Onnmore's legal counsel.
 *
 * To add or change a source: edit ONE entry below. Nothing else in the
 * ingestion script needs to change for a simple RSS source.
 *
 * Field reference:
 *   id            - stable short slug, used to build article ids (id + "-" + itemKey)
 *   name          - display name shown as "Source: <name>"
 *   feedUrl       - RSS/XML endpoint to fetch
 *   sourceType    - "official" (government/regulator) or "media" (commercial publisher)
 *   defaultCategory - category applied unless a keyword rule below overrides it
 *   region        - "National" unless the source is inherently West Bengal specific
 *   enabled       - whether update-news.js should fetch this source right now
 *   verified      - whether we have actually fetched this feed and confirmed it
 *                   returns real items (true) or it is still an unverified
 *                   candidate endpoint that must be checked before enabling (false)
 *   priority      - used ONLY for the "Popular/Important" sort — higher runs first.
 *                   This is an editorial/source-trust ranking, never a fabricated
 *                   popularity metric.
 *   attribution   - exact text to show as the "Official Source" / "Government
 *                   Source" badge tooltip
 *   notes         - anything a human should know before enabling/trusting this source
 */

const SOURCES = [
  // ── VERIFIED + ENABLED AT LAUNCH ──────────────────────────────────────
  {
    id: "rbi-press",
    name: "Reserve Bank of India (RBI)",
    feedUrl: "https://www.rbi.org.in/pressreleases_rss.xml",
    sourceType: "official",
    defaultCategory: "Finance & Banking",
    region: "National",
    enabled: true,
    verified: true,
    priority: 90,
    attribution: "Official Source — Reserve Bank of India",
    notes:
      "Live-verified Sep 2026. Mixes monetary-policy operations (repo/reverse-repo, T-bill auctions), regulatory directions, and enforcement actions. Keyword rules below split these into Finance & Banking / Government & Policy / Companies.",
  },
  {
    id: "sebi-rss",
    name: "Securities and Exchange Board of India (SEBI)",
    feedUrl: "https://www.sebi.gov.in/sebirss.xml",
    sourceType: "official",
    defaultCategory: "Finance & Banking",
    region: "National",
    enabled: true,
    verified: true,
    priority: 85,
    attribution: "Official Source — Securities and Exchange Board of India",
    notes:
      "Live-verified Sep 2026. Feed is dominated by individual enforcement/recovery orders (named respondents) alongside occasional press releases. update-news.js filters out single-respondent enforcement/adjudication/recovery orders by default (see SKIP_TITLE_PATTERNS) so the news page shows market-relevant announcements rather than a legal notice board — flip INCLUDE_ENFORCEMENT_ORDERS to true if that filtering is not wanted.",
  },

  // ── CONFIGURED BUT NOT YET VERIFIED LIVE — check before enabling ──────
  {
    id: "pib-national",
    name: "Press Information Bureau (PIB), Government of India",
    feedUrl: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1",
    sourceType: "official",
    defaultCategory: "Government & Policy",
    region: "National",
    enabled: false,
    verified: false,
    priority: 95,
    attribution: "Official Source — Press Information Bureau, Government of India",
    notes:
      "PIB is the single best source for MSME/DPIIT/DGFT/GST-adjacent policy announcements across ALL ministries, so it's worth persevering with. However: (1) a direct fetch in this session returned an empty/likely-wrong-language channel, and (2) third parties independently report PIB blocking automated RSS requests with HTTP 403 depending on IP/user-agent. Before enabling: fetch this URL from the actual GitHub Actions runner and confirm it returns populated <item> elements; if it 403s, PIB also publishes a regional feed at RssMain.aspx?ModId=6&Lang=1&Regid=<region-id> — try PIB Kolkata's Regid for the West Bengal category specifically.",
  },
  {
    id: "mca-notifications",
    name: "Ministry of Corporate Affairs (MCA)",
    feedUrl: "https://www.mca.gov.in/bin/dms/getdocument?mds=RSS_URL_TO_CONFIRM",
    sourceType: "official",
    defaultCategory: "Companies",
    region: "National",
    enabled: false,
    verified: false,
    priority: 80,
    attribution: "Official Source — Ministry of Corporate Affairs",
    notes:
      "MCA's public RSS/notification endpoint was not confirmed in this session — the URL above is a placeholder, not a real endpoint. Find and verify the current feed at mca.gov.in before enabling; do not deploy this entry as-is.",
  },
  {
    id: "cbic-gst",
    name: "Central Board of Indirect Taxes and Customs (CBIC) — GST",
    feedUrl: "https://www.cbic.gov.in/RSS_URL_TO_CONFIRM",
    sourceType: "official",
    defaultCategory: "GST & Tax",
    region: "National",
    enabled: false,
    verified: false,
    priority: 85,
    attribution: "Official Source — Central Board of Indirect Taxes and Customs",
    notes:
      "CBIC/GST notification feed URL not confirmed in this session — placeholder only. This is the intended primary source for the GST & Tax category; verify and enable before launch if that category matters for v1.",
  },
  {
    id: "dpiit-startup-india",
    name: "DPIIT / Startup India",
    feedUrl: "https://www.startupindia.gov.in/RSS_URL_TO_CONFIRM",
    sourceType: "official",
    defaultCategory: "Startups",
    region: "National",
    enabled: false,
    verified: false,
    priority: 75,
    attribution: "Official Source — DPIIT / Startup India",
    notes: "Placeholder — intended primary source for the Startups and MSME categories. Verify before enabling.",
  },
  {
    id: "dgft-notifications",
    name: "Directorate General of Foreign Trade (DGFT)",
    feedUrl: "https://www.dgft.gov.in/RSS_URL_TO_CONFIRM",
    sourceType: "official",
    defaultCategory: "Import & Export",
    region: "National",
    enabled: false,
    verified: false,
    priority: 75,
    attribution: "Official Source — Directorate General of Foreign Trade",
    notes: "Placeholder — intended primary source for the Import & Export category. Verify before enabling.",
  },
  {
    id: "fssai-notifications",
    name: "Food Safety and Standards Authority of India (FSSAI)",
    feedUrl: "https://www.fssai.gov.in/RSS_URL_TO_CONFIRM",
    sourceType: "official",
    defaultCategory: "Government & Policy",
    region: "National",
    enabled: false,
    verified: false,
    priority: 60,
    attribution: "Official Source — Food Safety and Standards Authority of India",
    notes: "Placeholder — relevant given Onnmore's existing Food Business service page. Verify before enabling.",
  },

  // ── COMMERCIAL PUBLISHERS — held back pending licensing review ────────
  {
    id: "business-standard",
    name: "Business Standard",
    feedUrl: "https://www.business-standard.com/rss/latest.rss",
    sourceType: "media",
    defaultCategory: "India Business",
    region: "National",
    enabled: false,
    verified: false,
    priority: 70,
    attribution: "Business Standard",
    notes:
      "DO NOT ENABLE without confirming Business Standard's Terms of Use permit commercial redisplay of headline+snippet+link, or without a syndication/API agreement. Flagged as a legal/licensing item requiring human review — see final report.",
  },
  {
    id: "economic-times-b2b",
    name: "The Economic Times",
    feedUrl: "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
    sourceType: "media",
    defaultCategory: "India Business",
    region: "National",
    enabled: false,
    verified: false,
    priority: 70,
    attribution: "The Economic Times",
    notes: "Same licensing caveat as Business Standard above. Do not enable without confirmation.",
  },
];

// Keyword-based category/region overrides, applied in order (first match wins)
// after a source's defaultCategory. This is the "CATEGORIZE" step in the
// ingestion pipeline. Keep this list short and specific — it only needs to
// catch the cases a source's defaultCategory gets wrong.
const CATEGORY_RULES = [
  { test: /\b(west bengal|kolkata|howrah|bidhannagar|new town|newtown|rajarhat|siliguri|durgapur|asansol)\b/i, category: "West Bengal Business", region: "West Bengal" },
  { test: /\b(udyam|msme|micro,? small)\b/i, category: "MSME" },
  { test: /\b(startup|incubat|innovation challenge|techsprint)\b/i, category: "Startups" },
  { test: /\b(fintech|digital public infrastructure|artificial intelligence|\bai\b|cybersecurity|tokeni[sz]ed?)\b/i, category: "Technology & Business" },
  { test: /\b(gst|cgst|sgst|igst|customs duty|cbic)\b/i, category: "GST & Tax" },
  { test: /\b(export|import|dgft|foreign trade)\b/i, category: "Import & Export" },
  { test: /\b(penalty|fined|monetary penalty|imposes.*penalty|adjudication|enquiry|enforcement)\b.*\b(ltd|limited|private|pvt|llp|company|bank)\b/i, category: "Companies" },
  { test: /\b(directions?|amendment directions|notification|draft.*regulation|guidelines?|circular)\b/i, category: "Government & Policy" },
];

// SEBI's feed is dominated by single-respondent legal orders (recovery
// certificates, adjudication/appeal orders). These are real and correctly
// attributed, but they read as a legal notice board rather than business
// news, so they're excluded from the news page by default.
const INCLUDE_ENFORCEMENT_ORDERS = false;
const SKIP_TITLE_PATTERNS = [
  /recovery (certificate|proceeding|advice)/i,
  /release order/i,
  /cancellation of (rc|recovery)/i,
  /^appeal no\./i,
  /general remittance/i,
  /adjudication order/i,
  /^order in the matter of/i,
  /^final (order|enquiry order)/i,
  /settlement order/i,
];

module.exports = { SOURCES, CATEGORY_RULES, INCLUDE_ENFORCEMENT_ORDERS, SKIP_TITLE_PATTERNS };
