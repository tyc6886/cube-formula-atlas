import { useEffect, useRef, useState } from 'react'
import type { ExperimentalLeafIndex, ExperimentalMillisecondTimestamp, TwistyPlayer } from 'cubing/twisty'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { sharedTwistyConfig } from '@/lib/twistyConfig'

interface CubePlayerProps {
  algorithm: string
  label: string
}

export default function CubePlayer({ algorithm, label }: CubePlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TwistyPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [timestamp, setTimestamp] = useState(0)
  const [duration, setDuration] = useState(1)
  const tokens = algorithm.split(/\s+/).filter(Boolean)

  useEffect(() => {
    let cancelled = false
    let player: TwistyPlayer | null = null
    let resizeObserver: ResizeObserver | null = null
    setReady(false)
    setError(false)
    setStep(0)
    setPlaying(false)
    setTimestamp(0)

    const onPosition = (value: { patternIndex: number; movesFinishing: unknown[]; movesFinished: unknown[] }) => {
      setStep(value.patternIndex + value.movesFinishing.length + value.movesFinished.length)
    }
    const onPlaying = (value: { playing: boolean }) => setPlaying(value.playing)
    const onTimeline = (value: { timestamp: number; timeRange: { end: number } }) => {
      setTimestamp(value.timestamp)
      setDuration(Math.max(1, value.timeRange.end))
    }

    import('cubing/twisty').then(({ TwistyPlayer: Player }) => {
      if (cancelled || !mountRef.current) return
      player = new Player({
        ...sharedTwistyConfig,
        alg: algorithm,
        tempoScale: speed,
      })
      playerRef.current = player
      player.className = 'twisty-instance'
      player.setAttribute('aria-label', `${label}的可旋转三维魔方`)
      mountRef.current.replaceChildren(player)
      const resizePlayer = () => {
        if (mountRef.current && player) player.style.height = `${mountRef.current.clientHeight}px`
      }
      resizePlayer()
      resizeObserver = new ResizeObserver(resizePlayer)
      resizeObserver.observe(mountRef.current)
      player.experimentalModel.currentLeavesSimplified.addFreshListener(onPosition)
      player.experimentalModel.playingInfo.addFreshListener(onPlaying)
      player.experimentalModel.detailedTimelineInfo.addFreshListener(onTimeline)
      player.experimentalModel.detailedTimelineInfo.get().then((info) => {
        if (!cancelled) {
          setDuration(Math.max(1, info.timeRange.end))
          setReady(true)
        }
      }).catch(() => setError(true))
    }).catch(() => setError(true))

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      if (player) {
        player.experimentalModel.currentLeavesSimplified.removeFreshListener(onPosition)
        player.experimentalModel.playingInfo.removeFreshListener(onPlaying)
        player.experimentalModel.detailedTimelineInfo.removeFreshListener(onTimeline)
        player.remove()
      }
      playerRef.current = null
    }
    // The player is rebuilt only for a new formula; speed is updated separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm])

  useEffect(() => {
    if (playerRef.current) playerRef.current.tempoScale = speed
  }, [speed])

  const goToStep = async (target: number) => {
    const player = playerRef.current
    if (!player) return
    player.pause()
    const indexer = await player.experimentalModel.indexer.get()
    const count = indexer.numAnimatedLeaves()
    const next = Math.max(0, Math.min(count, target))
    player.timestamp = (next === count ? indexer.algDuration() : indexer.indexToMoveStartTimestamp(next as ExperimentalLeafIndex)) as ExperimentalMillisecondTimestamp
  }

  const togglePlay = () => {
    const player = playerRef.current
    if (!player) return
    if (!playing && step >= tokens.length) player.jumpToStart({ flash: false })
    player.togglePlay()
  }

  return (
    <div
      className="cube-player"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === ' ') { event.preventDefault(); togglePlay() }
        if (event.key === 'ArrowRight') { event.preventDefault(); goToStep(step + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); goToStep(step - 1) }
      }}
      aria-label="三维公式播放器。空格播放或暂停，左右方向键逐步查看。"
    >
      <div className="cube-stage">
        {!ready && !error && <div className="cube-loading"><span className="loading-cube" /><span>正在准备 3D 魔方…</span></div>}
        {error && <div className="cube-loading"><span className="loading-cube" /><span>当前浏览器无法启动 3D，请使用公式步骤查看。</span></div>}
        <div ref={mountRef} className="twisty-mount" />
        <div className="stage-hint">拖动旋转 · 滚轮缩放</div>
      </div>

      <div className="move-readout" aria-live="polite">
        <span>步骤</span>
        <strong>{Math.min(step, tokens.length)} / {tokens.length}</strong>
        <div className="move-tokens">
          {tokens.map((token, index) => <span key={`${token}-${index}`} className={index < step ? 'done' : index === step && playing ? 'current' : ''}>{token}</span>)}
        </div>
      </div>

      <div className="player-timeline">
        <label className="sr-only" htmlFor={`timeline-${label}`}>公式播放进度</label>
        <input
          id={`timeline-${label}`}
          type="range"
          min="0"
          max={duration}
          value={Math.min(timestamp, duration)}
          onChange={(event) => {
            playerRef.current?.pause()
            if (playerRef.current) playerRef.current.timestamp = Number(event.target.value) as ExperimentalMillisecondTimestamp
          }}
        />
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className="icon-button" onClick={() => goToStep(0)} aria-label="复位到初始状态" title="复位"><RotateCcw /></button>
          <button className="icon-button" onClick={() => goToStep(step - 1)} disabled={step === 0} aria-label="上一步" title="上一步"><SkipBack /></button>
          <button className="play-button" onClick={togglePlay} disabled={!ready || error} aria-label={playing ? '暂停' : '播放'}>{playing ? <Pause /> : <Play />}<span>{playing ? '暂停' : '播放'}</span></button>
          <button className="icon-button" onClick={() => goToStep(step + 1)} disabled={step >= tokens.length} aria-label="下一步" title="下一步"><SkipForward /></button>
        </div>
        <label className="speed-control">速度
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            <option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option>
          </select>
        </label>
      </div>
    </div>
  )
}
