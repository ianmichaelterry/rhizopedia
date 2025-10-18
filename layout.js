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

/**
 * Position second-degree links around their parent article at various angles
 * Creates a more organic 3D structure with rotation and collision avoidance
 * @param {Object} parentPos - Parent position {x, y, z}
 * @param {Array<string>} titles - Array of article titles to position
 * @param {number} parentIndex - Index of parent (used for angle variation)
 * @param {number} baseRadius - Radius around parent
 * @param {Array<Object>} existingPositions - Previously placed positions to avoid
 * @param {number} zDepthOffset - How much to push back in Z (negative = forward, positive = backward)
 * @returns {Array<Object>} Array of positions {x, y, z, title, rotation, width}
 */
export function calculateAngledLayout(parentPos, titles, parentIndex = 0, baseRadius = 8, existingPositions = [], zDepthOffset = -15) {
  const positions = [];
  const count = titles.length;
  
  if (count === 0) return positions;
  
  // Each parent gets a unique rotation angle to create variety
  const parentRotation = (parentIndex * Math.PI * 0.4); // Rotate by 72 degrees per parent
  
  // Distribute children in a circle around the parent
  const angleStep = (Math.PI * 2) / count;
  const textHeight = 1.0;
  
  // Create temporary positions with collision detection
  const tempPositions = [];
  
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep + parentRotation;
    const textWidth = estimateTextWidth(titles[i]);
    
    tempPositions.push({
      angle: angle,
      baseRadius: baseRadius,
      currentRadius: baseRadius,
      width: textWidth,
      height: textHeight,
      title: titles[i],
      parentX: parentPos.x,
      parentY: parentPos.y,
      parentZ: parentPos.z,
      zOffset: Math.sin(angle * 2) * 3 + zDepthOffset, // Use the offset parameter
      rotation: parentRotation
    });
  }
  
  // Combine with existing positions from other clusters
  const allTempPositions = [...existingPositions, ...tempPositions];
  
  // Iteratively adjust radii to prevent overlaps
  let maxIterations = 100;
  let hasOverlap = true;
  
  while (hasOverlap && maxIterations > 0) {
    hasOverlap = false;
    
    // Only check collisions for the new positions we're adding
    for (let i = 0; i < tempPositions.length; i++) {
      const pos1 = tempPositions[i];
      const localX1 = Math.cos(pos1.angle) * pos1.currentRadius;
      const localY1 = Math.sin(pos1.angle) * pos1.currentRadius;
      const x1 = pos1.parentX + localX1;
      const y1 = pos1.parentY + localY1;
      
      const box1 = {
        x: x1 - pos1.width / 2,
        y: y1 - pos1.height / 2,
        width: pos1.width,
        height: pos1.height
      };
      
      // Check against all other positions (both new and existing)
      for (let j = 0; j < allTempPositions.length; j++) {
        // Skip self-comparison
        if (allTempPositions[j] === pos1) continue;
        
        const pos2 = allTempPositions[j];
        let x2, y2;
        
        // Handle existing positions differently (they already have final x, y)
        if (existingPositions.includes(pos2)) {
          x2 = pos2.x;
          y2 = pos2.y;
        } else {
          const localX2 = Math.cos(pos2.angle) * pos2.currentRadius;
          const localY2 = Math.sin(pos2.angle) * pos2.currentRadius;
          x2 = pos2.parentX + localX2;
          y2 = pos2.parentY + localY2;
        }
        
        const box2 = {
          x: x2 - pos2.width / 2,
          y: y2 - pos2.height / 2,
          width: pos2.width,
          height: pos2.height
        };
        
        if (boxesOverlap(box1, box2)) {
          hasOverlap = true;
          // Push the new position further out from its parent
          pos1.currentRadius += 0.5;
          break;
        }
      }
    }
    
    maxIterations--;
  }
  
  // Create final positions
  for (const pos of tempPositions) {
    const localX = Math.cos(pos.angle) * pos.currentRadius;
    const localY = Math.sin(pos.angle) * pos.currentRadius;
    
    positions.push({
      x: pos.parentX + localX,
      y: pos.parentY + localY,
      z: pos.parentZ + pos.zOffset,
      title: pos.title,
      rotation: pos.rotation,
      width: pos.width,
      height: pos.height
    });
  }
  
  return positions;
}
