/**
 * GameFAQs scraper (no official API — this is a polite HTML scraper).
 *
 * GameFAQs is a Fandom-owned site with a huge archive of walkthroughs,
 * FAQs, and cheat codes going back 25+ years. We fetch the same pages a
 * browser would, with a real UA, and parse with cheerio.
 */
import * as cheerio from "cheerio";
const BASE = "https://gamefaqs.gamespot.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
export class ScrapeError extends Error {
}
async function fetchHtml(url) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": UA,
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    });
    if (!res.ok) {
        throw new ScrapeError(`HTTP ${res.status} fetching ${url}`);
    }
    return await res.text();
}
/** Search GameFAQs for games by title. */
export async function searchGames(query) {
    const html = await fetchHtml(`${BASE}/search?game=${encodeURIComponent(query)}`);
    const $ = cheerio.load(html);
    const results = [];
    $(".result").each((_, el) => {
        const $el = $(el);
        const link = $el.find("a").first();
        const href = link.attr("href") ?? "";
        const title = link.text().trim();
        if (!title || !href)
            return;
        results.push({
            title,
            platform: $el.find(".platform").text().trim() || "?",
            url: href.startsWith("http") ? href : `${BASE}${href}`,
            year: $el.find(".date").text().trim() || undefined,
        });
    });
    return results.slice(0, 15);
}
/** Fetch a game's page and extract its walkthrough/FAQ/cheat sections. */
export async function getGamePage(gameUrl) {
    const html = await fetchHtml(gameUrl);
    const $ = cheerio.load(html);
    const title = $(".game-title, h1, .page-title").first().text().trim() ||
        $("title").text().trim();
    const platform = $(".platform, .info .platform").first().text().trim() || "?";
    const guides = [];
    // Walkthrough / FAQ / Cheats are listed as <li> inside section bodies.
    $("li").each((_, el) => {
        const $el = $(el);
        const link = $el.find("a[href*='/faqs/'], a[href*='/cheats/']").first();
        const href = link.attr("href");
        if (!href)
            return;
        const section = $el.closest(".section, section").find("h2, h3").first().text().trim();
        guides.push({
            title: link.text().trim(),
            url: href.startsWith("http") ? href : `${BASE}${href}`,
            type: section || guessType(href),
            date: $el.find(".date").text().trim() || undefined,
            author: $el.find(".author").text().trim() || undefined,
        });
    });
    return { title, platform, guides: dedupe(guides).slice(0, 25) };
}
/** Fetch a guide/FAQ page and return its readable text content. */
export async function getGuideContent(guideUrl) {
    const html = await fetchHtml(guideUrl);
    const $ = cheerio.load(html);
    const title = $("h1, .page-title").first().text().trim() || "Guide";
    // FAQ bodies live inside .article; walkthroughs use .body with <p> blocks.
    const article = $(".article").first();
    const body = article.length ? article : $(".body").first();
    const paragraphs = [];
    body.find("h1, h2, h3, h4, p, li").each((_, el) => {
        const t = $(el).text().replace(/\s+/g, " ").trim();
        if (t)
            paragraphs.push(t);
    });
    const text = paragraphs.join("\n");
    return `# ${title}\n\n${text || "(page had no parseable text — may be blocked)"}`;
}
function guessType(href) {
    if (href.includes("/cheats/"))
        return "Cheats";
    if (href.includes("/faqs/"))
        return "FAQ/Walkthrough";
    return "Guide";
}
function dedupe(guides) {
    const seen = new Set();
    return guides.filter((g) => {
        if (seen.has(g.url))
            return false;
        seen.add(g.url);
        return true;
    });
}
