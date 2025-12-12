"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    camera.position.z = 5

    // Create wave geometry
    const geometry = new THREE.PlaneGeometry(20, 20, 50, 50)
    const material = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      wireframe: false,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 4
    scene.add(mesh)

    // Add second wave layer
    const geometry2 = new THREE.PlaneGeometry(20, 20, 50, 50)
    const material2 = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      wireframe: false,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })

    const mesh2 = new THREE.Mesh(geometry2, material2)
    mesh2.rotation.x = -Math.PI / 4
    mesh2.position.z = -1
    scene.add(mesh2)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xa855f7, 2)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(0x3b82f6, 1.5)
    pointLight2.position.set(-5, -5, 5)
    scene.add(pointLight2)

    // Animation
    const animate = () => {
      requestAnimationFrame(animate)

      const time = Date.now() * 0.0005

      // Animate first wave
      const positions = geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const wave1 = Math.sin(x * 0.5 + time) * 0.3
        const wave2 = Math.cos(y * 0.5 + time) * 0.3
        positions.setZ(i, wave1 + wave2)
      }
      positions.needsUpdate = true

      // Animate second wave
      const positions2 = geometry2.attributes.position
      for (let i = 0; i < positions2.count; i++) {
        const x = positions2.getX(i)
        const y = positions2.getY(i)
        const wave1 = Math.cos(x * 0.3 + time * 1.2) * 0.4
        const wave2 = Math.sin(y * 0.4 + time * 0.8) * 0.3
        positions2.setZ(i, wave1 + wave2)
      }
      positions2.needsUpdate = true

      // Rotate meshes slowly
      mesh.rotation.z = time * 0.1
      mesh2.rotation.z = -time * 0.15

      // Animate lights
      pointLight.position.x = Math.sin(time * 0.5) * 5
      pointLight.position.y = Math.cos(time * 0.3) * 5
      pointLight2.position.x = Math.cos(time * 0.7) * 5
      pointLight2.position.y = Math.sin(time * 0.4) * 5

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      geometry2.dispose()
      material2.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 opacity-40"
      style={{
        background: "linear-gradient(135deg, #f0f4ff 0%, #e9d5ff 50%, #ddd6fe 100%)",
      }}
    />
  )
}
