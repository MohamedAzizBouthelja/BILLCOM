import { useState, useEffect, useRef } from 'react'

// ext: 'jpeg' | 'png' — matches the actual files you put in /public/frames/<product>/
export default function useFrameLoader(product, totalFrames, ext = 'jpeg') {
  const [frames, setFrames] = useState([])
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const imagesRef = useRef([])

  useEffect(() => {
    if (!totalFrames || totalFrames < 1) return

    setFrames([])
    setProgress(0)
    setReady(false)

    imagesRef.current.forEach(img => { if (img) img.src = '' })
    imagesRef.current = []

    let cancelled = false
    const loaded = new Array(totalFrames).fill(false)
    const imgs   = new Array(totalFrames).fill(null)

    const loadFrame = (i) => new Promise((resolve) => {
      const frameNum = i + 1
      const src = `/frames/${product}/${String(frameNum).padStart(4, '0')}.${ext}`
      const img = new Image()
      imgs[i] = img
      imagesRef.current[i] = img

      img.onload = () => {
        if (cancelled) return resolve()
        loaded[i] = true
        setProgress(Math.round((loaded.filter(Boolean).length / totalFrames) * 100))
        resolve()
      }
      img.onerror = () => resolve()
      img.src = src
    })

    const init = async () => {
      // Load first, middle, last frames first so canvas shows something immediately
      const priority = [0, Math.floor(totalFrames / 2), totalFrames - 1]
      await Promise.all(priority.map(loadFrame))
      if (cancelled) return
      setFrames([...imgs])

      // Load all remaining frames in parallel
      const remaining = Array.from({ length: totalFrames }, (_, i) => i)
        .filter(i => !priority.includes(i))
      await Promise.all(remaining.map(loadFrame))
      if (cancelled) return

      setFrames([...imgs])
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      imagesRef.current.forEach(img => { if (img) img.src = '' })
      imagesRef.current = []
    }
  }, [product, totalFrames, ext])

  return { frames, progress, ready }
}
