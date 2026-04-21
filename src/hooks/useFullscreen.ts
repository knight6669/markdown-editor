import { useEffect, useState, type RefObject } from 'react'

export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === target.current)
    }

    document.addEventListener('fullscreenchange', handleChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleChange)
    }
  }, [target])

  const toggleFullscreen = async () => {
    const element = target.current
    if (!element) {
      return false
    }

    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen()
        return true
      }

      await element.requestFullscreen()
      return true
    } catch {
      return false
    }
  }

  return {
    isFullscreen,
    toggleFullscreen,
  }
}
