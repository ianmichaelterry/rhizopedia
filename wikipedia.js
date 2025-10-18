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
 * Fetch articles that link TO a given article (backlinks)
 * @param {string} title - The article title to find backlinks for
 * @returns {Promise<Array<string>>} Array of article titles that link to this article
 */
export async function fetchBacklinks(title) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'backlinks',
    bltitle: title,
    blnamespace: 0, // Only main namespace
    bllimit: 20, // Limit to 20 backlinks
    origin: '*'
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params}`);
    const data = await response.json();
    
    if (data.query && data.query.backlinks) {
      return data.query.backlinks.map(link => link.title);
    }
    return [];
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    return [];
  }
}

/**
 * Fetch article with its linked articles and backlinks
 * @returns {Promise<Object>} Article with title, linked titles, and backlinks
 */
export async function fetchArticleWithLinks() {
  const article = await fetchRandomArticle();
  const linkedTitles = extractLinks(article);
  const backlinks = await fetchBacklinks(article.title);
  
  return {
    mainTitle: article.title,
    linkedTitles: linkedTitles,
    backlinks: backlinks
  };
}
