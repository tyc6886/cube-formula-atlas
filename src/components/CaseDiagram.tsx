import { getCaseFaces, stickerColors } from '@/lib/casePatterns'
import type { CubeCase } from '@/types'

type Point = [number, number]

function pointsForCell(origin: Point, horizontal: Point, vertical: Point, row: number, column: number) {
  const point = (u: number, v: number): Point => [
    origin[0] + horizontal[0] * u + vertical[0] * v,
    origin[1] + horizontal[1] * u + vertical[1] * v,
  ]
  const inset = 0.045
  return [
    point((column + inset) / 3, (row + inset) / 3),
    point((column + 1 - inset) / 3, (row + inset) / 3),
    point((column + 1 - inset) / 3, (row + 1 - inset) / 3),
    point((column + inset) / 3, (row + 1 - inset) / 3),
  ].map((pair) => pair.map((value) => Number(value.toFixed(2))).join(',')).join(' ')
}

const geometry = {
  U: { origin: [10, 39] as Point, horizontal: [62, -31] as Point, vertical: [62, 31] as Point, outline: '10,39 72,8 134,39 72,70' },
  F: { origin: [10, 43] as Point, horizontal: [62, 34] as Point, vertical: [0, 64] as Point, outline: '10,43 72,77 72,141 10,107' },
  R: { origin: [72, 77] as Point, horizontal: [62, -34] as Point, vertical: [0, 64] as Point, outline: '72,77 134,43 134,107 72,141' },
}

function DiagramFace({ face, pattern }: { face: keyof typeof geometry; pattern: string }) {
  const { origin, horizontal, vertical, outline } = geometry[face]
  return (
    <g data-face={face}>
      <polygon points={outline} className="diagram-face-base" />
      {pattern.slice(0, 9).split('').map((color, index) => (
        <polygon
          key={index}
          data-sticker={index}
          points={pointsForCell(origin, horizontal, vertical, Math.floor(index / 3), index % 3)}
          fill={stickerColors[color] || stickerColors.l}
          className="diagram-sticker"
        />
      ))}
    </g>
  )
}

export default function CaseDiagram({ cubeCase, orientation = 0 }: { cubeCase: CubeCase; orientation?: number }) {
  const faces = getCaseFaces(cubeCase, orientation)
  const visible = { U: faces.U, F: faces.F, R: faces.R }
  return (
    <svg
      className="case-diagram"
      viewBox="0 0 144 148"
      role="img"
      aria-label={`${cubeCase.name}立体三面特征图`}
      data-stickers={`${visible.U}${visible.F}${visible.R}`}
    >
      <DiagramFace face="U" pattern={visible.U} />
      <DiagramFace face="F" pattern={visible.F} />
      <DiagramFace face="R" pattern={visible.R} />
    </svg>
  )
}
