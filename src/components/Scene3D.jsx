import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import styles from './Scene3D.module.scss';
// Import post-processing modules
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default function Scene3D({ dataPerceptionMode }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const dataStructuresRef = useRef({}) // Keep for terminal
  const backgroundElementsRef = useRef({}); // For stars, nebulae
  const starsRef = useRef(null); // Specific ref for stars rotation
  const composerRef = useRef(null); // For post-processing

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    sceneRef.current = new THREE.Scene()
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000 // Increased far clipping plane
    )

    // Renderer setup
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(rendererRef.current.domElement)

    // Camera position
    cameraRef.current.position.set(0, 5, 10)
    cameraRef.current.lookAt(0, 0, 0)

    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    sceneRef.current.add(ambientLight);

    // Post-processing setup (Re-enabled)
    const renderScene = new RenderPass(sceneRef.current, cameraRef.current);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0, // strength (Increased from 0.7)
      0.3, // radius (Kept the same)
      0.4  // threshold (Decreased from 0.8)
    );
    const composer = new EffectComposer(rendererRef.current); // Use rendererRef.current
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer; // Store composer reference

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 10, 5)
    sceneRef.current.add(directionalLight)

    // Create data structures
    createSceneElements() // Renamed function

    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
      requestAnimationFrame(animate)
      updateSceneEffects() // Renamed function
      // rendererRef.current.render(sceneRef.current, cameraRef.current) // Render via composer
      if (composerRef.current) { // Re-enabled composer rendering
        composerRef.current.render();
      }
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return; // Added composer check back
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      composerRef.current.setSize(window.innerWidth, window.innerHeight); // Re-enabled composer resize
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      }
      // Dispose composer if it exists
      composerRef.current = null; // Re-enabled composer cleanup
  }, [])

  const createSceneElements = () => { // Renamed function
    if (!sceneRef.current) return

    // --- Path Removed ---

    // --- Create Starfield ---
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000); // Spread stars across a large area
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      // Ensure stars are somewhat distant
      if (Math.sqrt(x*x + y*y + z*z) > 100) {
         starVertices.push(x, y, z);
      }
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true, // Smaller when farther
      transparent: true,
      opacity: 0.8,
      fog: false // Make stars ignore scene fog
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);
    sceneRef.current.fog = new THREE.FogExp2(0x000000, 0.003); // Reduced fog density slightly
    backgroundElementsRef.current.stars = stars;
    starsRef.current = stars; // Store for rotation

    // --- Create Nebula/Galaxy Planes ---
    const textureLoader = new THREE.TextureLoader();
    const nebulaTexture = textureLoader.load('/textures/nebula.jpg');
    const galaxyTexture = textureLoader.load('/textures/galaxy_band.jpg');

    const nebulaMaterial = new THREE.MeshBasicMaterial({
      map: nebulaTexture, // Use loaded nebula texture
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false, // Render behind stars usually
      blending: THREE.AdditiveBlending
    });
    const nebulaPlane1 = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), nebulaMaterial); // Uncommented nebula
    nebulaPlane1.position.z = -200;
    nebulaPlane1.rotation.x = Math.PI * 0.1;
    nebulaPlane1.rotation.y = Math.PI * 0.1;
    sceneRef.current.add(nebulaPlane1);
    backgroundElementsRef.current.nebula1 = nebulaPlane1;

    const galaxyMaterial = new THREE.MeshBasicMaterial({ // Use loaded galaxy texture
      map: galaxyTexture,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
     const galaxyPlane = new THREE.Mesh(new THREE.PlaneGeometry(800, 100), galaxyMaterial);
     galaxyPlane.position.z = -1200; // Pushed significantly further back
     galaxyPlane.rotation.x = -Math.PI * 0.25; // Adjusted rotation to soften edge
     sceneRef.current.add(galaxyPlane);
     backgroundElementsRef.current.galaxy = galaxyPlane;

    // Create data terminal
    // const terminalGeometry = new THREE.BoxGeometry(1, 2, 1)
    // const terminalMaterial = new THREE.MeshStandardMaterial({
    //   color: 0x003366,
    //   emissive: 0x00ffff,
    //   emissiveIntensity: 0.5,
    //   transparent: true,
    //   opacity: 0
    // })
    
    // const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial)
    // terminal.position.set(8, 1, -8) // Original position
    // terminal.visible = false
    // terminal.userData = { type: 'terminal', interactable: true }
    // sceneRef.current.add(terminal)
    // dataStructuresRef.current.terminal = terminal

    // Create data grid (Commented out)
    // const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x00ffff)
    // gridHelper.material.transparent = true
    // gridHelper.material.opacity = 0
    // gridHelper.position.y = 0.01
    // gridHelper.visible = false
    // gridHelper.userData = { type: 'grid' }
    // sceneRef.current.add(gridHelper)
    // dataStructuresRef.current.grid = gridHelper
  }

  const updateSceneEffects = () => { // Renamed function
    if (!dataStructuresRef.current) return

    const time = performance.now() * 0.001

    // Update path effect
    // if (dataStructuresRef.current.path) { // Commented out path update logic
    //   dataStructuresRef.current.path.material.opacity =
    //     0.6 + Math.sin(time * 2) * 0.2
    // }

    // Update terminal effect
    // if (dataStructuresRef.current.terminal) {
    //   dataStructuresRef.current.terminal.material.emissiveIntensity =
    //     0.5 + Math.sin(time * 3) * 0.3
    // }

    // Update grid effect (Commented out)
    // ...

    // Rotate stars slowly
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
      starsRef.current.rotation.x += 0.00005;
    }

    // Add subtle movement/opacity changes to nebulae if desired
    if (backgroundElementsRef.current.nebula1) { // Uncommented nebula update
       backgroundElementsRef.current.nebula1.material.opacity = 0.15 + Math.sin(time * 5) * 0.05;
    }
     if (backgroundElementsRef.current.galaxy) { // Uncommented galaxy update
       backgroundElementsRef.current.galaxy.material.opacity = 0.1 + Math.sin(time * 3 + 2) * 0.03;
    }
  }

  useEffect(() => {
    if (!dataStructuresRef.current) return

    Object.values(dataStructuresRef.current).forEach(object => {
      if (!object) return

      // Toggle visibility with animation
      gsap.to(object.material, {
        opacity: dataPerceptionMode ? 1 : 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onStart: () => {
          if (dataPerceptionMode) object.visible = true
        },
        onComplete: () => {
          if (!dataPerceptionMode) object.visible = false
        }
      })
    })
  }, [dataPerceptionMode])

  return <div ref={containerRef} className={styles.scene3d} />
}
