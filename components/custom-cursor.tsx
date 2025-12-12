"use client"

import { useEffect, useRef } from "react"

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const follower = followerRef.current
    if (!cursor || !follower) return

    let mouseX = 0
    let mouseY = 0
    let cursorX = 0
    let cursorY = 0
    let followerX = 0
    let followerY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const handleMouseEnter = () => {
      cursor.style.opacity = "1"
      follower.style.opacity = "1"
    }

    const handleMouseLeave = () => {
      cursor.style.opacity = "0"
      follower.style.opacity = "0"
    }

    const handleLinkHover = () => {
      cursor.classList.add("hover")
    }

    const handleLinkLeave = () => {
      cursor.classList.remove("hover")
    }

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseenter", handleMouseEnter)
    document.addEventListener("mouseleave", handleMouseLeave)

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll("a, button, [role='button']")
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleLinkHover)
      el.addEventListener("mouseleave", handleLinkLeave)
    })

    const animate = () => {
      // Smooth cursor movement
      const dx = mouseX - cursorX
      const dy = mouseY - cursorY
      cursorX += dx * 0.15
      cursorY += dy * 0.15
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`

      // Smoother follower movement
      const fdx = mouseX - followerX
      const fdy = mouseY - followerY
      followerX += fdx * 0.08
      followerY += fdy * 0.08
      follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseenter", handleMouseEnter)
      document.removeEventListener("mouseleave", handleMouseLeave)
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleLinkHover)
        el.removeEventListener("mouseleave", handleLinkLeave)
      })
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" style={{ opacity: 0 }} />
      <div ref={followerRef} className="custom-cursor-follower" style={{ opacity: 0 }} />
    </>
  )
}
