import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { usePerformance } from '../../hooks/usePerformance'

export default function HeroCanvas() {
  const containerRef = useRef(null)
  const { shouldReduceMotion } = usePerformance()

  useEffect(() => {
    if (shouldReduceMotion) return
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(0, 0, 16)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)

    const blueLight = new THREE.PointLight(0x2563eb, 3, 40)
    blueLight.position.set(6, 4, 6)
    scene.add(blueLight)

    const cyanLight = new THREE.PointLight(0x06b6d4, 2.5, 35)
    cyanLight.position.set(-6, -3, 4)
    scene.add(cyanLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
    rimLight.position.set(-4, 8, -2)
    scene.add(rimLight)

    // Central globe group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    // Inner sphere - solid core
    const coreGeo = new THREE.SphereGeometry(2.2, 64, 64)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
      envMapIntensity: 1,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    globeGroup.add(core)

    // Wireframe overlay
    const wireGeo = new THREE.SphereGeometry(2.25, 22, 22)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    })
    const wireframe = new THREE.Mesh(wireGeo, wireMat)
    globeGroup.add(wireframe)

    // Outer glow shell
    const glowGeo = new THREE.SphereGeometry(2.5, 32, 32)
    const glowMat = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    })
    globeGroup.add(new THREE.Mesh(glowGeo, glowMat))

    // Nodes on globe surface (Fibonacci distribution)
    const nodeGeo = new THREE.SphereGeometry(0.1, 10, 10)
    const nodePositions = []
    const nodeCount = 28
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount)
      const theta = Math.sqrt(nodeCount * Math.PI) * phi
      const r = 2.3
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      const isBlue = i % 3 !== 0
      const nodeMat = new THREE.MeshPhysicalMaterial({
        color: isBlue ? 0x3b82f6 : 0x06b6d4,
        emissive: isBlue ? 0x1d4ed8 : 0x0891b2,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.2,
      })
      const node = new THREE.Mesh(nodeGeo, nodeMat)
      node.position.set(x, y, z)
      globeGroup.add(node)
      nodePositions.push(new THREE.Vector3(x, y, z))
    }

    // Connection lines between nearby nodes
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 2.2) {
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x2563eb,
            transparent: true,
            opacity: 0.25,
          })
          const lineGeo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]])
          globeGroup.add(new THREE.Line(lineGeo, lineMat))
        }
      }
    }

    // Orbiting rings
    const makeRing = (radius, tubeRadius, color, opacity, rotX, rotY, rotZ) => {
      const geo = new THREE.TorusGeometry(radius, tubeRadius, 8, 180)
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.set(rotX, rotY, rotZ)
      return mesh
    }

    const ring1 = makeRing(3.6, 0.018, 0x06b6d4, 0.4, Math.PI / 3.5, 0, 0)
    const ring2 = makeRing(4.4, 0.012, 0x2563eb, 0.25, Math.PI / 5, Math.PI / 6, Math.PI / 4)
    const ring3 = makeRing(5.2, 0.008, 0x3b82f6, 0.15, Math.PI / 2.2, Math.PI / 3, 0)
    scene.add(ring1, ring2, ring3)

    // Floating data packets (small cubes orbiting)
    const packetGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18)
    const packets = []
    const packetCount = 12
    for (let i = 0; i < packetCount; i++) {
      const angle = (i / packetCount) * Math.PI * 2
      const orbitR = 3.6 + (i % 3) * 0.8
      const packetMat = new THREE.MeshPhysicalMaterial({
        color: i % 2 === 0 ? 0x2563eb : 0x06b6d4,
        emissive: i % 2 === 0 ? 0x1e3a8a : 0x0e7490,
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.2,
      })
      const packet = new THREE.Mesh(packetGeo, packetMat)
      packet.userData = { angle, orbitR, orbitSpeed: 0.004 + (i % 4) * 0.001, orbitTilt: (i * 0.3) % Math.PI }
      packets.push(packet)
      scene.add(packet)
    }

    // Background particles
    const particleCount = 280
    const pPositions = new Float32Array(particleCount * 3)
    const pColors = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 40
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 30
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 6
      const c = new THREE.Color(Math.random() > 0.6 ? 0x2563eb : Math.random() > 0.5 ? 0x06b6d4 : 0x0f172a)
      pColors[i * 3] = c.r
      pColors[i * 3 + 1] = c.g
      pColors[i * 3 + 2] = c.b
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Network signal lines (distant)
    const signalMat = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.06 })
    for (let i = 0; i < 20; i++) {
      const p1 = new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12 - 6)
      const p2 = new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12 - 6)
      const sGeo = new THREE.BufferGeometry().setFromPoints([p1, p2])
      scene.add(new THREE.Line(sGeo, signalMat))
    }

    // Mouse tracking
    let targetMouseX = 0, targetMouseY = 0
    let currentMouseX = 0, currentMouseY = 0
    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 4
      targetMouseY = -(e.clientY / window.innerHeight - 0.5) * 3
    }
    window.addEventListener('mousemove', handleMouseMove)

    let time = 0
    let animId
    function animate() {
      animId = requestAnimationFrame(animate)
      time += 0.008

      // Smooth mouse follow
      currentMouseX += (targetMouseX - currentMouseX) * 0.025
      currentMouseY += (targetMouseY - currentMouseY) * 0.025

      // Globe rotation
      globeGroup.rotation.y += 0.003
      globeGroup.rotation.x += 0.0008
      globeGroup.rotation.y += currentMouseX * 0.0015
      globeGroup.rotation.x += currentMouseY * 0.0010

      // Rings rotation
      ring1.rotation.z += 0.004
      ring2.rotation.y += 0.003
      ring3.rotation.x += 0.002

      // Orbiting packets
      packets.forEach((p) => {
        p.userData.angle += p.userData.orbitSpeed
        const tilt = p.userData.orbitTilt
        const r = p.userData.orbitR
        const a = p.userData.angle
        p.position.set(
          r * Math.cos(a) * Math.cos(tilt),
          r * Math.sin(tilt) * 0.6 + Math.sin(a * 0.5) * 0.4,
          r * Math.sin(a) * Math.cos(tilt)
        )
        p.rotation.x += 0.02
        p.rotation.y += 0.02
      })

      // Pulsing lights
      blueLight.intensity = 3 + Math.sin(time * 1.8) * 0.8
      cyanLight.intensity = 2.5 + Math.cos(time * 1.4) * 0.6

      // Slow particle drift
      particles.rotation.y += 0.00025

      // Camera micro-movement
      camera.position.x += (currentMouseX * 0.5 - camera.position.x) * 0.03
      camera.position.y += (currentMouseY * 0.4 - camera.position.y) * 0.03
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      renderer.setSize(container.clientWidth, container.clientHeight)
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animId)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [shouldReduceMotion])

  if (shouldReduceMotion) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  )
}
