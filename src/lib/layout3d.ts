/** Static geometry layout. Mobile gets a narrower, lighter arrangement. */
export interface Layout {
  mobile: boolean
  xScale: number
  nodeScale: number
  nodeXs: number[]
  cableDx: number
  nodeY: number
  nodeZA: number
  nodeZB: number
  slabW: number
  slabD: number
  slabY: number
  cableXs: number[]
  blockW: number
  blockD: number
  storageZs: number[]
  storageTierYs: number[]
  storageTopY: number
  s3Y: number
  s3Cols: number
  s3Rows: number
  s3Layers: number
  s3Pitch: number
  s3Size: number
  packetsPerRoute: number
  dust: number
}

export function makeLayout(mobile: boolean): Layout {
  const xs = mobile ? 0.62 : 1
  const nodeScale = mobile ? 0.7 : 1
  const nodeXs = [-3.6, -1.2, 1.2, 3.6].map((x) => x * xs)
  const cableDx = 0.65 * nodeScale
  const cableXs = nodeXs.flatMap((x) => [x - cableDx, x + cableDx])
  const minGap = Math.min(...cableXs.slice(1).map((x, i) => x - cableXs[i]))
  const tierYs = [-1.95, -2.45, -2.95, -3.45]
  return {
    mobile,
    xScale: xs,
    nodeScale,
    nodeXs,
    cableDx,
    nodeY: 2.7,
    nodeZA: 0.9,
    nodeZB: -1.7,
    slabW: 10.6 * xs,
    slabD: mobile ? 4.4 : 5.6,
    slabY: 0.5,
    cableXs,
    blockW: minGap * 0.86,
    blockD: mobile ? 1.0 : 1.5,
    storageZs: mobile ? [-1.2, 0, 1.2] : [-1.8, 0, 1.8],
    storageTierYs: tierYs,
    storageTopY: tierYs[0] + 0.21,
    s3Y: -5.0,
    s3Cols: mobile ? 12 : 16,
    s3Rows: mobile ? 4 : 6,
    s3Layers: 2,
    s3Pitch: mobile ? 0.5 : 0.6,
    s3Size: mobile ? 0.42 : 0.5,
    packetsPerRoute: mobile ? 4 : 7,
    dust: mobile ? 40 : 110,
  }
}
