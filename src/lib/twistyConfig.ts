import type { TwistyPlayerConfig } from 'cubing/twisty'

// Keep catalog cards and the formula viewer on the same puzzle and camera state.
export const sharedTwistyConfig = {
  experimentalSetupAlg: 'z2 y2',
  experimentalSetupAnchor: 'end',
  puzzle: '3x3x3',
  visualization: '3D',
  controlPanel: 'none',
  background: 'none',
  hintFacelets: 'none',
  viewerLink: 'none',
  cameraLatitude: 28,
  cameraLongitude: -32,
  cameraDistance: 4.5,
} satisfies TwistyPlayerConfig
