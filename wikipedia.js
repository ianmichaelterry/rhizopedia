/**
 * Wikipedia API module for fetching articles and parsing links
 */

const WIKI_API_BASE = 'https://en.wikipedia.org/w/api.php';

/**
 * Fetch a random Wikipedia article
 * @returns {Promise<Object>} Article data with title and content
 */
export async function fetchRandomArticle() {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'random',
    grnnamespace: 0,
    prop: 'extracts|links',
    exintro: false,
    explaintext: false,
    pllimit: 'max',
    origin: '*'
  });

  const response = await fetch(`${WIKI_API_BASE}?${params}`);
  const data = await response.json();
  
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];
  
  return {
    title: page.title,
    content: page.extract,
    links: page.links || []
  };
}

/**
 * Extract links from article content
 * @param {Object} article - Article data
 * @returns {Array<string>} Array of linked article titles
 */
export function extractLinks(article) {
  if (!article.links || article.links.length === 0) {
    return [];
  }
  
  // Filter out non-main namespace links (like Wikipedia:, Help:, etc.)
  return article.links
    .filter(link => link.ns === 0) // ns: 0 means main namespace
    .map(link => link.title)
    .slice(0, 20); // Limit to 20 links to avoid clutter
}

/**
 * Fetch article with its linked articles
 * @returns {Promise<Object>} Article with title and linked titles
 */
export async function fetchArticleWithLinks() {
  const article = await fetchRandomArticle();
  const linkedTitles = extractLinks(article);
  
  return {
    mainTitle: article.title,
    linkedTitles: linkedTitles
  };
}
