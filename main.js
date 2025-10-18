import './style.css';
import { SceneManager } from './scene.js';
import { fetchArticleWithLinks } from './wikipedia.js';
import { calculateCircularLayout } from './layout.js';

let sceneManager;
let loadingElement;
let newArticleButton;

/**
 * Initialize the application
 */
async function init() {
  loadingElement = document.getElementById('loading');
  newArticleButton = document.getElementById('newArticle');
  
  // Create scene
  const appContainer = document.getElementById('app');
  sceneManager = new SceneManager(appContainer);
  
  // Load font
  showLoading('Loading font...');
  try {
    await sceneManager.loadFont();
  } catch (error) {
    console.error('Error loading font:', error);
    showLoading('Error loading font. Please refresh.');
    return;
  }
  
  // Load initial article
  await loadNewArticle();
  
  // Setup button
  newArticleButton.addEventListener('click', loadNewArticle);
}

/**
 * Load and display a new Wikipedia article
 */
async function loadNewArticle() {
  showLoading('Fetching Wikipedia article...');
  
  try {
    // Fetch article data
    const articleData = await fetchArticleWithLinks();
    
    if (!articleData.mainTitle) {
      throw new Error('No article title found');
    }
    
    showLoading(`Loading: ${articleData.mainTitle}`);
    
    // Calculate positions for linked articles (in front, negative z)
    const linkedPositions = calculateCircularLayout(articleData.linkedTitles, 12, -20);
    
    // Calculate positions for backlinks (behind, positive z)
    const backlinkPositions = calculateCircularLayout(articleData.backlinks, 12, 30);
    
    // Render in 3D
    sceneManager.renderArticle(articleData.mainTitle, linkedPositions, backlinkPositions);
    
    // Hide loading
    hideLoading();
    
    console.log('Article loaded:', articleData.mainTitle);
    console.log('Linked articles:', articleData.linkedTitles.length);
    console.log('Backlinks:', articleData.backlinks.length);
  } catch (error) {
    console.error('Error loading article:', error);
    showLoading('Error loading article. Click button to try again.');
  }
}

/**
 * Show loading message
 */
function showLoading(message) {
  if (loadingElement) {
    loadingElement.textContent = message;
    loadingElement.classList.remove('hidden');
  }
}

/**
 * Hide loading message
 */
function hideLoading() {
  if (loadingElement) {
    setTimeout(() => {
      loadingElement.classList.add('hidden');
    }, 500);
  }
}

// Start the application
init();
