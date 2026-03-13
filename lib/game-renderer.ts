import type { GameState, Player, Platform, Enemy, Bullet, Particle, Star } from './game-types'

// ─── Colors ───
const COLORS = {
  sky: {
    top: '#2a6fc4',
    mid: '#5aa4e6',
    bottom: '#a8d8f0',
    horizon: '#d8ecf6',
  },
  sun: '#fff8dd',
  sunGlow: 'rgba(255,244,200,0.35)',
  clouds: 'rgba(255,255,255,0.85)',
  cloudShadow: 'rgba(180,200,220,0.4)',
  ground: {
    dirt: '#6b4226',
    dirtLight: '#8b5e3c',
    dirtDark: '#4a2e1a',
    dirtDeep: '#2a1a0a',
    grass: '#4a8f3f',
    grassLight: '#6cc05e',
    grassDark: '#357a2d',
    grassTip: '#8ed87a',
    stone: '#8a8a7a',
  },
  platform: {
    normal: { top: '#5a8a4a', side: '#3a6a2a', grass: '#6db87a' },
    metal: { top: '#6a7a8a', side: '#4a5a6a', highlight: '#9aaaba' },
    floating: { top: '#5a6a9a', side: '#3a4a6a', glow: 'rgba(100,160,255,0.3)' },
  },
  player: {
    skin: '#e0b080',
    skinLight: '#f0c8a0',
    skinShadow: '#c08a58',
    hair: '#3a2820',
    helmet: '#4a6838',
    helmetLight: '#5a8848',
    helmetDark: '#3a5528',
    helmetBand: '#3a5a2a',
    helmetStrap: '#4a4a30',
    shirt: '#4a6838',
    shirtLight: '#5a7a48',
    shirtDark: '#3a5528',
    shirtCamo1: '#5a7848',
    shirtCamo2: '#3a5830',
    pants: '#5a5a38',
    pantsLight: '#6a6a48',
    pantsDark: '#4a4a28',
    pantsKnee: '#4e4e30',
    boots: '#282828',
    bootsHighlight: '#383838',
    bootsSole: '#1a1a1a',
    bootsLace: '#555',
    belt: '#5a4a28',
    beltBuckle: '#bba833',
    pouch: '#4a3a22',
    vest: '#555540',
    vestPouch: '#4a4a38',
    jetpack: '#5a5a5a',
    jetpackLight: '#7a7a7a',
    jetpackDark: '#3a3a3a',
    jetpackTank: '#6a4a3a',
    flame: ['#ff6622', '#ffaa22', '#ffdd44'],
    gun: '#4a4a4a',
    gunLight: '#666666',
    gunDark: '#333333',
    gunBarrel: '#555555',
    glove: '#4a5a3a',
  },
  enemy: {
    grunt: { body: '#3da34d', bodyLight: '#5cc06c', bodyDark: '#2a8a3a', eye: '#ffffff', pupil: '#111111', teeth: '#eee', drool: '#8f8' },
    spitter: { body: '#4a9a7a', bodyLight: '#6abba0', bodyDark: '#387a5a', eye: '#ffe844', pupil: '#332200', spit: '#88ff44', tentacle: '#3a8a6a', spot: '#5aaa88' },
    flyer: { body: '#5578bb', bodyLight: '#7799dd', bodyDark: '#3a5588', wing: '#4466aa', wingMembrane: 'rgba(80,120,200,0.5)', eye: '#ff3333', eyeGlow: 'rgba(255,50,50,0.4)', stinger: '#3355aa' },
    brute: { body: '#cc8844', bodyLight: '#eeaa66', bodyDark: '#aa6622', eye: '#ff2222', armor: '#996622', armorLight: '#bb8833', armorRivet: '#dda844', fist: '#aa5500', scar: '#8a4400' },
    boss: { body: '#cc2233', bodyLight: '#ee4455', bodyDark: '#991122', eye: '#ffff00', crown: '#ffaa00', crownGem: '#ff2244', aura: 'rgba(255,50,50,0.15)', spike: '#aa1122', mouth: '#880000', teeth: '#fff', armGlow: 'rgba(255,100,100,0.3)' },
  },
  bullet: {
    player: '#ffcc22',
    playerGlow: 'rgba(255,204,34,0.5)',
    playerCore: '#ffffaa',
    enemy: '#ff4444',
    enemyGlow: 'rgba(255,68,68,0.4)',
    enemyCore: '#ffaaaa',
  },
  hud: {
    health: '#44dd55',
    healthBg: 'rgba(0,0,0,0.3)',
    fuel: '#44aaff',
    fuelBg: 'rgba(0,0,0,0.3)',
    text: '#ffffff',
    textShadow: '#000000',
    panelBg: 'rgba(0,0,0,0.45)',
    panelBorder: 'rgba(255,255,255,0.15)',
  },
}

// ─── Background ───
export function drawBackground(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH)
  grad.addColorStop(0, COLORS.sky.top)
  grad.addColorStop(0.35, COLORS.sky.mid)
  grad.addColorStop(0.7, COLORS.sky.bottom)
  grad.addColorStop(1, COLORS.sky.horizon)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Sun with rays
  const sunX = canvasW * 0.82
  const sunY = 70
  // Outer glow
  const glowGrad2 = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180)
  glowGrad2.addColorStop(0, 'rgba(255,244,200,0.3)')
  glowGrad2.addColorStop(0.4, 'rgba(255,244,200,0.08)')
  glowGrad2.addColorStop(1, 'rgba(255,244,200,0)')
  ctx.fillStyle = glowGrad2
  ctx.fillRect(sunX - 180, sunY - 180, 360, 360)
  // Inner glow
  const glowGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 80)
  glowGrad.addColorStop(0, 'rgba(255,248,220,0.5)')
  glowGrad.addColorStop(0.5, 'rgba(255,244,200,0.15)')
  glowGrad.addColorStop(1, 'rgba(255,244,200,0)')
  ctx.fillStyle = glowGrad
  ctx.fillRect(sunX - 80, sunY - 80, 160, 160)
  // Sun disc
  ctx.fillStyle = COLORS.sun
  ctx.beginPath()
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2)
  ctx.fill()
  // Sun core
  ctx.fillStyle = '#fffef5'
  ctx.beginPath()
  ctx.arc(sunX, sunY, 18, 0, Math.PI * 2)
  ctx.fill()
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], cameraX: number) {
  // Clouds - multi-puff shapes for realism
  for (const star of stars) {
    if (star.size < 0.8) continue
    const sx = ((star.x - cameraX * star.speed) % (ctx.canvas.width + 200) + ctx.canvas.width + 200) % (ctx.canvas.width + 200)
    const sy = star.y * 0.45 + 20
    const s = star.size
    ctx.globalAlpha = star.brightness * 0.25
    // Cloud shadow
    ctx.fillStyle = COLORS.cloudShadow
    ctx.beginPath()
    ctx.ellipse(sx, sy + 2, s * 10, s * 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
    // Main cloud body (multiple overlapping ellipses)
    ctx.fillStyle = COLORS.clouds
    ctx.beginPath()
    ctx.ellipse(sx - s * 4, sy, s * 5, s * 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(sx, sy - s * 1.2, s * 6, s * 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(sx + s * 4, sy, s * 5, s * 2.8, 0, 0, Math.PI * 2)
    ctx.fill()
    // Cloud highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.ellipse(sx - s * 1, sy - s * 2, s * 4, s * 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawParallaxMountains(ctx: CanvasRenderingContext2D, cameraX: number, canvasW: number, canvasH: number) {
  // Layer 1: Far distant mountains (blue/hazy)
  drawDetailedMountainLayer(ctx, cameraX * 0.04, canvasW, canvasH, 0.5, 90, 170, '#8aaace', '#a0bede', true)
  // Atmospheric haze between layers
  ctx.fillStyle = 'rgba(168,216,240,0.25)'
  ctx.fillRect(0, canvasH * 0.45, canvasW, canvasH * 0.15)
  // Layer 2: Mid-distance mountains (blue-green)
  drawDetailedMountainLayer(ctx, cameraX * 0.08, canvasW, canvasH, 0.58, 70, 150, '#6a9a7a', '#80aa8e', true)
  // Layer 3: Nearer green mountains
  drawDetailedMountainLayer(ctx, cameraX * 0.15, canvasW, canvasH, 0.68, 50, 120, '#4a8a4a', '#5a9a5a', false)
  // Layer 4: Close rolling hills
  drawHillLayer(ctx, cameraX * 0.22, canvasW, canvasH, 0.76, 30, 70, '#3a7a2a', '#4a8a3a')
  // Layer 5: Treeline with detailed trees
  drawDetailedTreeline(ctx, cameraX * 0.28, canvasW, canvasH, 0.80)
}

function drawDetailedMountainLayer(
  ctx: CanvasRenderingContext2D, offset: number, w: number, h: number,
  yRatio: number, minH: number, maxH: number,
  color: string, lightColor: string, showSnow: boolean
) {
  const baseY = h * yRatio
  const step = 50
  const totalWidth = w + 250
  const startX = -(offset % step) - 100

  // Build mountain path
  ctx.beginPath()
  ctx.moveTo(-10, h)
  const peaks: { x: number; y: number }[] = []
  for (let x = startX; x < totalWidth; x += step) {
    const seed = Math.abs(Math.sin((x + offset) * 0.0073) * 10000)
    const seed2 = Math.abs(Math.cos((x + offset) * 0.011) * 10000)
    const peakH = minH + ((seed % 1000) / 1000) * (maxH - minH)
    const variation = Math.sin(seed2 * 0.01) * 15
    const peakY = baseY - peakH + variation
    peaks.push({ x, y: peakY })
    ctx.lineTo(x, peakY)
  }
  ctx.lineTo(w + 200, h)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()

  // Light side highlight
  ctx.beginPath()
  for (let i = 0; i < peaks.length - 1; i++) {
    const p = peaks[i]
    const pn = peaks[i + 1]
    if (i === 0) ctx.moveTo(p.x, p.y)
    const midX = (p.x + pn.x) / 2
    const midY = Math.max(p.y, pn.y) + 10
    ctx.quadraticCurveTo(midX, midY, pn.x, pn.y)
  }
  const lastP = peaks[peaks.length - 1]
  ctx.lineTo(lastP.x, baseY + 20)
  ctx.lineTo(peaks[0].x, baseY + 20)
  ctx.closePath()
  ctx.fillStyle = lightColor
  ctx.globalAlpha = 0.3
  ctx.fill()
  ctx.globalAlpha = 1

  // Snow caps on tallest peaks
  if (showSnow) {
    for (const p of peaks) {
      if (p.y < baseY - maxH * 0.65) {
        ctx.fillStyle = 'rgba(240,248,255,0.6)'
        ctx.beginPath()
        ctx.moveTo(p.x - 12, p.y + 12)
        ctx.lineTo(p.x, p.y - 2)
        ctx.lineTo(p.x + 12, p.y + 10)
        ctx.closePath()
        ctx.fill()
      }
    }
  }
}

function drawHillLayer(
  ctx: CanvasRenderingContext2D, offset: number, w: number, h: number,
  yRatio: number, minH: number, maxH: number, color: string, lightColor: string
) {
  const baseY = h * yRatio
  ctx.beginPath()
  ctx.moveTo(-10, h)
  for (let x = -(offset % 90) - 90; x < w + 100; x += 45) {
    const seed = Math.sin((x + offset) * 0.015) * 0.5 + Math.sin((x + offset) * 0.008) * 0.5
    const hillY = baseY - minH - (seed * 0.5 + 0.5) * (maxH - minH)
    ctx.lineTo(x, hillY)
  }
  ctx.lineTo(w + 100, h)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  // Highlight
  ctx.globalAlpha = 0.2
  ctx.fillStyle = lightColor
  ctx.fillRect(0, baseY - maxH, w, maxH * 0.3)
  ctx.globalAlpha = 1
}

function drawDetailedTreeline(ctx: CanvasRenderingContext2D, offset: number, w: number, h: number, yRatio: number) {
  const baseY = h * yRatio
  const step = 14
  const startX = -(offset % step) - step

  for (let x = startX; x < w + 30; x += step) {
    const seed = Math.abs(Math.sin((x + offset) * 0.047) * 1000)
    const treeH = 18 + (seed % 22)
    const trunkW = 2 + (seed % 2)
    const crownW = 6 + (seed % 6)

    // Trunk
    ctx.fillStyle = '#4a3a20'
    ctx.fillRect(x + crownW / 2 - trunkW / 2, baseY - 3, trunkW, 5)

    // Pine tree shape (multiple triangle layers)
    const layers = 3
    for (let l = 0; l < layers; l++) {
      const layerY = baseY - treeH + l * (treeH / layers) * 0.55
      const layerW = crownW * (1 - l * 0.15)
      const layerH = treeH / layers + 4
      ctx.fillStyle = l === 0 ? '#2a6a1e' : l === 1 ? '#358028' : '#3a6a2a'
      ctx.beginPath()
      ctx.moveTo(x + crownW / 2, layerY)
      ctx.lineTo(x + crownW / 2 - layerW, layerY + layerH)
      ctx.lineTo(x + crownW / 2 + layerW, layerY + layerH)
      ctx.closePath()
      ctx.fill()
    }
  }
}

// ─── Ground ───
export function drawGround(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, canvasW: number, canvasH: number, groundY: number) {
  const gx = -((cameraX) % 64)
  const gy = groundY - cameraY

  // Main dirt fill with gradient
  const dirtGrad = ctx.createLinearGradient(0, gy, 0, canvasH)
  dirtGrad.addColorStop(0, COLORS.ground.dirt)
  dirtGrad.addColorStop(0.15, COLORS.ground.dirtDark)
  dirtGrad.addColorStop(0.5, COLORS.ground.dirtDeep)
  dirtGrad.addColorStop(1, '#1a0e05')
  ctx.fillStyle = dirtGrad
  ctx.fillRect(0, gy + 6, canvasW, canvasH - gy)

  // Rock/stone layer
  ctx.fillStyle = COLORS.ground.stone
  ctx.globalAlpha = 0.15
  for (let rx = gx; rx < canvasW + 64; rx += 30) {
    const seed = Math.abs(Math.sin(rx * 0.07 + cameraX * 0.07) * 100)
    if (seed % 4 < 1) {
      const rw = 8 + (seed % 12)
      const ry = gy + 30 + (seed % 30)
      roundRect(ctx, rx, ry, rw, rw * 0.6, 3)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1

  // Grass top strip (gradient)
  const grassGrad = ctx.createLinearGradient(0, gy - 2, 0, gy + 10)
  grassGrad.addColorStop(0, COLORS.ground.grassLight)
  grassGrad.addColorStop(0.4, COLORS.ground.grass)
  grassGrad.addColorStop(1, COLORS.ground.grassDark)
  ctx.fillStyle = grassGrad
  ctx.fillRect(0, gy, canvasW, 10)

  // Grass highlight stripe
  ctx.fillStyle = COLORS.ground.grassTip
  ctx.globalAlpha = 0.4
  ctx.fillRect(0, gy, canvasW, 2)
  ctx.globalAlpha = 1

  // Grass blades (varied sizes and shades)
  for (let bx = gx; bx < canvasW + 20; bx += 3) {
    const seed = Math.sin(bx * 0.4 + cameraX * 0.4) * 1000
    const bladeH = 3 + Math.abs(seed % 7)
    const sway = Math.sin(bx * 0.08 + Date.now() * 0.001) * 1.5
    ctx.fillStyle = Math.abs(seed) % 3 < 1 ? COLORS.ground.grassTip : COLORS.ground.grassLight
    ctx.globalAlpha = 0.8
    ctx.save()
    ctx.translate(bx + sway, gy)
    ctx.fillRect(0, -bladeH, 1.5, bladeH)
    ctx.restore()
  }
  ctx.globalAlpha = 1

  // Dirt texture - pebbles and root hints
  ctx.fillStyle = COLORS.ground.dirtLight
  for (let px = gx; px < canvasW + 64; px += 48) {
    for (let py = gy + 14; py < Math.min(canvasH, gy + 70); py += 14) {
      const seed = Math.abs(Math.sin(px * 0.12 + py * 0.18) * 100)
      if (seed % 3 < 1) {
        ctx.beginPath()
        ctx.arc(px + (seed % 10), py, 1 + (seed % 2), 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Worm/root lines
  ctx.strokeStyle = COLORS.ground.dirtLight
  ctx.globalAlpha = 0.15
  ctx.lineWidth = 1
  for (let wx = gx; wx < canvasW + 64; wx += 100) {
    const seed = Math.abs(Math.sin(wx * 0.03 + cameraX * 0.03) * 100)
    if (seed % 3 < 1) {
      ctx.beginPath()
      ctx.moveTo(wx, gy + 18 + (seed % 20))
      ctx.quadraticCurveTo(wx + 15, gy + 14 + (seed % 25), wx + 30, gy + 20 + (seed % 20))
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

// ─── Platforms ───
export function drawPlatform(ctx: CanvasRenderingContext2D, platform: Platform, cameraX: number, cameraY: number) {
  const x = platform.x - cameraX
  const y = platform.y - cameraY + (platform.type === 'floating' ? Math.sin((Date.now() * 0.002) + (platform.floatOffset || 0)) * 6 : 0)
  const w = platform.width
  const h = platform.height

  const colors = COLORS.platform[platform.type]

  if (platform.type === 'floating') {
    ctx.shadowColor = COLORS.platform.floating.glow
    ctx.shadowBlur = 10
  }

  // Side face
  ctx.fillStyle = colors.side
  roundRect(ctx, x, y + 4, w, h - 4, 3)
  ctx.fill()

  // Top face
  const topGrad = ctx.createLinearGradient(x, y, x, y + 6)
  topGrad.addColorStop(0, colors.top)
  topGrad.addColorStop(1, colors.side)
  ctx.fillStyle = topGrad
  roundRect(ctx, x, y, w, 8, 3)
  ctx.fill()

  // Grass on normal
  if (platform.type === 'normal') {
    ctx.fillStyle = (colors as typeof COLORS.platform.normal).grass
    for (let gx = x + 2; gx < x + w - 2; gx += 4) {
      const gh = 3 + Math.sin(gx * 0.3) * 2
      ctx.fillRect(gx, y - gh, 1.5, gh)
    }
  }

  // Metal rivets and stripes
  if (platform.type === 'metal') {
    ctx.fillStyle = (colors as typeof COLORS.platform.metal).highlight
    for (let rx = x + 10; rx < x + w - 10; rx += 20) {
      ctx.beginPath()
      ctx.arc(rx, y + h / 2 + 2, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    for (let sx = x + 5; sx < x + w - 5; sx += 12) {
      ctx.beginPath()
      ctx.moveTo(sx, y + 2)
      ctx.lineTo(sx + 6, y + h - 2)
      ctx.stroke()
    }
  }

  ctx.shadowBlur = 0
}

// ─── Player (Detailed Human Soldier) ───
export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, cameraX: number, cameraY: number) {
  const px = player.x - cameraX
  const py = player.y - cameraY
  const f = player.facing

  // Invincibility flash
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  ctx.save()
  ctx.translate(px + player.width / 2, py + player.height / 2)
  if (f === -1) ctx.scale(-1, 1)

  const hw = player.width / 2
  const hh = player.height / 2

  // ─ JETPACK (behind body) ─
  // Main housing
  ctx.fillStyle = COLORS.player.jetpackDark
  roundRect(ctx, -hw - 8, -hh + 8, 10, 23, 3)
  ctx.fill()
  ctx.fillStyle = COLORS.player.jetpack
  roundRect(ctx, -hw - 7, -hh + 9, 8, 21, 2)
  ctx.fill()
  // Fuel tanks
  ctx.fillStyle = COLORS.player.jetpackTank
  roundRect(ctx, -hw - 10, -hh + 10, 4, 17, 2)
  ctx.fill()
  ctx.fillStyle = '#7a5a4a'
  ctx.fillRect(-hw - 9, -hh + 11, 2, 15)
  // Tank caps
  ctx.fillStyle = '#999'
  roundRect(ctx, -hw - 10, -hh + 9, 4, 2, 1)
  ctx.fill()
  roundRect(ctx, -hw - 10, -hh + 27, 4, 2, 1)
  ctx.fill()
  // Connecting pipes
  ctx.strokeStyle = '#777'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-hw - 3, -hh + 14)
  ctx.lineTo(-hw + 2, -hh + 13)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-hw - 3, -hh + 22)
  ctx.lineTo(-hw + 2, -hh + 21)
  ctx.stroke()
  // Nozzle
  ctx.fillStyle = '#3a3a3a'
  roundRect(ctx, -hw - 7, -hh + 29, 8, 5, 2)
  ctx.fill()
  ctx.fillStyle = '#555'
  ctx.fillRect(-hw - 5, -hh + 30, 4, 3)
  // LED indicator
  ctx.fillStyle = player.jetpackFuel > 10 ? '#44ff44' : '#ff4444'
  ctx.shadowColor = player.jetpackFuel > 10 ? '#44ff44' : '#ff4444'
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.arc(-hw - 3, -hh + 12, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // ─ LEGS (improved walking animation with hip rotation and foot lift) ─
  const isMoving = player.vx !== 0
  const walkT = player.animFrame * 0.22
  const walking = isMoving && player.onGround
  // More natural leg phases using sine with asymmetry (faster forward, slower back)
  const leftRaw = walking ? Math.sin(walkT) : 0
  const rightRaw = walking ? Math.sin(walkT + Math.PI) : 0
  // Asymmetric: forward swing is faster/sharper, back swing is slower
  const leftPhase = walking ? (leftRaw > 0 ? leftRaw : leftRaw * 0.7) : 0
  const rightPhase = walking ? (rightRaw > 0 ? rightRaw : rightRaw * 0.7) : 0
  const legSpreadAir = player.onGround ? 0 : 3
  // Body bob - slight vertical bounce when walking
  const bodyBob = walking ? Math.abs(Math.sin(walkT * 2)) * 1.5 : 0

  // Draw one leg with improved articulation
  const drawLeg = (phase: number, xOff: number) => {
    // Hip drives the thigh forward/back
    const hipSwing = phase * 9
    // Knee bends more when leg is behind (negative phase) for a natural push-off
    const kneeFlexion = phase < 0 ? Math.abs(phase) * 10 : Math.abs(phase) * 4
    // Foot lifts off ground during swing phase (when moving forward)
    const footLift = phase > 0.3 ? (phase - 0.3) * 8 : 0

    const thighX = xOff - legSpreadAir * Math.sign(xOff) + hipSwing
    const thighY = hh - 15 - bodyBob

    // Thigh - slight rotation effect via offset
    ctx.fillStyle = COLORS.player.pants
    ctx.fillRect(thighX - 1, thighY, 7, 8)
    ctx.fillStyle = COLORS.player.pantsLight
    ctx.fillRect(thighX, thighY + 1, 2, 6)

    // Knee pad
    ctx.fillStyle = COLORS.player.pantsKnee
    ctx.beginPath()
    ctx.arc(thighX + 3, thighY + 8, 3, 0, Math.PI * 2)
    ctx.fill()

    // Shin - offset by knee bend, creating a more natural angle
    const shinX = thighX - kneeFlexion * 0.2
    const shinY = thighY + 7 - footLift
    ctx.fillStyle = COLORS.player.pants
    ctx.fillRect(shinX - 1, shinY, 7, 7)
    ctx.fillStyle = COLORS.player.pantsDark
    ctx.fillRect(shinX + 4, shinY + 1, 1, 5)

    // Boot - lifts with foot
    const bootY = shinY + 6 - footLift * 0.3
    ctx.fillStyle = COLORS.player.boots
    roundRect(ctx, shinX - 2, bootY, 9, 5, 2)
    ctx.fill()
    // Boot highlight
    ctx.fillStyle = COLORS.player.bootsHighlight
    ctx.fillRect(shinX, bootY + 1, 4, 1.5)
    // Sole
    ctx.fillStyle = COLORS.player.bootsSole
    ctx.fillRect(shinX - 2, bootY + 4, 9, 2)
    // Laces
    ctx.strokeStyle = COLORS.player.bootsLace
    ctx.lineWidth = 0.5
    for (let ly = bootY + 1; ly < bootY + 4; ly += 2) {
      ctx.beginPath()
      ctx.moveTo(shinX, ly)
      ctx.lineTo(shinX + 4, ly)
      ctx.stroke()
    }
  }

  // Draw back leg first, then front
  drawLeg(rightPhase, 1)
  drawLeg(leftPhase, -5)

  // ─ TORSO ─
  // Tactical vest / body armor
  ctx.fillStyle = COLORS.player.vest
  roundRect(ctx, -hw + 2, -hh + 9, player.width - 4, 21, 3)
  ctx.fill()
  // Vest padding lines
  ctx.strokeStyle = COLORS.player.vestPouch
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(-hw + 4, -hh + 15)
  ctx.lineTo(hw - 4, -hh + 15)
  ctx.stroke()
  // Shirt underneath (visible at sides)
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(-hw + 2, -hh + 10, 3, 18)
  ctx.fillRect(hw - 5, -hh + 10, 3, 18)
  // Camo patches on shirt
  ctx.fillStyle = COLORS.player.shirtCamo1
  ctx.globalAlpha = 0.4
  roundRect(ctx, -hw + 4, -hh + 12, 5, 6, 2)
  ctx.fill()
  roundRect(ctx, hw - 9, -hh + 16, 4, 5, 1)
  ctx.fill()
  ctx.globalAlpha = 1
  // Chest pouches on vest
  ctx.fillStyle = COLORS.player.vestPouch
  roundRect(ctx, -hw + 5, -hh + 17, 6, 5, 1)
  ctx.fill()
  roundRect(ctx, hw - 10, -hh + 17, 6, 5, 1)
  ctx.fill()
  // Pouch button
  ctx.fillStyle = '#666'
  ctx.beginPath()
  ctx.arc(-hw + 8, -hh + 18, 0.8, 0, Math.PI * 2)
  ctx.fill()
  // Name tape area
  ctx.fillStyle = '#5a5a40'
  ctx.fillRect(-2, -hh + 12, 10, 3)
  ctx.fillStyle = '#888'
  ctx.font = '2px sans-serif'

  // Belt
  ctx.fillStyle = COLORS.player.belt
  ctx.fillRect(-hw + 2, -hh + 28, player.width - 4, 4)
  // Belt buckle
  ctx.fillStyle = COLORS.player.beltBuckle
  roundRect(ctx, -2, -hh + 27, 6, 6, 1)
  ctx.fill()
  // Buckle center
  ctx.fillStyle = '#ddc044'
  ctx.fillRect(0, -hh + 29, 2, 2)
  // Belt pouches
  ctx.fillStyle = COLORS.player.pouch
  roundRect(ctx, -hw + 3, -hh + 27, 5, 5, 1)
  ctx.fill()
  roundRect(ctx, hw - 7, -hh + 27, 5, 5, 1)
  ctx.fill()
  // Canteen on belt
  ctx.fillStyle = '#5a6a4a'
  roundRect(ctx, hw - 9, -hh + 26, 4, 7, 2)
  ctx.fill()

  // ─ BACK ARM (behind body) ─
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(-hw, -hh + 11, 5, 15)
  ctx.fillStyle = COLORS.player.glove
  ctx.fillRect(-hw, -hh + 24, 5, 4)

  // ─ FRONT ARM + GUN (rotated to aim angle) ─
  const recoil = player.shootCooldown > 0.1 ? -2 : 0
  const shoulderX = hw - 4
  const shoulderY = -hh + 16

  let drawAngle = player.aimAngle
  if (f === -1) {
    drawAngle = Math.PI - player.aimAngle
  }
  drawAngle = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, drawAngle))

  ctx.save()
  ctx.translate(shoulderX, shoulderY)
  ctx.rotate(drawAngle)

  // Upper arm
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(-2, -3, 10, 6)
  // Forearm
  ctx.fillStyle = COLORS.player.shirtDark
  ctx.fillRect(6, -2.5, 6, 5)
  // Glove/hand
  ctx.fillStyle = COLORS.player.glove
  ctx.fillRect(10, -2, 7 + recoil, 5)

  // Gun - detailed assault rifle
  const gunX = 15 + recoil
  const gunY = -3.5
  // Gun body / receiver
  ctx.fillStyle = COLORS.player.gunDark
  roundRect(ctx, gunX, gunY, 18, 7, 1)
  ctx.fill()
  // Grip
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(gunX + 7, gunY + 6, 4, 5)
  // Trigger guard
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(gunX + 7, gunY + 6)
  ctx.quadraticCurveTo(gunX + 9, gunY + 10, gunX + 11, gunY + 6)
  ctx.stroke()
  // Barrel
  ctx.fillStyle = COLORS.player.gunBarrel
  ctx.fillRect(gunX + 16, gunY + 1.5, 9, 3)
  // Barrel tip / flash suppressor
  ctx.fillStyle = '#444'
  roundRect(ctx, gunX + 24, gunY + 0.5, 4, 5, 1)
  ctx.fill()
  // Magazine
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(gunX + 3, gunY + 6, 4, 7)
  ctx.fillStyle = '#222'
  ctx.fillRect(gunX + 3, gunY + 11, 4, 2) // mag base
  // Scope
  ctx.fillStyle = '#505050'
  roundRect(ctx, gunX + 6, gunY - 4, 10, 3.5, 1.5)
  ctx.fill()
  // Scope lens
  ctx.fillStyle = '#4488cc'
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.arc(gunX + 15, gunY - 2.2, 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  // Scope lens glint
  ctx.fillStyle = '#aaddff'
  ctx.beginPath()
  ctx.arc(gunX + 14.5, gunY - 2.8, 0.6, 0, Math.PI * 2)
  ctx.fill()
  // Rail on top
  ctx.fillStyle = '#4a4a4a'
  ctx.fillRect(gunX + 2, gunY - 0.5, 14, 1)
  // Gun highlight
  ctx.fillStyle = COLORS.player.gunLight
  ctx.fillRect(gunX + 2, gunY + 1.5, 12, 0.8)
  // Stock
  ctx.fillStyle = '#4a3a28'
  roundRect(ctx, gunX - 7, gunY + 0.5, 9, 5, 2)
  ctx.fill()
  ctx.fillStyle = '#5a4a38'
  ctx.fillRect(gunX - 5, gunY + 1.5, 6, 2)
  // Forward grip
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(gunX + 13, gunY + 6, 3, 4)

  // Muzzle flash
  if (player.shootCooldown > 0.12) {
    ctx.globalAlpha = 0.9
    const flashGrad = ctx.createRadialGradient(gunX + 30, gunY + 2, 0, gunX + 30, gunY + 2, 12)
    flashGrad.addColorStop(0, '#ffffff')
    flashGrad.addColorStop(0.2, '#ffffaa')
    flashGrad.addColorStop(0.4, '#ffaa00')
    flashGrad.addColorStop(0.7, '#ff6600')
    flashGrad.addColorStop(1, 'rgba(255,100,0,0)')
    ctx.fillStyle = flashGrad
    ctx.beginPath()
    ctx.arc(gunX + 30, gunY + 2, 12, 0, Math.PI * 2)
    ctx.fill()
    // Flash spikes
    ctx.strokeStyle = '#ffdd44'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.6
    for (let i = 0; i < 4; i++) {
      const sAngle = (i / 4) * Math.PI * 2 + Date.now() * 0.01
      ctx.beginPath()
      ctx.moveTo(gunX + 30, gunY + 2)
      ctx.lineTo(gunX + 30 + Math.cos(sAngle) * 14, gunY + 2 + Math.sin(sAngle) * 14)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  ctx.restore()

  // ─ NECK ─
  ctx.fillStyle = COLORS.player.skin
  ctx.fillRect(-2, -hh + 6, 6, 5)
  // Neck shadow
  ctx.fillStyle = COLORS.player.skinShadow
  ctx.fillRect(-2, -hh + 9, 6, 2)

  // ─ HEAD ─
  // Helmet
  ctx.fillStyle = COLORS.player.helmet
  roundRect(ctx, -8, -hh - 7, 18, 16, 6)
  ctx.fill()
  // Helmet top highlight
  ctx.fillStyle = COLORS.player.helmetLight
  roundRect(ctx, -6, -hh - 6, 10, 7, 4)
  ctx.fill()
  // Helmet dark bottom edge
  ctx.fillStyle = COLORS.player.helmetDark
  ctx.fillRect(-8, -hh + 4, 18, 3)
  // Helmet rim
  ctx.fillStyle = COLORS.player.helmetBand
  ctx.fillRect(-8, -hh + 2, 18, 3)
  // Goggle strap
  ctx.fillStyle = COLORS.player.helmetStrap
  ctx.fillRect(-8, -hh, 18, 2)
  // Helmet chin strap
  ctx.strokeStyle = COLORS.player.helmetStrap
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(8, -hh + 4)
  ctx.quadraticCurveTo(10, -hh + 8, 8, -hh + 10)
  ctx.stroke()

  // Face area
  ctx.fillStyle = COLORS.player.skin
  roundRect(ctx, -4, -hh + 1, 13, 11, 3)
  ctx.fill()
  // Cheek shadow
  ctx.fillStyle = COLORS.player.skinShadow
  ctx.globalAlpha = 0.3
  roundRect(ctx, -3, -hh + 7, 10, 5, 2)
  ctx.fill()
  ctx.globalAlpha = 1
  // Jaw
  ctx.fillStyle = COLORS.player.skinShadow
  roundRect(ctx, -2, -hh + 8, 9, 4, 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 2, -hh + 3, 6, 3.5, 1.5)
  ctx.fill()
  // Iris
  ctx.fillStyle = '#3a6a3a'
  ctx.beginPath()
  ctx.arc(5.5, -hh + 4.8, 1.8, 0, Math.PI * 2)
  ctx.fill()
  // Pupil
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(5.5, -hh + 4.8, 0.9, 0, Math.PI * 2)
  ctx.fill()
  // Eye highlight
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(6.2, -hh + 4.2, 0.5, 0, Math.PI * 2)
  ctx.fill()
  // Eyebrow
  ctx.strokeStyle = COLORS.player.hair
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(1, -hh + 1.5)
  ctx.lineTo(8, -hh + 1)
  ctx.stroke()
  // Nose
  ctx.fillStyle = COLORS.player.skinShadow
  ctx.beginPath()
  ctx.moveTo(7, -hh + 5)
  ctx.lineTo(8.5, -hh + 7)
  ctx.lineTo(6, -hh + 7)
  ctx.closePath()
  ctx.fill()
  // Mouth
  ctx.strokeStyle = '#a07050'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(2, -hh + 9.5)
  ctx.quadraticCurveTo(4.5, -hh + 10.5, 7, -hh + 9.5)
  ctx.stroke()

  // Ear
  ctx.fillStyle = COLORS.player.skin
  ctx.beginPath()
  ctx.ellipse(-5, -hh + 5, 2.5, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = COLORS.player.skinShadow
  ctx.beginPath()
  ctx.ellipse(-5, -hh + 5, 1.2, 2, 0, 0, Math.PI * 2)
  ctx.fill()

  // ─ DOG TAGS ─
  ctx.strokeStyle = '#aaa'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(1, -hh + 8)
  ctx.quadraticCurveTo(2, -hh + 14, 1, -hh + 16)
  ctx.stroke()
  ctx.fillStyle = '#ccc'
  roundRect(ctx, -1, -hh + 15, 4, 3, 1)
  ctx.fill()
  ctx.fillStyle = '#bbb'
  roundRect(ctx, 0, -hh + 16, 3, 2.5, 0.5)
  ctx.fill()

  ctx.restore()
  ctx.globalAlpha = 1
}

// ─── Player Zoomed (for home screen) ───
export function drawPlayerZoomed(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 3) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // Simplified soldier at origin (centered)
  const hw = 12
  const hh = 20

  // ─ JETPACK ─
  ctx.fillStyle = COLORS.player.jetpackDark
  roundRect(ctx, -hw - 8, -hh + 8, 10, 23, 3)
  ctx.fill()
  ctx.fillStyle = COLORS.player.jetpack
  roundRect(ctx, -hw - 7, -hh + 9, 8, 21, 2)
  ctx.fill()
  ctx.fillStyle = COLORS.player.jetpackTank
  roundRect(ctx, -hw - 10, -hh + 10, 4, 17, 2)
  ctx.fill()
  ctx.fillStyle = '#7a5a4a'
  ctx.fillRect(-hw - 9, -hh + 11, 2, 15)
  ctx.fillStyle = '#999'
  roundRect(ctx, -hw - 10, -hh + 9, 4, 2, 1)
  ctx.fill()
  ctx.fillStyle = '#3a3a3a'
  roundRect(ctx, -hw - 7, -hh + 29, 8, 5, 2)
  ctx.fill()
  ctx.fillStyle = '#44ff44'
  ctx.shadowColor = '#44ff44'
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.arc(-hw - 3, -hh + 12, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // ─ LEGS ─
  const drawLeg = (xOff: number) => {
    ctx.fillStyle = COLORS.player.pants
    ctx.fillRect(xOff - 1, hh - 15, 7, 8)
    ctx.fillStyle = COLORS.player.pantsLight
    ctx.fillRect(xOff, hh - 14, 2, 6)
    ctx.fillStyle = COLORS.player.pantsKnee
    ctx.beginPath()
    ctx.arc(xOff + 3, hh - 7, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.player.pants
    ctx.fillRect(xOff - 1, hh - 8, 7, 7)
    ctx.fillStyle = COLORS.player.boots
    roundRect(ctx, xOff - 2, hh - 2, 9, 5, 2)
    ctx.fill()
    ctx.fillStyle = COLORS.player.bootsSole
    ctx.fillRect(xOff - 2, hh + 2, 9, 2)
  }
  drawLeg(1)
  drawLeg(-5)

  // ─ TORSO ─
  ctx.fillStyle = COLORS.player.vest
  roundRect(ctx, -hw + 2, -hh + 9, 20, 21, 3)
  ctx.fill()
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(-hw + 2, -hh + 10, 3, 18)
  ctx.fillRect(hw - 5, -hh + 10, 3, 18)
  ctx.fillStyle = COLORS.player.vestPouch
  roundRect(ctx, -hw + 5, -hh + 17, 6, 5, 1)
  ctx.fill()
  roundRect(ctx, hw - 10, -hh + 17, 6, 5, 1)
  ctx.fill()

  // Belt
  ctx.fillStyle = COLORS.player.belt
  ctx.fillRect(-hw + 2, -hh + 28, 20, 4)
  ctx.fillStyle = COLORS.player.beltBuckle
  roundRect(ctx, -2, -hh + 28, 6, 4, 1)
  ctx.fill()

  // ─ NECK ─ (draw before arm so arm is on top)
  ctx.fillStyle = COLORS.player.skin
  ctx.fillRect(-2, -hh + 6, 6, 5)

  // ─ HEAD ─
  // Helmet - darker outline for visibility
  ctx.fillStyle = '#2a4a2a'
  roundRect(ctx, -10, -hh - 9, 22, 19, 7)
  ctx.fill()
  ctx.fillStyle = COLORS.player.helmet
  roundRect(ctx, -9, -hh - 8, 20, 17, 6)
  ctx.fill()
  ctx.fillStyle = COLORS.player.helmetLight
  roundRect(ctx, -7, -hh - 7, 12, 8, 4)
  ctx.fill()
  // Helmet rim
  ctx.fillStyle = '#2a4a2a'
  ctx.fillRect(-10, -hh + 4, 22, 4)
  // Helmet band
  ctx.fillStyle = '#5a6a5a'
  ctx.fillRect(-10, -hh + 2, 22, 3)
  // Chin strap
  ctx.strokeStyle = '#5a5a4a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(10, -hh + 5)
  ctx.quadraticCurveTo(13, -hh + 10, 10, -hh + 13)
  ctx.stroke()

  // Face - wider to show both eyes
  ctx.fillStyle = COLORS.player.skin
  roundRect(ctx, -7, -hh + 0, 18, 14, 4)
  ctx.fill()

  // Left Eye
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, -5, -hh + 2, 5, 4, 2)
  ctx.fill()
  ctx.fillStyle = '#3a6a3a'
  ctx.beginPath()
  ctx.arc(-2.5, -hh + 4, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(-2.5, -hh + 4, 0.7, 0, Math.PI * 2)
  ctx.fill()

  // Right Eye
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 4, -hh + 2, 5, 4, 2)
  ctx.fill()
  ctx.fillStyle = '#3a6a3a'
  ctx.beginPath()
  ctx.arc(6.5, -hh + 4, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(6.5, -hh + 4, 0.7, 0, Math.PI * 2)
  ctx.fill()
  
  // Eyebrows
  ctx.strokeStyle = COLORS.player.hair
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-6, -hh + 0.5)
  ctx.lineTo(-1, -hh + 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(3, -hh + 0)
  ctx.lineTo(8, -hh + 0.5)
  ctx.stroke()
  
  // Nose
  ctx.fillStyle = COLORS.player.skinShadow
  ctx.fillRect(1, -hh + 5, 2, 3)
  
  // Mouth - pink
  ctx.fillStyle = '#e88099'
  roundRect(ctx, -1, -hh + 10, 6, 2, 1)
  ctx.fill()

  // Ears
  ctx.fillStyle = COLORS.player.skin
  ctx.beginPath()
  ctx.ellipse(-8, -hh + 5, 2, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(12, -hh + 5, 2, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Dog tags
  ctx.strokeStyle = '#aaa'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(1, -hh + 8)
  ctx.quadraticCurveTo(2, -hh + 14, 1, -hh + 16)
  ctx.stroke()
  ctx.fillStyle = '#ccc'
  roundRect(ctx, -1, -hh + 15, 4, 3, 1)
  ctx.fill()

  // ─ ARM + GUN ─ (drawn last so it's in front)
  ctx.save()
  const shoulderX = hw - 2
  const shoulderY = -hh + 14
  ctx.translate(shoulderX, shoulderY)
  ctx.rotate(-0.1) // Slight horizontal angle
  
  // Upper arm
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(-2, -4, 14, 8)
  // Forearm/hand
  ctx.fillStyle = COLORS.player.skin
  ctx.fillRect(10, -3, 14, 6)
  
  // Gun - large and detailed (fully visible)
  const gunX = 22
  const gunY = -5
  // Gun body / receiver
  ctx.fillStyle = '#2a2a2a'
  roundRect(ctx, gunX, gunY, 28, 9, 2)
  ctx.fill()
  // Gun body highlight
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(gunX + 2, gunY + 1, 22, 2)
  // Barrel
  ctx.fillStyle = '#4a4a4a'
  ctx.fillRect(gunX + 26, gunY + 2, 16, 5)
  // Barrel tip / muzzle
  ctx.fillStyle = '#333'
  roundRect(ctx, gunX + 40, gunY + 1, 5, 7, 1)
  ctx.fill()
  // Muzzle holes
  ctx.fillStyle = '#222'
  ctx.fillRect(gunX + 43, gunY + 2, 2, 1)
  ctx.fillRect(gunX + 43, gunY + 5, 2, 1)
  // Magazine
  ctx.fillStyle = '#2a2a2a'
  roundRect(ctx, gunX + 6, gunY + 8, 6, 10, 1)
  ctx.fill()
  // Scope mount
  ctx.fillStyle = '#444'
  ctx.fillRect(gunX + 10, gunY - 2, 12, 3)
  // Scope tube
  ctx.fillStyle = '#555'
  roundRect(ctx, gunX + 8, gunY - 6, 16, 5, 2)
  ctx.fill()
  // Scope lens
  ctx.fillStyle = '#66aaff'
  ctx.shadowColor = '#66aaff'
  ctx.shadowBlur = 3
  ctx.beginPath()
  ctx.arc(gunX + 22, gunY - 3.5, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  // Stock
  ctx.fillStyle = '#5a4a3a'
  roundRect(ctx, gunX - 14, gunY + 0, 16, 8, 2)
  ctx.fill()
  // Stock detail
  ctx.fillStyle = '#4a3a2a'
  ctx.fillRect(gunX - 12, gunY + 3, 12, 2)
  // Grip
  ctx.fillStyle = '#3a3a3a'
  roundRect(ctx, gunX + 14, gunY + 7, 5, 8, 1)
  ctx.fill()
  
  ctx.restore()

  ctx.restore()
}

// ─── Enemies ───
export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, cameraX: number, cameraY: number) {
  const ex = enemy.x - cameraX
  const ey = enemy.y - cameraY
  const f = enemy.facing

  ctx.save()
  ctx.translate(ex + enemy.width / 2, ey + enemy.height / 2)
  if (f === -1) ctx.scale(-1, 1)

  switch (enemy.type) {
    case 'grunt': drawGrunt(ctx, enemy); break
    case 'spitter': drawSpitter(ctx, enemy); break
    case 'flyer': drawFlyer(ctx, enemy); break
    case 'brute': drawBrute(ctx, enemy); break
    case 'boss': drawBoss(ctx, enemy); break
  }

  ctx.restore()

  // Health bar for tougher enemies
  if (enemy.maxHealth > 2) {
    const barW = enemy.width
    const barH = 4
    const hpRatio = enemy.health / enemy.maxHealth
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    roundRect(ctx, ex, ey - 10, barW, barH, 2)
    ctx.fill()
    ctx.fillStyle = hpRatio > 0.5 ? '#44dd55' : hpRatio > 0.25 ? '#ddaa22' : '#dd2222'
    roundRect(ctx, ex, ey - 10, barW * hpRatio, barH, 2)
    ctx.fill()
  }
}

function drawGrunt(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.grunt
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const bob = Math.sin(enemy.animFrame * 0.15) * 2

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(0, hh, hw - 2, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Stubby legs with animation
  ctx.fillStyle = c.bodyDark
  const legAnim = Math.sin(enemy.animFrame * 0.2) * 4
  ctx.fillRect(-hw + 3 + legAnim, hh - 7, 7, 10)
  ctx.fillRect(hw - 10 - legAnim, hh - 7, 7, 10)
  // Feet
  ctx.fillStyle = c.bodyDark
  roundRect(ctx, -hw + 2 + legAnim, hh + 1, 9, 4, 2)
  ctx.fill()
  roundRect(ctx, hw - 11 - legAnim, hh + 1, 9, 4, 2)
  ctx.fill()

  // Body
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, bob, hw - 2, hh - 3, 0, 0, Math.PI * 2)
  ctx.fill()
  // Body lighter belly
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, bob + 3, hw - 7, hh - 9, 0, 0, Math.PI * 2)
  ctx.fill()
  // Spots/bumps
  ctx.fillStyle = c.bodyDark
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.arc(-6, bob - 2, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(4, bob + 2, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Small arms
  ctx.fillStyle = c.body
  ctx.fillRect(-hw - 2, bob - 4, 5, 8)
  ctx.fillRect(hw - 3, bob - 4, 5, 8)
  // Claws
  ctx.fillStyle = c.bodyDark
  ctx.beginPath()
  ctx.moveTo(-hw - 2, bob + 4)
  ctx.lineTo(-hw - 4, bob + 8)
  ctx.lineTo(-hw, bob + 4)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(hw + 2, bob + 4)
  ctx.lineTo(hw + 4, bob + 8)
  ctx.lineTo(hw, bob + 4)
  ctx.fill()

  // Eye (big single eye)
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(4, bob - 5, 7, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  // Eye outline
  ctx.strokeStyle = c.bodyDark
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(4, bob - 5, 7, 8, 0, 0, Math.PI * 2)
  ctx.stroke()
  // Pupil
  ctx.fillStyle = c.pupil
  ctx.beginPath()
  ctx.arc(6, bob - 5, 3.5, 0, Math.PI * 2)
  ctx.fill()
  // Eye highlight
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(3, bob - 7, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Mouth with teeth
  ctx.fillStyle = '#2a6a30'
  ctx.beginPath()
  ctx.ellipse(1, bob + 5, 7, 4, 0, 0, Math.PI)
  ctx.fill()
  ctx.fillStyle = c.teeth
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-4 + i * 3, bob + 3, 2, 3)
  }
  // Drool
  ctx.fillStyle = c.drool
  ctx.globalAlpha = 0.5 + Math.sin(enemy.animFrame * 0.1) * 0.3
  ctx.beginPath()
  ctx.ellipse(3, bob + 9, 1.5, 2 + Math.sin(enemy.animFrame * 0.08) * 1, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawSpitter(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.spitter
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const bob = Math.sin(enemy.animFrame * 0.12) * 2

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.ellipse(0, hh + 2, hw - 4, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Tentacle legs (3 wavy tentacles)
  ctx.lineWidth = 3
  for (let i = 0; i < 3; i++) {
    const tx = -8 + i * 8
    const tAngle = Math.sin(enemy.animFrame * 0.1 + i * 1.2) * 0.3
    ctx.strokeStyle = c.tentacle
    ctx.beginPath()
    ctx.moveTo(tx, hh - 6 + bob)
    ctx.quadraticCurveTo(tx + Math.sin(tAngle) * 10, hh + 4 + bob, tx + Math.sin(tAngle) * 5, hh + 14 + bob)
    ctx.stroke()
    // Sucker dots
    ctx.fillStyle = c.spot
    ctx.beginPath()
    ctx.arc(tx + Math.sin(tAngle) * 6, hh + 6 + bob, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Body (tall, organic)
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, bob, hw - 4, hh - 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, bob + 2, hw - 9, hh - 8, 0, 0, Math.PI * 2)
  ctx.fill()
  // Spots
  ctx.fillStyle = c.spot
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(-5, bob + 4, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(6, bob, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Head (wider top)
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(3, bob - hh + 6, 10, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head highlight
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(2, bob - hh + 4, 5, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes (two alien eyes)
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(0, bob - hh + 3, 3.5, 4, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(8, bob - hh + 5, 3, 3.5, 0.2, 0, Math.PI * 2)
  ctx.fill()
  // Slit pupils
  ctx.fillStyle = c.pupil
  ctx.beginPath()
  ctx.ellipse(1, bob - hh + 3, 1, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(9, bob - hh + 5, 1, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Mouth - open with acid drip
  ctx.fillStyle = c.bodyDark
  ctx.beginPath()
  ctx.ellipse(6, bob - hh + 10, 5, 3, 0, 0, Math.PI)
  ctx.fill()
  // Acid blob
  ctx.fillStyle = c.spit
  ctx.shadowColor = c.spit
  ctx.shadowBlur = 4
  const dripLen = 3 + Math.sin(enemy.animFrame * 0.08) * 3
  ctx.beginPath()
  ctx.ellipse(8, bob - hh + 12 + dripLen, 2.5, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawFlyer(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.flyer
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const flapAngle = Math.sin((enemy.floatAngle || 0) * 3) * 0.5

  // Wing membrane glow
  ctx.fillStyle = c.wingMembrane
  ctx.save()
  ctx.rotate(-0.2 + flapAngle)
  ctx.beginPath()
  ctx.ellipse(-hw + 2, -3, 18, 7, -0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.rotate(0.2 - flapAngle)
  ctx.beginPath()
  ctx.ellipse(hw - 2, -3, 18, 7, 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Wings (solid parts with veins)
  ctx.fillStyle = c.wing
  ctx.save()
  ctx.rotate(-0.25 + flapAngle)
  ctx.beginPath()
  ctx.ellipse(-hw + 2, -3, 15, 5, -0.15, 0, Math.PI * 2)
  ctx.fill()
  // Wing veins
  ctx.strokeStyle = c.bodyDark
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(-4, -3)
  ctx.lineTo(-hw - 8, -5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-4, -2)
  ctx.lineTo(-hw - 6, 1)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.rotate(0.25 - flapAngle)
  ctx.fillStyle = c.wing
  ctx.beginPath()
  ctx.ellipse(hw - 2, -3, 15, 5, 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = c.bodyDark
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(4, -3)
  ctx.lineTo(hw + 8, -5)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(4, -2)
  ctx.lineTo(hw + 6, 1)
  ctx.stroke()
  ctx.restore()

  // Body (insectoid)
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, 0, hw - 7, hh - 3, 0, 0, Math.PI * 2)
  ctx.fill()
  // Segmented body highlight
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, 1, hw - 10, hh - 6, 0, 0, Math.PI * 2)
  ctx.fill()
  // Body segments
  ctx.strokeStyle = c.bodyDark
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(-hw + 8, -1)
  ctx.lineTo(hw - 8, -1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-hw + 9, 4)
  ctx.lineTo(hw - 9, 4)
  ctx.stroke()

  // Eyes (compound eyes - glowing red)
  ctx.shadowColor = c.eyeGlow
  ctx.shadowBlur = 6
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(-4, -5, 4.5, 3.5, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(4, -5, 4.5, 3.5, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  // Eye facets
  ctx.fillStyle = '#dd2222'
  ctx.beginPath()
  ctx.arc(-3, -5, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -5, 2, 0, Math.PI * 2)
  ctx.fill()

  // Mandibles
  ctx.strokeStyle = c.stinger
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-2, 0)
  ctx.quadraticCurveTo(-6, 6, -4, 8)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(2, 0)
  ctx.quadraticCurveTo(6, 6, 4, 8)
  ctx.stroke()

  // Tail stinger
  ctx.fillStyle = c.stinger
  ctx.beginPath()
  ctx.moveTo(0, hh - 3)
  ctx.lineTo(-3, hh + 8)
  ctx.lineTo(0, hh + 12)
  ctx.lineTo(3, hh + 8)
  ctx.closePath()
  ctx.fill()
  // Stinger tip
  ctx.fillStyle = '#ffcc00'
  ctx.beginPath()
  ctx.arc(0, hh + 11, 1.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawBrute(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.brute
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const bob = Math.sin(enemy.animFrame * 0.08) * 2

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(0, hh + 2, hw, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs (thick, armored)
  ctx.fillStyle = c.bodyDark
  const legAnim = Math.sin(enemy.animFrame * 0.12) * 4
  ctx.fillRect(-hw + 4 + legAnim, hh - 12, 12, 16)
  ctx.fillRect(hw - 16 - legAnim, hh - 12, 12, 16)
  // Leg armor plates
  ctx.fillStyle = c.armor
  roundRect(ctx, -hw + 5 + legAnim, hh - 11, 10, 6, 2)
  ctx.fill()
  roundRect(ctx, hw - 15 - legAnim, hh - 11, 10, 6, 2)
  ctx.fill()
  // Feet
  ctx.fillStyle = c.bodyDark
  roundRect(ctx, -hw + 2 + legAnim, hh + 2, 16, 6, 3)
  ctx.fill()
  roundRect(ctx, hw - 18 - legAnim, hh + 2, 16, 6, 3)
  ctx.fill()

  // Body (armored bulk)
  ctx.fillStyle = c.armor
  roundRect(ctx, -hw + 2, -hh + 4 + bob, enemy.width - 4, enemy.height - 16, 8)
  ctx.fill()
  ctx.fillStyle = c.body
  roundRect(ctx, -hw + 5, -hh + 7 + bob, enemy.width - 10, enemy.height - 22, 6)
  ctx.fill()
  // Chest plate
  ctx.fillStyle = c.armorLight
  roundRect(ctx, -hw + 8, -hh + 10 + bob, enemy.width - 16, 18, 4)
  ctx.fill()
  // Armor rivets
  ctx.fillStyle = c.armorRivet
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(-6 + i * 8, -hh + 12 + bob, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  // Scar mark across chest
  ctx.strokeStyle = c.scar
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-4, -hh + 16 + bob)
  ctx.lineTo(10, -hh + 22 + bob)
  ctx.stroke()

  // Arms (massive)
  ctx.fillStyle = c.body
  ctx.fillRect(-hw - 8, -hh + 12 + bob, 12, 22)
  ctx.fillRect(hw - 4, -hh + 12 + bob, 12, 22)
  // Arm armor
  ctx.fillStyle = c.armor
  roundRect(ctx, -hw - 7, -hh + 13 + bob, 10, 10, 3)
  ctx.fill()
  roundRect(ctx, hw - 3, -hh + 13 + bob, 10, 10, 3)
  ctx.fill()
  // Fists
  ctx.fillStyle = c.fist
  ctx.beginPath()
  ctx.arc(-hw - 2, -hh + 36 + bob, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hw + 2, -hh + 36 + bob, 7, 0, Math.PI * 2)
  ctx.fill()
  // Knuckle spikes
  ctx.fillStyle = c.armorRivet
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(-hw - 5 + i * 3, -hh + 33 + bob, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(hw - 1 + i * 3, -hh + 33 + bob, 1, 0, Math.PI * 2)
    ctx.fill()
  }

  // Head (small, armored)
  ctx.fillStyle = c.armor
  roundRect(ctx, -9, -hh - 5 + bob, 20, 15, 4)
  ctx.fill()
  ctx.fillStyle = c.armorLight
  roundRect(ctx, -7, -hh - 4 + bob, 16, 8, 3)
  ctx.fill()
  // Eyes (angry slits)
  ctx.fillStyle = c.eye
  ctx.shadowColor = 'rgba(255,50,50,0.5)'
  ctx.shadowBlur = 5
  ctx.beginPath()
  ctx.ellipse(-2, -hh + 2 + bob, 4, 2.5, -0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(8, -hh + 2 + bob, 4, 2.5, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.ellipse(-1, -hh + 2 + bob, 1.5, 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(9, -hh + 2 + bob, 1.5, 2, 0, 0, Math.PI * 2)
  ctx.fill()
  // Angry brow plates
  ctx.fillStyle = c.armor
  ctx.beginPath()
  ctx.moveTo(-7, -hh - 2 + bob)
  ctx.lineTo(-1, -hh + 1 + bob)
  ctx.lineTo(-7, -hh + bob)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(13, -hh - 2 + bob)
  ctx.lineTo(7, -hh + 1 + bob)
  ctx.lineTo(13, -hh + bob)
  ctx.fill()
  // Mouth
  ctx.fillStyle = '#6a3311'
  ctx.beginPath()
  ctx.ellipse(3, -hh + 7 + bob, 6, 3, 0, 0, Math.PI)
  ctx.fill()
  ctx.fillStyle = '#eee'
  ctx.fillRect(-1, -hh + 6 + bob, 2, 3)
  ctx.fillRect(6, -hh + 6 + bob, 2, 3)
}

function drawBoss(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.boss
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const pulse = Math.sin(Date.now() * 0.003) * 0.2

  // Aura (pulsing)
  const auraGrad = ctx.createRadialGradient(0, 0, hw * 0.5, 0, 0, hw + 20 + pulse * 10)
  auraGrad.addColorStop(0, 'rgba(255,50,50,0.1)')
  auraGrad.addColorStop(0.6, c.aura)
  auraGrad.addColorStop(1, 'rgba(255,50,50,0)')
  ctx.fillStyle = auraGrad
  ctx.beginPath()
  ctx.arc(0, 0, hw + 20 + pulse * 10, 0, Math.PI * 2)
  ctx.fill()

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(0, hh + 2, hw, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  ctx.fillStyle = c.body
  const legAnim = Math.sin(enemy.animFrame * 0.1) * 4
  ctx.fillRect(-hw + 6, hh - 16 + legAnim, 14, 20)
  ctx.fillRect(hw - 20, hh - 16 - legAnim, 14, 20)
  // Clawed feet
  ctx.fillStyle = c.bodyDark
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(-hw + 5 + i * 5, hh + 2 + legAnim)
    ctx.lineTo(-hw + 7 + i * 5, hh + 8 + legAnim)
    ctx.lineTo(-hw + 9 + i * 5, hh + 2 + legAnim)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(hw - 19 + i * 5, hh + 2 - legAnim)
    ctx.lineTo(hw - 17 + i * 5, hh + 8 - legAnim)
    ctx.lineTo(hw - 15 + i * 5, hh + 2 - legAnim)
    ctx.fill()
  }

  // Body
  ctx.fillStyle = c.body
  roundRect(ctx, -hw + 2, -hh + 6, enemy.width - 4, enemy.height - 20, 10)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  roundRect(ctx, -hw + 6, -hh + 10, enemy.width - 12, enemy.height - 28, 8)
  ctx.fill()
  // Body pattern / veins
  ctx.strokeStyle = c.bodyDark
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(-hw + 10, -hh + 20)
  ctx.quadraticCurveTo(0, -hh + 30, hw - 10, -hh + 20)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-hw + 10, -hh + 35)
  ctx.quadraticCurveTo(0, -hh + 40, hw - 10, -hh + 35)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Spikes (animated)
  ctx.fillStyle = c.spike
  for (let i = 0; i < 5; i++) {
    const sx = -hw + 8 + i * ((enemy.width - 16) / 4)
    const spikeH = 10 + Math.sin(Date.now() * 0.004 + i) * 3
    ctx.beginPath()
    ctx.moveTo(sx - 5, -hh + 6)
    ctx.lineTo(sx, -hh - spikeH)
    ctx.lineTo(sx + 5, -hh + 6)
    ctx.closePath()
    ctx.fill()
    // Spike highlight
    ctx.fillStyle = '#dd3344'
    ctx.beginPath()
    ctx.moveTo(sx - 1, -hh + 2)
    ctx.lineTo(sx, -hh - spikeH + 3)
    ctx.lineTo(sx + 2, -hh + 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = c.spike
  }

  // Arms with glow
  ctx.fillStyle = c.body
  ctx.fillRect(-hw - 10, -hh + 14, 14, 26)
  ctx.fillRect(hw - 4, -hh + 14, 14, 26)
  // Arm glow
  ctx.fillStyle = c.armGlow
  ctx.fillRect(-hw - 10, -hh + 14, 14, 26)
  ctx.fillRect(hw - 4, -hh + 14, 14, 26)
  // Fists with claws
  ctx.fillStyle = c.bodyDark
  ctx.beginPath()
  ctx.arc(-hw - 3, -hh + 42, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hw + 3, -hh + 42, 9, 0, Math.PI * 2)
  ctx.fill()
  // Claws
  ctx.fillStyle = '#881122'
  for (let ci = 0; ci < 3; ci++) {
    ctx.beginPath()
    ctx.moveTo(-hw - 8 + ci * 4, -hh + 49)
    ctx.lineTo(-hw - 7 + ci * 4, -hh + 55)
    ctx.lineTo(-hw - 5 + ci * 4, -hh + 49)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(hw - 2 + ci * 4, -hh + 49)
    ctx.lineTo(hw - 1 + ci * 4, -hh + 55)
    ctx.lineTo(hw + 1 + ci * 4, -hh + 49)
    ctx.fill()
  }

  // Head
  ctx.fillStyle = c.body
  roundRect(ctx, -14, -hh - 10, 30, 22, 6)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  roundRect(ctx, -10, -hh - 8, 22, 14, 4)
  ctx.fill()

  // Crown (ornate)
  ctx.fillStyle = c.crown
  ctx.beginPath()
  ctx.moveTo(-12, -hh - 10)
  ctx.lineTo(-10, -hh - 22)
  ctx.lineTo(-4, -hh - 14)
  ctx.lineTo(1, -hh - 24)
  ctx.lineTo(6, -hh - 14)
  ctx.lineTo(12, -hh - 22)
  ctx.lineTo(18, -hh - 10)
  ctx.closePath()
  ctx.fill()
  // Crown outline
  ctx.strokeStyle = '#cc8800'
  ctx.lineWidth = 1
  ctx.stroke()
  // Crown gems
  ctx.fillStyle = c.crownGem
  ctx.shadowColor = c.crownGem
  ctx.shadowBlur = 4
  ctx.beginPath()
  ctx.arc(-10, -hh - 17, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2244ff'
  ctx.beginPath()
  ctx.arc(1, -hh - 19, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#22ff44'
  ctx.beginPath()
  ctx.arc(12, -hh - 17, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Eyes (intensely glowing)
  ctx.shadowColor = c.eye
  ctx.shadowBlur = 10
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(-5, -hh - 2, 6, 4.5, -0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(11, -hh - 2, 6, 4.5, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  // Pupils (slits)
  ctx.fillStyle = '#cc0000'
  ctx.beginPath()
  ctx.ellipse(-4, -hh - 2, 1.5, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(12, -hh - 2, 1.5, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Mouth (wide, menacing)
  ctx.fillStyle = c.mouth
  ctx.beginPath()
  ctx.ellipse(3, -hh + 7, 10, 5, 0, 0, Math.PI)
  ctx.fill()
  // Teeth (jagged)
  ctx.fillStyle = c.teeth
  for (let i = 0; i < 7; i++) {
    const tw = i % 2 === 0 ? 3 : 2
    const th = i % 2 === 0 ? 5 : 3
    ctx.beginPath()
    ctx.moveTo(-5 + i * 2.5, -hh + 5)
    ctx.lineTo(-5 + i * 2.5 + tw / 2, -hh + 5 + th)
    ctx.lineTo(-5 + i * 2.5 + tw, -hh + 5)
    ctx.fill()
  }
}

// ─── Bullets ───
export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, cameraX: number, cameraY: number) {
  const bx = bullet.x - cameraX
  const by = bullet.y - cameraY

  // Red acid bullets from flyers
  if (bullet.isRedAcid) {
    ctx.shadowColor = '#ff3333'
    ctx.shadowBlur = 12

    // Outer glow
    ctx.fillStyle = '#ff4444'
    ctx.beginPath()
    ctx.arc(bx, by, bullet.radius * 1.6, 0, Math.PI * 2)
    ctx.fill()
    // Main bullet
    ctx.fillStyle = '#ff2222'
    ctx.beginPath()
    ctx.arc(bx, by, bullet.radius, 0, Math.PI * 2)
    ctx.fill()
    // Core
    ctx.fillStyle = '#ffaaaa'
    ctx.beginPath()
    ctx.arc(bx, by, bullet.radius * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // Trail
    ctx.fillStyle = '#ff3333'
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(bx - bullet.vx * 0.015, by - bullet.vy * 0.015, bullet.radius * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(bx - bullet.vx * 0.03, by - bullet.vy * 0.03, bullet.radius * 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.shadowBlur = 0
    return
  }

  ctx.shadowColor = bullet.fromPlayer ? COLORS.bullet.playerGlow : COLORS.bullet.enemyGlow
  ctx.shadowBlur = 10

  // Outer glow
  ctx.fillStyle = bullet.fromPlayer ? COLORS.bullet.playerGlow : COLORS.bullet.enemyGlow
  ctx.beginPath()
  ctx.arc(bx, by, bullet.radius * 1.5, 0, Math.PI * 2)
  ctx.fill()
  // Main bullet
  ctx.fillStyle = bullet.fromPlayer ? COLORS.bullet.player : COLORS.bullet.enemy
  ctx.beginPath()
  ctx.arc(bx, by, bullet.radius, 0, Math.PI * 2)
  ctx.fill()
  // Core
  ctx.fillStyle = bullet.fromPlayer ? COLORS.bullet.playerCore : COLORS.bullet.enemyCore
  ctx.beginPath()
  ctx.arc(bx, by, bullet.radius * 0.4, 0, Math.PI * 2)
  ctx.fill()

  // Trail
  ctx.fillStyle = bullet.fromPlayer ? COLORS.bullet.playerGlow : COLORS.bullet.enemyGlow
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(bx - bullet.vx * 0.015, by - bullet.vy * 0.015, bullet.radius * 0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(bx - bullet.vx * 0.03, by - bullet.vy * 0.03, bullet.radius * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.shadowBlur = 0
}

// ─── Particles ───
export function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, cameraX: number, cameraY: number) {
  const alpha = particle.life / particle.maxLife
  ctx.globalAlpha = alpha
  ctx.fillStyle = particle.color
  ctx.beginPath()
  ctx.arc(particle.x - cameraX, particle.y - cameraY, particle.size * alpha, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

// ─── HUD ───
export function drawHUD(ctx: CanvasRenderingContext2D, player: Player, canvasW: number, canvasH: number) {
  // Panel background
  ctx.fillStyle = COLORS.hud.panelBg
  roundRect(ctx, 10, 10, 220, 130, 8)
  ctx.fill()
  ctx.strokeStyle = COLORS.hud.panelBorder
  ctx.lineWidth = 1
  roundRect(ctx, 10, 10, 220, 130, 8)
  ctx.stroke()

  // Health
  ctx.fillStyle = COLORS.hud.text
  ctx.font = 'bold 12px Geist, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('HEALTH', 20, 32)
  ctx.fillStyle = COLORS.hud.healthBg
  roundRect(ctx, 80, 22, 140, 12, 3)
  ctx.fill()
  const hpRatio = Math.max(0, player.health / player.maxHealth)
  if (hpRatio > 0) {
    const hpGrad = ctx.createLinearGradient(80, 0, 80 + 140 * hpRatio, 0)
    hpGrad.addColorStop(0, '#22aa33')
    hpGrad.addColorStop(1, COLORS.hud.health)
    ctx.fillStyle = hpGrad
    roundRect(ctx, 80, 22, 140 * hpRatio, 12, 3)
    ctx.fill()
  }

  // Fuel
  ctx.fillStyle = COLORS.hud.text
  ctx.fillText('FUEL', 20, 52)
  ctx.fillStyle = COLORS.hud.fuelBg
  roundRect(ctx, 80, 42, 140, 12, 3)
  ctx.fill()
  const fuelRatio = Math.max(0, player.jetpackFuel / player.maxJetpackFuel)
  if (fuelRatio > 0) {
    const fuelGrad = ctx.createLinearGradient(80, 0, 80 + 140 * fuelRatio, 0)
    fuelGrad.addColorStop(0, '#2266cc')
    fuelGrad.addColorStop(1, COLORS.hud.fuel)
    ctx.fillStyle = fuelGrad
    roundRect(ctx, 80, 42, 140 * fuelRatio, 12, 3)
    ctx.fill()
  }

  // Score
  ctx.fillStyle = COLORS.hud.text
  ctx.font = 'bold 14px Geist, sans-serif'
  ctx.fillText(`SCORE: ${player.score}`, 20, 72)

  // Bullets remaining
  ctx.fillStyle = player.bulletsRemaining > player.bulletsMax * 0.2 ? COLORS.hud.text : player.bulletsRemaining > 0 ? '#ffaa00' : '#ff4444'
  ctx.font = 'bold 14px Geist, sans-serif'
  ctx.fillText(`AMMO: ${Math.round((player.bulletsRemaining / player.bulletsMax) * 100)}%`, 20, 92)

  // Current weapon
  const weaponNames: Record<string, string> = { rifle: 'RIFLE', smg: 'SMG', shotgun: 'SHOTGUN', sniper: 'SNIPER', plasma: 'PLASMA', launcher: 'LAUNCHER' }
  const weaponColors: Record<string, string> = { rifle: '#ffcc22', smg: '#44ddff', shotgun: '#ff8844', sniper: '#ff4488', plasma: '#aa66ff', launcher: '#ff2222' }
  ctx.fillStyle = weaponColors[player.weapon] || COLORS.hud.text
  ctx.font = 'bold 14px Geist, sans-serif'
  ctx.fillText(`WEAPON: ${weaponNames[player.weapon] || player.weapon.toUpperCase()}`, 20, 112)
  // Weapon slots hint
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '10px Geist, sans-serif'
  ctx.fillText(player.weapons.map((w, i) => `[${i + 1}]${w === player.weapon ? '*' : ''}`).join(' '), 20, 128)

  // LOW OXYGEN warning
  if (player.lowOxygen) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008)
    ctx.save()
    ctx.globalAlpha = 0.6 + 0.4 * pulse
    // Full-screen red vignette
    const vignette = ctx.createRadialGradient(canvasW / 2, canvasH / 2, canvasH * 0.3, canvasW / 2, canvasH / 2, canvasH * 0.85)
    vignette.addColorStop(0, 'rgba(180,0,0,0)')
    vignette.addColorStop(1, 'rgba(180,0,0,0.45)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, canvasW, canvasH)
    ctx.restore()

    // Warning text centered at top
    ctx.save()
    ctx.globalAlpha = 0.7 + 0.3 * pulse
    ctx.font = `bold ${28 + Math.round(pulse * 4)}px Geist, sans-serif`
    ctx.fillStyle = '#ff2222'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 20
    ctx.textAlign = 'center'
    ctx.fillText('LOW OXYGEN', canvasW / 2, 60)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // Controls hint (top right)
  ctx.fillStyle = COLORS.hud.panelBg
  roundRect(ctx, canvasW - 210, 10, 200, 96, 8)
  ctx.fill()
  ctx.strokeStyle = COLORS.hud.panelBorder
  roundRect(ctx, canvasW - 210, 10, 200, 96, 8)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = '11px Geist, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('A/D or Arrows - Move', canvasW - 20, 30)
  ctx.fillText('W or Space - Jump', canvasW - 20, 46)
  ctx.fillText('Shift - Jetpack', canvasW - 20, 62)
  ctx.fillText('Mouse Aim + Click - Shoot', canvasW - 20, 78)
  ctx.fillText('1/2/3 - Switch Weapon', canvasW - 20, 94)
  ctx.textAlign = 'left'
}

// ─── Jetpack Flames ───
export function drawJetpackFlame(ctx: CanvasRenderingContext2D, player: Player, cameraX: number, cameraY: number) {
  const px = player.x - cameraX + player.width / 2
  const py = player.y - cameraY + player.height / 2
  const f = player.facing

  const baseX = px - f * 10
  const baseY = py + 18

  for (let i = 0; i < 4; i++) {
    const flameH = 10 + Math.random() * 14
    const flameW = 3 + Math.random() * 4
    ctx.fillStyle = COLORS.player.flame[i % 3]
    ctx.globalAlpha = 0.6 + Math.random() * 0.4
    ctx.beginPath()
    ctx.ellipse(baseX + (Math.random() - 0.5) * 6, baseY + flameH / 2, flameW, flameH, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // White-hot core
  ctx.fillStyle = '#ffffcc'
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.ellipse(baseX, baseY + 2, 2, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

// ─── Utility ───
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export { COLORS, roundRect }
