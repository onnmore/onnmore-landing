/* ══════════ ONNMORE BUSINESS NEWS — client-side rendering ══════════
 * Reads /news/news.json (produced by scripts/update-news.js via the
 * scheduled GitHub Action) and renders it. No article content is ever
 * hard-coded here — if the fetch fails, the page shows a failure message
 * rather than fabricating anything.
 */
(function () {
  const PAGE_SIZE = 24;
  const CATEGORY_LABELS = {
    all: "All",
    "West Bengal Business": "West Bengal",
    "India Business": "India Business",
    Startups: "Startups",
    MSME: "MSME",
    "GST & Tax": "GST & Tax",
    "Government & Policy": "Government & Policy",
    Companies: "Companies",
    "Finance & Banking": "Finance & Banking",
    "Technology & Business": "Technology",
    "Import & Export": "Import & Export",
  };

  let allArticles = [];
  let currentCategory = "all";
  let currentSort = "latest";
  let searchQuery = "";
  let visibleCount = PAGE_SIZE;
  let searchDebounceTimer = null;

  const grid = document.getElementById("newsGrid");
  const wbContent = document.getElementById("newsWbContent");
  const updatedAtEl = document.getElementById("newsUpdatedAt");
  const loadMoreWrap = document.getElementById("newsLoadMoreWrap");
  const loadMoreBtn = document.getElementById("newsLoadMoreBtn");
  const searchInput = document.getElementById("newsSearchInput");
  const filterRow = document.getElementById("newsFilters");
  const sortRow = document.querySelector(".news-sort");

  function ckTrackSafe(name, params) {
    if (typeof window.ckTrack === "function") window.ckTrack(name, params);
  }

  function timeAgo(iso) {
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
    const days = Math.floor(hours / 24);
    if (days < 7) return days + (days === 1 ? " day ago" : " days ago");
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function officialLabel(article) {
    if (article.sourceType !== "official") return "";
    return /ministry|department|pib|dpiit|dgft/i.test(article.source) ? "Government Source" : "Official Source";
  }

  function matchesSearch(article, q) {
    if (!q) return true;
    const hay = `${article.title} ${article.source} ${article.category} ${article.summary || ""}`.toLowerCase();
    return hay.includes(q);
  }

  function getFiltered() {
    let list = allArticles.filter((a) => (currentCategory === "all" ? true : a.category === currentCategory));
    if (searchQuery) list = list.filter((a) => matchesSearch(a, searchQuery));
    list = [...list];
    if (currentSort === "popular") {
      list.sort((a, b) => (b.priority || 0) - (a.priority || 0) || new Date(b.publishedAt) - new Date(a.publishedAt));
    } else {
      list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    return list;
  }

  function cardHtml(article) {
    const badge = officialLabel(article);
    return `
      <article class="news-card">
        <div class="news-card-top">
          <span class="news-cat-tag">${escapeHtml(article.category)}</span>
          ${badge ? `<span class="news-official-tag"><i class="ri-shield-check-line"></i> ${badge}</span>` : ""}
        </div>
        <h3>${escapeHtml(article.title)}</h3>
        ${article.summary ? `<p class="news-summary">${escapeHtml(article.summary)}</p>` : `<p class="news-summary" style="flex-grow:1"></p>`}
        <div class="news-card-meta">
          <div>
            <span class="news-card-source">${escapeHtml(article.source)}</span>
            <span class="news-card-time">${timeAgo(article.publishedAt)}</span>
          </div>
          <a class="news-read-link" href="${escapeAttr(article.sourceUrl)}" target="_blank" rel="noopener noreferrer"
             data-article-id="${escapeAttr(article.id)}" data-article-source="${escapeAttr(article.source)}" data-article-category="${escapeAttr(article.category)}">
            Read Original <i class="ri-arrow-right-up-line"></i>
          </a>
        </div>
      </article>`;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function render() {
    const filtered = getFiltered();

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="news-empty-state">No business news matches these filters right now. Try a different category or search term.</div>`;
      loadMoreWrap.style.display = "none";
    } else {
      const visible = filtered.slice(0, visibleCount);
      grid.innerHTML = visible.map(cardHtml).join("");
      loadMoreWrap.style.display = filtered.length > visible.length ? "flex" : "none";
    }

    grid.querySelectorAll(".news-read-link").forEach((link) => {
      link.addEventListener("click", () => {
        ckTrackSafe("news_article_click", {
          source: link.getAttribute("data-article-source"),
          category: link.getAttribute("data-article-category"),
          article_id: link.getAttribute("data-article-id"),
        });
      });
    });

    renderWestBengal();
  }

  function renderWestBengal() {
    const wb = allArticles
      .filter((a) => a.category === "West Bengal Business")
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 6);

    if (wb.length === 0) {
      wbContent.innerHTML = `<div class="news-wb-empty">No major West Bengal business stories available from the selected sources right now.</div>`;
      return;
    }
    wbContent.innerHTML = `<div class="news-grid">${wb.map(cardHtml).join("")}</div>`;
    wbContent.querySelectorAll(".news-read-link").forEach((link) => {
      link.addEventListener("click", () => {
        ckTrackSafe("news_article_click", {
          source: link.getAttribute("data-article-source"),
          category: link.getAttribute("data-article-category"),
          article_id: link.getAttribute("data-article-id"),
        });
      });
    });
  }

  function setUpdatedAt(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      updatedAtEl.textContent = "Last updated: unavailable";
      return;
    }
    updatedAtEl.textContent =
      "Last updated: " + d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function wireControls() {
    filterRow.querySelectorAll(".news-filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        filterRow.querySelectorAll(".news-filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        currentCategory = chip.getAttribute("data-cat");
        visibleCount = PAGE_SIZE;
        ckTrackSafe("news_category_filter", { category: currentCategory });
        render();
      });
    });

    sortRow.querySelectorAll("button[data-sort]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sortRow.querySelectorAll("button[data-sort]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentSort = btn.getAttribute("data-sort");
        if (currentSort === "westbengal") {
          currentCategory = "West Bengal Business";
          filterRow.querySelectorAll(".news-filter-chip").forEach((c) => {
            c.classList.toggle("active", c.getAttribute("data-cat") === "West Bengal Business");
          });
          currentSort = "latest";
        }
        visibleCount = PAGE_SIZE;
        render();
      });
    });

    searchInput.addEventListener("input", () => {
      const val = searchInput.value;
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = val.trim().toLowerCase();
        visibleCount = PAGE_SIZE;
        render();
        ckTrackSafe("news_search", { has_query: searchQuery.length > 0 });
      }, 300);
    });

    loadMoreBtn.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      render();
    });
  }

  async function init() {
    ckTrackSafe("news_page_view", {});
    wireControls();
    try {
      const res = await fetch("news.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      allArticles = Array.isArray(data.articles) ? data.articles : [];
      setUpdatedAt(data.updatedAt);
      render();
    } catch (err) {
      updatedAtEl.textContent = "Unable to load the latest news right now.";
      grid.innerHTML = `<div class="news-empty-state">We couldn't load business news just now. Please refresh the page in a little while, or check back later.</div>`;
      wbContent.innerHTML = `<div class="news-wb-empty">West Bengal business news is temporarily unavailable.</div>`;
      console.error("Onnmore Business News: failed to load news.json", err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
