import './style.css';
import { SceneManager } from './scene.js';
import { fetchArticleWithLinks, fetchSecondDegreeLinks, fetchSecondDegreeBacklinks } from './wikipedia.js';
import { calculateCircularLayout, calculateAngledLayout } from './layout.js';

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
    
    // Fetch second-degree links
    showLoading('Loading deeper links...');
    const secondDegreeData = await fetchSecondDegreeLinks(articleData.linkedTitles);
    
    // Calculate positions for second-degree links around their parents with collision avoidance
    const secondDegreePositions = [];
    const allSecondDegreePositions = []; // Track all positions for collision detection
    
    secondDegreeData.forEach((linkGroup, index) => {
      // Find the parent's position
      const parentPos = linkedPositions.find(pos => pos.title === linkGroup.parent);
      if (parentPos) {
        // Pass existing positions so this cluster avoids previous clusters
        // Z offset of -15 pushes them further forward (behind the blue links)
        const childPositions = calculateAngledLayout(
          parentPos, 
          linkGroup.children, 
          index, 
          8, 
          allSecondDegreePositions,
          -15
        );
        
        // Add these positions to the tracking array for next iteration
        allSecondDegreePositions.push(...childPositions);
        
        secondDegreePositions.push({
          parent: linkGroup.parent,
          parentPos: parentPos,
          children: childPositions
        });
      }
    });
    
    // Fetch second-degree backlinks
    showLoading('Loading deeper backlinks...');
    const secondDegreeBacklinkData = await fetchSecondDegreeBacklinks(articleData.backlinks);
    
    // Calculate positions for second-degree backlinks around their parents with collision avoidance
    const secondDegreeBacklinkPositions = [];
    const allSecondDegreeBacklinkPositions = []; // Track all positions for collision detection
    
    secondDegreeBacklinkData.forEach((linkGroup, index) => {
      // Find the parent's position
      const parentPos = backlinkPositions.find(pos => pos.title === linkGroup.parent);
      if (parentPos) {
        // Pass existing positions so this cluster avoids previous clusters
        // Z offset of +15 pushes them further back (behind the green backlinks)
        const childPositions = calculateAngledLayout(
          parentPos, 
          linkGroup.children, 
          index, 
          8, 
          allSecondDegreeBacklinkPositions,
          15
        );
        
        // Add these positions to the tracking array for next iteration
        allSecondDegreeBacklinkPositions.push(...childPositions);
        
        secondDegreeBacklinkPositions.push({
          parent: linkGroup.parent,
          parentPos: parentPos,
          children: childPositions
        });
      }
    });
    
    // Render in 3D
    sceneManager.renderArticle(
      articleData.mainTitle, 
      linkedPositions, 
      backlinkPositions,
      secondDegreePositions,
      secondDegreeBacklinkPositions
    );
    
    // Hide loading
    hideLoading();
    
    console.log('Article loaded:', articleData.mainTitle);
    console.log('Linked articles:', articleData.linkedTitles.length);
    console.log('Backlinks:', articleData.backlinks.length);
    console.log('Second-degree links:', secondDegreePositions.length);
    console.log('Second-degree backlinks:', secondDegreeBacklinkPositions.length);
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
