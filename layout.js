/**
 * Layout engine for positioning 3D text to avoid overlaps
 */

/**
 * Calculate bounding box width for text
 * @param {string} text - The text to measure
 * @returns {number} Estimated width
 */
function estimateTextWidth(text) {
  // Rough estimate: 0.6 units per character
  return text.length * 0.6;
}

/**
 * Check if two bounding boxes overlap on a 2D plane
 * @param {Object} box1 - {x, y, width, height}
 * @param {Object} box2 - {x, y, width, height}
 * @returns {boolean} True if boxes overlap
 */
function boxesOverlap(box1, box2) {
  const padding = 0.5; // Extra padding between boxes
  return !(box1.x + box1.width + padding < box2.x || 
           box2.x + box2.width + padding < box1.x || 
           box1.y + box1.height + padding < box2.y || 
           box2.y + box2.height + padding < box1.y);
}

/**
 * Position linked articles radially around the main title in a vertical plane
 * with dynamic spacing to prevent overlaps
 * @param {Array<string>} titles - Array of article titles to position
 * @param {number} baseRadius - Starting radius from center
 * @param {number} zDepth - Z position (negative = in front, positive = behind)
 * @returns {Array<Object>} Array of positions {x, y, z, title, width}
 */
export function calculateCircularLayout(titles, baseRadius = 12, zDepth = -20) {
  const positions = [];
  const count = titles.length;
  
  if (count === 0) return positions;
  
  const textHeight = 1.2; // Approximate height of text
  
  // Calculate initial angles evenly distributed
  const angleStep = (Math.PI * 2) / count;
  const tempPositions = [];
  
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const textWidth = estimateTextWidth(titles[i]);
    
    tempPositions.push({
      angle: angle,
      width: textWidth,
      height: textHeight,
      title: titles[i],
      radius: baseRadius
    });
  }
  
  // Iteratively adjust radii to prevent overlaps
  let maxIterations = 150;
  let hasOverlap = true;
  
  while (hasOverlap && maxIterations > 0) {
    hasOverlap = false;
    
    for (let i = 0; i < tempPositions.length; i++) {
      const pos1 = tempPositions[i];
      const x1 = Math.cos(pos1.angle) * pos1.radius;
      const y1 = Math.sin(pos1.angle) * pos1.radius;
      
      const box1 = {
        x: x1 - pos1.width / 2,
        y: y1 - pos1.height / 2,
        width: pos1.width,
        height: pos1.height
      };
      
      for (let j = i + 1; j < tempPositions.length; j++) {
        const pos2 = tempPositions[j];
        const x2 = Math.cos(pos2.angle) * pos2.radius;
        const y2 = Math.sin(pos2.angle) * pos2.radius;
        
        const box2 = {
          x: x2 - pos2.width / 2,
          y: y2 - pos2.height / 2,
          width: pos2.width,
          height: pos2.height
        };
        
        if (boxesOverlap(box1, box2)) {
          hasOverlap = true;
          // Push both items further out
          pos1.radius += 0.3;
          pos2.radius += 0.3;
        }
      }
    }
    
    maxIterations--;
  }
  
  // Create final positions
  for (const pos of tempPositions) {
    const x = Math.cos(pos.angle) * pos.radius;
    const y = Math.sin(pos.angle) * pos.radius;
    
    positions.push({
      x: x,
      y: y,
      z: zDepth,
      title: pos.title,
      width: pos.width
    });
  }
  
  return positions;
}
