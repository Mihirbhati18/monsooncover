import { useEffect, useRef } from 'react'

type Drop = {
  x: number
  y: number
  length: number
  speed: number
  alpha: number
}

export function LiquidWeatherCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (navigator.userAgent.includes('jsdom')) return

    const context = canvas.getContext('2d')
    if (!context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let animationFrame = 0
    let visible = true
    let width = 0
    let height = 0
    let drops: Drop[] = []

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const density = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      canvas.width = Math.round(width * density)
      canvas.height = Math.round(height * density)
      context.setTransform(density, 0, 0, density, 0, 0)
      drops = Array.from({ length: Math.max(28, Math.round(width / 13)) }, (_, index) => ({
        x: (index * 83.7) % width,
        y: (index * 47.3) % height,
        length: 10 + (index % 5) * 4,
        speed: 0.45 + (index % 7) * 0.09,
        alpha: 0.035 + (index % 4) * 0.018,
      }))
    }

    const drawLiquidField = (time: number) => {
      const fields = [
        { x: 0.78 + Math.sin(time * 0.00031) * 0.08, y: 0.35 + Math.cos(time * 0.00027) * 0.11, radius: 0.42, color: '72, 215, 235' },
        { x: 0.9 + Math.cos(time * 0.00019) * 0.06, y: 0.78 + Math.sin(time * 0.00024) * 0.12, radius: 0.34, color: '21, 157, 216' },
        { x: 0.55 + Math.sin(time * 0.00022) * 0.09, y: 0.9 + Math.cos(time * 0.00018) * 0.06, radius: 0.3, color: '42, 100, 176' },
      ]

      context.save()
      context.globalCompositeOperation = 'screen'
      for (const field of fields) {
        const radius = Math.max(width, height) * field.radius
        const gradient = context.createRadialGradient(
          width * field.x,
          height * field.y,
          0,
          width * field.x,
          height * field.y,
          radius,
        )
        gradient.addColorStop(0, `rgba(${field.color}, 0.14)`)
        gradient.addColorStop(0.48, `rgba(${field.color}, 0.055)`)
        gradient.addColorStop(1, `rgba(${field.color}, 0)`)
        context.fillStyle = gradient
        context.fillRect(0, 0, width, height)
      }
      context.restore()
    }

    const drawRain = (time: number) => {
      context.save()
      context.lineWidth = 0.7
      for (const drop of drops) {
        const y = (drop.y + time * drop.speed * 0.085) % (height + 40) - 20
        context.beginPath()
        context.moveTo(drop.x, y)
        context.lineTo(drop.x - 5, y + drop.length)
        context.strokeStyle = `rgba(110, 223, 238, ${drop.alpha})`
        context.stroke()
      }
      context.restore()
    }

    const drawContours = (time: number) => {
      context.save()
      context.translate(width * 0.82, height * 0.48)
      context.rotate(time * 0.000025)
      for (let ring = 0; ring < 5; ring += 1) {
        context.beginPath()
        context.ellipse(0, 0, 62 + ring * 33, 42 + ring * 26, ring * 0.14, 0, Math.PI * 2)
        context.strokeStyle = `rgba(88, 213, 232, ${0.09 - ring * 0.012})`
        context.lineWidth = 0.8
        context.stroke()
      }
      context.restore()
    }

    const render = (time = 0) => {
      context.clearRect(0, 0, width, height)
      drawLiquidField(time)
      drawContours(time)
      drawRain(time)
    }

    const animate = (time: number) => {
      if (visible && !document.hidden) {
        render(time)
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    const resizeObserver = new ResizeObserver(resize)

    resize()
    observer.observe(canvas)
    resizeObserver.observe(canvas)

    if (reducedMotion) render(1800)
    else animationFrame = window.requestAnimationFrame(animate)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className="liquid-weather-canvas" aria-hidden="true" />
}
