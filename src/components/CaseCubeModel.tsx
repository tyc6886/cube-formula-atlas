import { useEffect, useRef, useState } from 'react'
import type { TwistyPlayer } from 'cubing/twisty'
import CaseDiagram from './CaseDiagram'
import { sharedTwistyConfig } from '@/lib/twistyConfig'
import type { CubeCase } from '@/types'

export default function CaseCubeModel({ cubeCase, orientation = 0, algorithm }: { cubeCase: CubeCase; orientation?: number; algorithm: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TwistyPlayer | null>(null)
  const camera = useRef({ latitude: sharedTwistyConfig.cameraLatitude, longitude: sharedTwistyConfig.cameraLongitude })
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting)
    }, { rootMargin: '100px' })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setReady(false)
    setFailed(false)
    const mount = mountRef.current
    if (!visible || !mount) return

    let cancelled = false
    let player: TwistyPlayer | null = null
    let resizeObserver: ResizeObserver | null = null

    import('cubing/twisty').then(({ TwistyPlayer: Player }) => {
      if (cancelled) return
      player = new Player({ ...sharedTwistyConfig, alg: algorithm })
      playerRef.current = player
      camera.current = { latitude: sharedTwistyConfig.cameraLatitude, longitude: sharedTwistyConfig.cameraLongitude }
      player.className = 'case-cube-player'
      player.setAttribute('aria-label', `${cubeCase.name}可旋转3D模型，拖动或使用方向键旋转`)
      mount.replaceChildren(player)

      const resizePlayer = () => {
        if (player) player.style.height = `${mount.clientHeight}px`
      }
      resizePlayer()
      resizeObserver = new ResizeObserver(resizePlayer)
      resizeObserver.observe(mount)

      const readinessStarted = performance.now()
      const checkCanvases = async () => {
        if (cancelled || !player) return
        try {
          const canvases = await player.experimentalCurrentCanvases()
          if (cancelled) return
          if (canvases.some((canvas) => canvas.width > 0 && canvas.height > 0)) {
            setReady(true)
          } else if (performance.now() - readinessStarted > 10000) {
            setFailed(true)
          } else {
            requestAnimationFrame(checkCanvases)
          }
        } catch {
          if (!cancelled) setFailed(true)
        }
      }
      void checkCanvases()
    }).catch(() => {
      if (!cancelled) setFailed(true)
    })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      player?.remove()
      playerRef.current = null
      mount.replaceChildren()
    }
  }, [visible, algorithm, cubeCase.name])

  return (
    <div
      ref={rootRef}
      className="case-cube-model"
      data-state={ready ? 'player' : failed ? 'error' : visible ? 'loading' : 'idle'}
      role="img"
      aria-label={`${cubeCase.name}可旋转3D模型，拖动或使用方向键旋转`}
      tabIndex={0}
      onKeyDown={(event) => {
        const player = playerRef.current
        if (!player) return
        const moves: Record<string, [number, number]> = { ArrowLeft: [0, -8], ArrowRight: [0, 8], ArrowUp: [8, 0], ArrowDown: [-8, 0] }
        const move = moves[event.key]
        if (!move) return
        event.preventDefault()
        event.stopPropagation()
        camera.current.latitude = Math.max(-80, Math.min(80, camera.current.latitude + move[0]))
        camera.current.longitude += move[1]
        player.cameraLatitude = camera.current.latitude
        player.cameraLongitude = camera.current.longitude
      }}
    >
      {!ready && <CaseDiagram cubeCase={cubeCase} orientation={orientation} />}
      <div ref={mountRef} className="case-cube-mount" />
    </div>
  )
}
