import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

/**
 * Scene manager for the 3D visualization
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.font = null;
    this.textMeshes = [];
    
    this.init();
  }
  
  /**
   * Initialize the 3D scene
   */
  init() {
    // Setup camera - positioned to view the vertical wall
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 25);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-10, -10, -10);
    this.scene.add(directionalLight2);
    
    // Add starfield background
    this.addStarfield();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Start animation loop
    this.animate();
  }
  
  /**
   * Add starfield background
   */
  addStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }
  
  /**
   * Load font for text rendering
   * @returns {Promise<void>}
   */
  async loadFont() {
    return new Promise((resolve, reject) => {
      const loader = new FontLoader();
      loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        (font) => {
          this.font = font;
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  /**
   * Create 3D text mesh
   * @param {string} text - The text to render
   * @param {number} size - Font size
   * @param {number} color - Text color
   * @returns {THREE.Mesh} Text mesh
   */
  createTextMesh(text, size = 1, color = 0x00aaff) {
    if (!this.font) {
      console.error('Font not loaded');
      return null;
    }
    
    const textGeometry = new TextGeometry(text, {
      font: this.font,
      size: size,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5
    });
    
    textGeometry.computeBoundingBox();
    
    // Center the geometry properly
    const bbox = textGeometry.boundingBox;
    const centerOffsetX = -0.5 * (bbox.max.x + bbox.min.x);
    const centerOffsetY = -0.5 * (bbox.max.y + bbox.min.y);
    const centerOffsetZ = -0.5 * (bbox.max.z + bbox.min.z);
    
    textGeometry.translate(centerOffsetX, centerOffsetY, centerOffsetZ);
    
    const material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 100
    });
    
    const textMesh = new THREE.Mesh(textGeometry, material);
    
    return textMesh;
  }
  
  /**
   * Clear all text meshes from scene
   */
  clearText() {
    this.textMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.textMeshes = [];
  }
  
  /**
   * Render article data as 3D text
   * @param {string} mainTitle - Main article title
   * @param {Array<Object>} linkedPositions - Array of {x, y, z, title}
   */
  renderArticle(mainTitle, linkedPositions) {
    this.clearText();
    
    // Create main title (larger, centered in front of the wall)
    const mainText = this.createTextMesh(mainTitle, 2.5, 0xffaa00);
    if (mainText) {
      mainText.position.set(0, 0, 5);
      this.scene.add(mainText);
      this.textMeshes.push(mainText);
      
      // Calculate the bounding box to center camera on the title
      mainText.geometry.computeBoundingBox();
      const bbox = mainText.geometry.boundingBox;
      const titleWidth = bbox.max.x - bbox.min.x;
      const titleHeight = bbox.max.y - bbox.min.y;
      
      // Calculate optimal camera distance to fit the title with generous padding
      const fov = this.camera.fov * (Math.PI / 180);
      const aspect = this.camera.aspect;
      
      // Add more padding - 2x the size to ensure it's never cut off
      const paddingMultiplier = 2.2;
      const distanceForHeight = (titleHeight * paddingMultiplier) / (2 * Math.tan(fov / 2));
      const distanceForWidth = (titleWidth * paddingMultiplier) / (2 * Math.tan(fov / 2) * aspect);
      const optimalDistance = Math.max(distanceForHeight, distanceForWidth, 20);
      
      // Position camera to center on the main title
      this.camera.position.set(0, 0, mainText.position.z + optimalDistance);
      this.camera.lookAt(0, 0, mainText.position.z);
      
      // Update controls target to the main title
      this.controls.target.set(0, 0, mainText.position.z);
      this.controls.update();
    }
    
    // Create linked articles
    linkedPositions.forEach(pos => {
      const linkedText = this.createTextMesh(pos.title, 0.7, 0x00aaff);
      if (linkedText) {
        linkedText.position.set(pos.x, pos.y, pos.z);
        this.scene.add(linkedText);
        this.textMeshes.push(linkedText);
        
        // Add line connecting to center
        const points = [];
        points.push(new THREE.Vector3(0, 0, 5));
        points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x444444,
          opacity: 0.2,
          transparent: true
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        this.textMeshes.push(line);
      }
    });
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
