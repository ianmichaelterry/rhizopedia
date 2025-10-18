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
 * Fetch links for a specific article by title
 * @param {string} title - The article title
 * @returns {Promise<Array<string>>} Array of linked article titles
 */
export async function fetchLinksForArticle(title) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'links',
    pllimit: 10, // Limit to 10 links per second-degree article to avoid explosion
    plnamespace: 0,
    origin: '*'
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params}`);
    const data = await response.json();
    
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    if (page.links) {
      return page.links.map(link => link.title);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching links for ${title}:`, error);
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

/**
 * Fetch second-degree links (links from linked articles)
 * @param {Array<string>} firstDegreeLinks - Array of first-degree link titles
 * @returns {Promise<Array<Object>>} Array of {parent, children} objects
 */
export async function fetchSecondDegreeLinks(firstDegreeLinks) {
  const secondDegreeData = [];
  
  // Limit to first 5 articles to avoid too many API calls
  const limitedLinks = firstDegreeLinks.slice(0, 5);
  
  for (const parentTitle of limitedLinks) {
    const children = await fetchLinksForArticle(parentTitle);
    if (children.length > 0) {
      secondDegreeData.push({
        parent: parentTitle,
        children: children
      });
    }
  }
  
  return secondDegreeData;
}

/**
 * Fetch second-degree backlinks (backlinks to backlinks)
 * @param {Array<string>} firstDegreeBacklinks - Array of first-degree backlink titles
 * @returns {Promise<Array<Object>>} Array of {parent, children} objects
 */
export async function fetchSecondDegreeBacklinks(firstDegreeBacklinks) {
  const secondDegreeData = [];
  
  // Limit to first 5 articles to avoid too many API calls
  const limitedBacklinks = firstDegreeBacklinks.slice(0, 5);
  
  for (const parentTitle of limitedBacklinks) {
    const children = await fetchBacklinks(parentTitle);
    if (children.length > 0) {
      secondDegreeData.push({
        parent: parentTitle,
        children: children.slice(0, 10) // Limit to 10 backlinks per parent
      });
    }
  }
  
  return secondDegreeData;
}
