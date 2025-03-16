import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import styles from './Scene3D.module.scss'

export default function Scene3D({ dataPerceptionMode }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const dataStructuresRef = useRef({})

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    sceneRef.current = new THREE.Scene()
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
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
    sceneRef.current.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 10, 5)
    sceneRef.current.add(directionalLight)

    // Create data structures
    createDataStructures()

    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return
      requestAnimationFrame(animate)
      updateDataEffects()
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [])

  const createDataStructures = () => {
    if (!sceneRef.current) return

    // Create data path
    const pathPoints = [
      new THREE.Vector3(-10, 0.1, -5),
      new THREE.Vector3(-5, 0.1, 0),
      new THREE.Vector3(0, 0.1, 5),
      new THREE.Vector3(5, 0.1, 10)
    ]
    const curve = new THREE.CatmullRomCurve3(pathPoints)
    const pathGeometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false)
    const pathMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    })
    
    const dataPath = new THREE.Mesh(pathGeometry, pathMaterial)
    dataPath.visible = false
    dataPath.userData = { type: 'dataPath' }
    sceneRef.current.add(dataPath)
    dataStructuresRef.current.path = dataPath

    // Create data terminal
    const terminalGeometry = new THREE.BoxGeometry(1, 2, 1)
    const terminalMaterial = new THREE.MeshStandardMaterial({
      color: 0x003366,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0
    })
    
    const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial)
    terminal.position.set(8, 1, -8)
    terminal.visible = false
    terminal.userData = { type: 'terminal', interactable: true }
    sceneRef.current.add(terminal)
    dataStructuresRef.current.terminal = terminal

    // Create data grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x00ffff)
    gridHelper.material.transparent = true
    gridHelper.material.opacity = 0
    gridHelper.position.y = 0.01
    gridHelper.visible = false
    gridHelper.userData = { type: 'grid' }
    sceneRef.current.add(gridHelper)
    dataStructuresRef.current.grid = gridHelper
  }

  const updateDataEffects = () => {
    if (!dataStructuresRef.current) return

    const time = performance.now() * 0.001

    // Update path effect
    if (dataStructuresRef.current.path) {
      dataStructuresRef.current.path.material.opacity = 
        0.6 + Math.sin(time * 2) * 0.2
    }

    // Update terminal effect
    if (dataStructuresRef.current.terminal) {
      dataStructuresRef.current.terminal.material.emissiveIntensity = 
        0.5 + Math.sin(time * 3) * 0.3
    }

    // Update grid effect
    if (dataStructuresRef.current.grid) {
      dataStructuresRef.current.grid.material.opacity = 
        0.3 + Math.sin(time) * 0.1
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
