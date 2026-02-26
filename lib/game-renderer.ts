import type { GameState, Player, Platform, Enemy, Bullet, Particle, Star } from './game-types'

// ─── Colors ───
const COLORS = {
  sky: {
    top: '#3a8fd6',
    mid: '#6cb4e6',
    bottom: '#b0ddf0',
  },
  sun: '#fff7cc',
  sunGlow: 'rgba(255,240,180,0.3)',
  clouds: 'rgba(255,255,255,0.8)',
  stars: '#ffffff',
  ground: {
    dirt: '#6b4226',
    dirtLight: '#8b5e3c',
    dirtDark: '#4a2e1a',
    grass: '#4a8f3f',
    grassLight: '#5cb84e',
    grassDark: '#357a2d',
  },
  platform: {
    normal: { top: '#5a8a4a', side: '#3a6a2a', grass: '#6db87a' },
    metal: { top: '#6a7a8a', side: '#4a5a6a', highlight: '#9aaaba' },
    floating: { top: '#5a6a9a', side: '#3a4a6a', glow: 'rgba(100,160,255,0.3)' },
  },
  player: {
    skin: '#e8b88a',
    skinShadow: '#c89468',
    hair: '#3a2820',
    helmet: '#4a6a3a',
    helmetLight: '#5a8a4a',
    helmetBand: '#3a5a2a',
    shirt: '#4a6a3a',
    shirtLight: '#5a7a4a',
    shirtDark: '#3a5a2a',
    pants: '#5a5a3a',
    pantsLight: '#6a6a4a',
    pantsDark: '#4a4a2a',
    boots: '#2a2a2a',
    bootsHighlight: '#3a3a3a',
    belt: '#5a4a2a',
    beltBuckle: '#bba833',
    jetpack: '#5a5a5a',
    jetpackLight: '#7a7a7a',
    jetpackDark: '#3a3a3a',
    jetpackTank: '#6a4a3a',
    flame: ['#ff6622', '#ffaa22', '#ffdd44'],
    gun: '#4a4a4a',
    gunLight: '#666666',
    gunDark: '#333333',
    gunBarrel: '#555555',
  },
  enemy: {
    grunt: { body: '#44aa55', bodyLight: '#66cc77', eye: '#ffffff', pupil: '#111111' },
    spitter: { body: '#55aa88', bodyLight: '#77ccaa', eye: '#ffff44', spit: '#88ff44' },
    flyer: { body: '#6688cc', bodyLight: '#88aaee', wing: '#4466aa', eye: '#ff4444' },
    brute: { body: '#cc8844', bodyLight: '#eeaa66', eye: '#ff2222', armor: '#aa6622' },
    boss: { body: '#cc2233', bodyLight: '#ee4455', eye: '#ffff00', crown: '#ffaa00', aura: 'rgba(255,50,50,0.2)' },
  },
  bullet: {
    player: '#ffcc22',
    playerGlow: 'rgba(255,204,34,0.5)',
    enemy: '#ff4444',
    enemyGlow: 'rgba(255,68,68,0.4)',
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
  particles: {
    explosion: ['#ff4444', '#ff8844', '#ffcc44', '#ffff88'],
    jetpack: ['#ff6622', '#ffaa22', '#ffdd44', '#ffffff'],
    hit: ['#ffffff', '#aaffaa', '#44ff44'],
    death: ['#ff2222', '#44ff44', '#22ff88', '#ffffff'],
  },
}

// ─── Background ───
export function drawBackground(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvasH)
  grad.addColorStop(0, COLORS.sky.top)
  grad.addColorStop(0.5, COLORS.sky.mid)
  grad.addColorStop(1, COLORS.sky.bottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Sun
  const sunX = canvasW * 0.8
  const sunY = 80
  // Sun glow
  const glowGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 120)
  glowGrad.addColorStop(0, 'rgba(255,240,180,0.4)')
  glowGrad.addColorStop(0.5, 'rgba(255,240,180,0.1)')
  glowGrad.addColorStop(1, 'rgba(255,240,180,0)')
  ctx.fillStyle = glowGrad
  ctx.fillRect(sunX - 120, sunY - 120, 240, 240)
  // Sun disc
  ctx.fillStyle = COLORS.sun
  ctx.beginPath()
  ctx.arc(sunX, sunY, 30, 0, Math.PI * 2)
  ctx.fill()
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], cameraX: number) {
  // Re-purpose stars as floating cloud puffs in daytime
  for (const star of stars) {
    if (star.size < 1.2) continue
    const sx = ((star.x - cameraX * star.speed) % (ctx.canvas.width + 100) + ctx.canvas.width + 100) % (ctx.canvas.width + 100)
    ctx.globalAlpha = star.brightness * 0.3
    ctx.fillStyle = COLORS.clouds
    ctx.beginPath()
    ctx.ellipse(sx, star.y * 0.5, star.size * 8, star.size * 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawParallaxMountains(ctx: CanvasRenderingContext2D, cameraX: number, canvasW: number, canvasH: number) {
  // Far blue mountains
  ctx.fillStyle = '#7aa8c4'
  drawMountainLayer(ctx, cameraX * 0.08, canvasW, canvasH, 0.55, 100, 170)
  // Mid green mountains
  ctx.fillStyle = '#5a8a5a'
  drawMountainLayer(ctx, cameraX * 0.15, canvasW, canvasH, 0.65, 80, 140)
  // Near green hills
  ctx.fillStyle = '#4a7a3a'
  drawMountainLayer(ctx, cameraX * 0.25, canvasW, canvasH, 0.75, 50, 100)
  // Treeline hints
  drawTreeline(ctx, cameraX * 0.3, canvasW, canvasH, 0.78)
}

function drawMountainLayer(ctx: CanvasRenderingContext2D, offset: number, w: number, h: number, yRatio: number, minH: number, maxH: number) {
  ctx.beginPath()
  ctx.moveTo(0, h)
  const step = 80
  const totalWidth = w + 200
  const startX = -(offset % step) - step
  for (let x = startX; x < totalWidth; x += step) {
    const seed = Math.abs(Math.sin((x + offset) * 0.01) * 10000)
    const peakH = minH + (seed % 1) * (maxH - minH)
    ctx.lineTo(x, h * yRatio - peakH * (0.5 + 0.5 * Math.sin(seed)))
  }
  ctx.lineTo(w + 100, h)
  ctx.closePath()
  ctx.fill()
}

function drawTreeline(ctx: CanvasRenderingContext2D, offset: number, w: number, h: number, yRatio: number) {
  const baseY = h * yRatio
  ctx.fillStyle = '#3a6a2a'
  const step = 20
  const startX = -(offset % step) - step
  for (let x = startX; x < w + 50; x += step) {
    const seed = Math.abs(Math.sin((x + offset) * 0.05) * 1000)
    const treeH = 15 + (seed % 1) * 25
    // Triangle tree
    ctx.beginPath()
    ctx.moveTo(x, baseY)
    ctx.lineTo(x + 8, baseY - treeH)
    ctx.lineTo(x + 16, baseY)
    ctx.closePath()
    ctx.fill()
  }
}

// ─── Ground ───
export function drawGround(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, canvasW: number, canvasH: number, groundY: number) {
  const gx = -((cameraX) % 64)
  const gy = groundY - cameraY

  // Main dirt fill
  const dirtGrad = ctx.createLinearGradient(0, gy, 0, canvasH)
  dirtGrad.addColorStop(0, COLORS.ground.dirt)
  dirtGrad.addColorStop(0.3, COLORS.ground.dirtDark)
  dirtGrad.addColorStop(1, '#2a1a0a')
  ctx.fillStyle = dirtGrad
  ctx.fillRect(0, gy + 6, canvasW, canvasH - gy)

  // Grass top strip
  ctx.fillStyle = COLORS.ground.grass
  ctx.fillRect(0, gy, canvasW, 8)
  // Grass highlight
  ctx.fillStyle = COLORS.ground.grassLight
  ctx.fillRect(0, gy, canvasW, 3)

  // Grass blades
  ctx.fillStyle = COLORS.ground.grassLight
  for (let bx = gx; bx < canvasW + 20; bx += 5) {
    const seed = Math.sin(bx * 0.3 + cameraX * 0.3) * 1000
    const bladeH = 3 + Math.abs(seed % 5)
    ctx.fillRect(bx, gy - bladeH, 2, bladeH)
  }

  // Dirt texture - small pebbles/dots
  ctx.fillStyle = COLORS.ground.dirtLight
  for (let px = gx; px < canvasW + 64; px += 64) {
    for (let py = gy + 12; py < Math.min(canvasH, gy + 80); py += 18) {
      const seed = Math.abs(Math.sin(px * 0.1 + py * 0.2) * 100)
      if (seed % 3 < 1) {
        ctx.beginPath()
        ctx.arc(px + (seed % 10), py, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
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
    for (let gx = x + 2; gx < x + w - 2; gx += 5) {
      const gh = 3 + Math.sin(gx * 0.3) * 2
      ctx.fillRect(gx, y - gh, 2, gh)
    }
  }

  // Metal rivets
  if (platform.type === 'metal') {
    ctx.fillStyle = (colors as typeof COLORS.platform.metal).highlight
    for (let rx = x + 10; rx < x + w - 10; rx += 20) {
      ctx.beginPath()
      ctx.arc(rx, y + h / 2 + 2, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    // Metal stripes
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

// ─── Player (Human Soldier) ───
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
  // Main pack body
  ctx.fillStyle = COLORS.player.jetpackDark
  roundRect(ctx, -hw - 7, -hh + 8, 9, 22, 2)
  ctx.fill()
  ctx.fillStyle = COLORS.player.jetpack
  roundRect(ctx, -hw - 6, -hh + 9, 7, 20, 2)
  ctx.fill()
  // Fuel tanks (two cylinders)
  ctx.fillStyle = COLORS.player.jetpackTank
  roundRect(ctx, -hw - 9, -hh + 10, 4, 16, 2)
  ctx.fill()
  ctx.fillStyle = '#7a5a4a'
  ctx.fillRect(-hw - 8, -hh + 11, 2, 14)
  // Tank caps
  ctx.fillStyle = '#888'
  ctx.fillRect(-hw - 9, -hh + 9, 4, 2)
  ctx.fillRect(-hw - 9, -hh + 26, 4, 2)
  // Pipe connecting to back
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-hw - 3, -hh + 14)
  ctx.lineTo(-hw + 2, -hh + 14)
  ctx.stroke()
  // Nozzle
  ctx.fillStyle = '#3a3a3a'
  roundRect(ctx, -hw - 6, -hh + 28, 7, 5, 1)
  ctx.fill()
  ctx.fillStyle = '#555'
  ctx.fillRect(-hw - 4, -hh + 29, 3, 3)
  // Jetpack light (small LED)
  ctx.fillStyle = player.jetpackFuel > 10 ? '#44ff44' : '#ff4444'
  ctx.beginPath()
  ctx.arc(-hw - 3, -hh + 12, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // ─ LEGS ─
  const walkCycle = player.onGround ? Math.sin(player.animFrame * 0.3) * 5 : 0
  const legSpread = player.onGround ? 0 : 2

  // Left leg
  ctx.fillStyle = COLORS.player.pants
  ctx.fillRect(-5 - legSpread, hh - 14, 7, 14 + walkCycle)
  ctx.fillStyle = COLORS.player.pantsLight
  ctx.fillRect(-4 - legSpread, hh - 13, 2, 12 + walkCycle)
  // Left boot
  ctx.fillStyle = COLORS.player.boots
  roundRect(ctx, -6 - legSpread, hh - 1 + walkCycle, 9, 5, 2)
  ctx.fill()
  ctx.fillStyle = COLORS.player.bootsHighlight
  ctx.fillRect(-4 - legSpread, hh + walkCycle, 4, 2)
  // Boot sole
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(-6 - legSpread, hh + 3 + walkCycle, 9, 2)

  // Right leg
  ctx.fillStyle = COLORS.player.pants
  ctx.fillRect(1 + legSpread, hh - 14, 7, 14 - walkCycle)
  ctx.fillStyle = COLORS.player.pantsLight
  ctx.fillRect(2 + legSpread, hh - 13, 2, 12 - walkCycle)
  // Right boot
  ctx.fillStyle = COLORS.player.boots
  roundRect(ctx, 0 + legSpread, hh - 1 - walkCycle, 9, 5, 2)
  ctx.fill()
  ctx.fillStyle = COLORS.player.bootsHighlight
  ctx.fillRect(2 + legSpread, hh - walkCycle, 4, 2)
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0 + legSpread, hh + 3 - walkCycle, 9, 2)

  // ─ TORSO ─
  // Main shirt
  ctx.fillStyle = COLORS.player.shirt
  roundRect(ctx, -hw + 3, -hh + 10, player.width - 6, 20, 3)
  ctx.fill()
  // Shirt highlights (camo-like patches)
  ctx.fillStyle = COLORS.player.shirtLight
  roundRect(ctx, -hw + 5, -hh + 12, 6, 8, 2)
  ctx.fill()
  ctx.fillStyle = COLORS.player.shirtDark
  roundRect(ctx, hw - 10, -hh + 14, 5, 6, 1)
  ctx.fill()
  // Chest pocket
  ctx.strokeStyle = COLORS.player.shirtDark
  ctx.lineWidth = 1
  roundRect(ctx, -hw + 5, -hh + 18, 6, 5, 1)
  ctx.stroke()
  // Pocket flap
  ctx.fillStyle = COLORS.player.shirtDark
  ctx.fillRect(-hw + 5, -hh + 18, 6, 2)

  // Belt
  ctx.fillStyle = COLORS.player.belt
  ctx.fillRect(-hw + 3, -hh + 28, player.width - 6, 4)
  // Belt buckle
  ctx.fillStyle = COLORS.player.beltBuckle
  roundRect(ctx, -2, -hh + 27, 6, 6, 1)
  ctx.fill()
  // Belt pouches
  ctx.fillStyle = '#4a3a2a'
  roundRect(ctx, -hw + 4, -hh + 27, 5, 5, 1)
  ctx.fill()
  roundRect(ctx, hw - 8, -hh + 27, 5, 5, 1)
  ctx.fill()

  // ─ ARM (back arm, behind body) ─
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(-hw + 1, -hh + 12, 5, 14)

  // ─ ARM (front) + GUN ─
  const recoil = player.shootCooldown > 0.1 ? -2 : 0
  const armY = -hh + 14
  // Upper arm
  ctx.fillStyle = COLORS.player.shirt
  ctx.fillRect(hw - 6, armY, 6, 6)
  // Forearm / hand holding gun
  ctx.fillStyle = COLORS.player.skin
  ctx.fillRect(hw - 4, armY + 4, 10 + recoil, 5)

  // Gun - detailed rifle
  const gunX = hw + 4 + recoil
  const gunY = armY + 1
  // Gun body / receiver
  ctx.fillStyle = COLORS.player.gunDark
  roundRect(ctx, gunX, gunY, 18, 6, 1)
  ctx.fill()
  // Barrel
  ctx.fillStyle = COLORS.player.gunBarrel
  ctx.fillRect(gunX + 16, gunY + 1, 8, 3)
  // Barrel tip
  ctx.fillStyle = '#444'
  ctx.fillRect(gunX + 23, gunY, 3, 5)
  // Magazine
  ctx.fillStyle = COLORS.player.gunDark
  ctx.fillRect(gunX + 4, gunY + 5, 4, 6)
  // Scope
  ctx.fillStyle = '#555'
  roundRect(ctx, gunX + 6, gunY - 3, 8, 3, 1)
  ctx.fill()
  ctx.fillStyle = '#66bbff'
  ctx.beginPath()
  ctx.arc(gunX + 13, gunY - 1.5, 1.5, 0, Math.PI * 2)
  ctx.fill()
  // Gun highlight
  ctx.fillStyle = COLORS.player.gunLight
  ctx.fillRect(gunX + 2, gunY + 1, 12, 1)
  // Stock
  ctx.fillStyle = '#5a4a3a'
  roundRect(ctx, gunX - 6, gunY + 1, 8, 4, 1)
  ctx.fill()

  // Muzzle flash
  if (player.shootCooldown > 0.12) {
    ctx.globalAlpha = 0.9
    const flashGrad = ctx.createRadialGradient(gunX + 28, gunY + 2, 0, gunX + 28, gunY + 2, 10)
    flashGrad.addColorStop(0, '#ffffff')
    flashGrad.addColorStop(0.3, '#ffff44')
    flashGrad.addColorStop(0.6, '#ffaa00')
    flashGrad.addColorStop(1, 'rgba(255,170,0,0)')
    ctx.fillStyle = flashGrad
    ctx.beginPath()
    ctx.arc(gunX + 28, gunY + 2, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // ─ NECK ─
  ctx.fillStyle = COLORS.player.skin
  ctx.fillRect(-2, -hh + 6, 6, 6)

  // ─ HEAD ─
  // Helmet
  ctx.fillStyle = COLORS.player.helmet
  roundRect(ctx, -7, -hh - 6, 16, 15, 5)
  ctx.fill()
  // Helmet highlight
  ctx.fillStyle = COLORS.player.helmetLight
  roundRect(ctx, -5, -hh - 5, 8, 6, 3)
  ctx.fill()
  // Helmet rim
  ctx.fillStyle = COLORS.player.helmetBand
  ctx.fillRect(-7, -hh + 3, 16, 3)
  // Helmet strap
  ctx.strokeStyle = COLORS.player.helmetBand
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(7, -hh + 4)
  ctx.lineTo(8, -hh + 8)
  ctx.stroke()

  // Face area
  ctx.fillStyle = COLORS.player.skin
  roundRect(ctx, -4, -hh + 2, 12, 10, 3)
  ctx.fill()
  // Jaw / chin
  ctx.fillStyle = COLORS.player.skinShadow
  roundRect(ctx, -2, -hh + 8, 8, 4, 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 2, -hh + 3, 5, 3, 1)
  ctx.fill()
  ctx.fillStyle = '#2a4a2a'
  ctx.beginPath()
  ctx.arc(5, -hh + 4.5, 1.5, 0, Math.PI * 2)
  ctx.fill()
  // Eyebrow (determined look)
  ctx.strokeStyle = COLORS.player.hair
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(1, -hh + 2)
  ctx.lineTo(7, -hh + 1.5)
  ctx.stroke()
  // Nose hint
  ctx.fillStyle = COLORS.player.skinShadow
  ctx.fillRect(6, -hh + 5, 2, 2)
  // Mouth (thin line)
  ctx.strokeStyle = '#a07050'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(2, -hh + 9)
  ctx.lineTo(6, -hh + 9)
  ctx.stroke()

  // Ear (visible side)
  ctx.fillStyle = COLORS.player.skin
  ctx.beginPath()
  ctx.ellipse(-5, -hh + 5, 2, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // ─ DOG TAGS ─
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(0, -hh + 8)
  ctx.quadraticCurveTo(1, -hh + 14, 0, -hh + 16)
  ctx.stroke()
  ctx.fillStyle = '#bbb'
  roundRect(ctx, -2, -hh + 15, 4, 3, 1)
  ctx.fill()

  ctx.restore()
  ctx.globalAlpha = 1
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
    case 'grunt':
      drawGrunt(ctx, enemy)
      break
    case 'spitter':
      drawSpitter(ctx, enemy)
      break
    case 'flyer':
      drawFlyer(ctx, enemy)
      break
    case 'brute':
      drawBrute(ctx, enemy)
      break
    case 'boss':
      drawBoss(ctx, enemy)
      break
  }

  ctx.restore()

  // Health bar for tougher enemies
  if (enemy.maxHealth > 2) {
    const barW = enemy.width
    const barH = 4
    const hpRatio = enemy.health / enemy.maxHealth
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
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

  // Body - blob shape
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, bob, hw - 2, hh - 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, bob + 3, hw - 6, hh - 8, 0, 0, Math.PI * 2)
  ctx.fill()
  // Stubby legs
  ctx.fillStyle = c.body
  const legAnim = Math.sin(enemy.animFrame * 0.2) * 3
  ctx.fillRect(-hw + 4, hh - 6 + legAnim, 6, 8)
  ctx.fillRect(hw - 10, hh - 6 - legAnim, 6, 8)
  // Eye
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(4, bob - 4, 6, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.pupil
  ctx.beginPath()
  ctx.arc(6, bob - 4, 3, 0, Math.PI * 2)
  ctx.fill()
  // Teeth
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(-2, bob + 4, 3, 3)
  ctx.fillRect(3, bob + 4, 3, 3)
}

function drawSpitter(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.spitter
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const bob = Math.sin(enemy.animFrame * 0.12) * 2

  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, bob, hw - 4, hh, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, bob + 2, hw - 8, hh - 6, 0, 0, Math.PI * 2)
  ctx.fill()
  // Head
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(4, bob - hh + 4, 8, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  // Eyes
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.arc(6, bob - hh + 2, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(10, bob - hh + 4, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(7, bob - hh + 2, 1.5, 0, Math.PI * 2)
  ctx.fill()
  // Mouth drip
  ctx.fillStyle = c.spit
  ctx.beginPath()
  ctx.arc(12, bob - hh + 6, 3, 0, Math.PI * 2)
  ctx.fill()
  // Tentacles
  ctx.strokeStyle = c.body
  ctx.lineWidth = 2
  for (let i = 0; i < 3; i++) {
    const angle = (i - 1) * 0.4 + Math.sin(enemy.animFrame * 0.1 + i) * 0.2
    ctx.beginPath()
    ctx.moveTo(-2 + i * 4, hh - 4)
    ctx.quadraticCurveTo(-2 + i * 4 + Math.sin(angle) * 8, hh + 8, -2 + i * 4, hh + 12)
    ctx.stroke()
  }
}

function drawFlyer(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.flyer
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const flapAngle = Math.sin((enemy.floatAngle || 0) * 3) * 0.4

  // Wings
  ctx.fillStyle = c.wing
  ctx.save()
  ctx.rotate(-0.3 + flapAngle)
  ctx.beginPath()
  ctx.ellipse(-hw + 2, -4, 16, 6, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.rotate(0.3 - flapAngle)
  ctx.beginPath()
  ctx.ellipse(hw - 2, -4, 16, 6, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Body
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, 0, hw - 6, hh - 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, 2, hw - 10, hh - 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(-4, -4, 4, 3, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(4, -4, 4, 3, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(-3, -4, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(5, -4, 2, 0, Math.PI * 2)
  ctx.fill()
  // Tail stinger
  ctx.fillStyle = c.wing
  ctx.beginPath()
  ctx.moveTo(0, hh - 2)
  ctx.lineTo(-4, hh + 10)
  ctx.lineTo(4, hh + 10)
  ctx.closePath()
  ctx.fill()
}

function drawBrute(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.brute
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const bob = Math.sin(enemy.animFrame * 0.08) * 2

  // Legs
  ctx.fillStyle = c.body
  const legAnim = Math.sin(enemy.animFrame * 0.12) * 3
  ctx.fillRect(-hw + 4, hh - 10 + legAnim, 10, 14)
  ctx.fillRect(hw - 14, hh - 10 - legAnim, 10, 14)

  // Body (armored)
  ctx.fillStyle = c.armor
  roundRect(ctx, -hw + 2, -hh + 4 + bob, enemy.width - 4, enemy.height - 14, 6)
  ctx.fill()
  ctx.fillStyle = c.body
  roundRect(ctx, -hw + 4, -hh + 6 + bob, enemy.width - 8, enemy.height - 18, 4)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.fillRect(-hw + 8, -hh + 10 + bob, 8, 14)

  // Arms
  ctx.fillStyle = c.body
  ctx.fillRect(-hw - 6, -hh + 12 + bob, 10, 20)
  ctx.fillRect(hw - 4, -hh + 12 + bob, 10, 20)
  ctx.fillStyle = c.armor
  ctx.beginPath()
  ctx.arc(-hw - 1, -hh + 34 + bob, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hw + 1, -hh + 34 + bob, 6, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = c.armor
  roundRect(ctx, -8, -hh - 4 + bob, 18, 14, 3)
  ctx.fill()
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.arc(-2, -hh + 2 + bob, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(8, -hh + 2 + bob, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(-1, -hh + 2 + bob, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(9, -hh + 2 + bob, 1.5, 0, Math.PI * 2)
  ctx.fill()
  // Angry brow
  ctx.strokeStyle = c.armor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-6, -hh - 1 + bob)
  ctx.lineTo(0, -hh + bob)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(12, -hh - 1 + bob)
  ctx.lineTo(6, -hh + bob)
  ctx.stroke()
}

function drawBoss(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const c = COLORS.enemy.boss
  const hw = enemy.width / 2
  const hh = enemy.height / 2
  const pulse = Math.sin(Date.now() * 0.003) * 0.2

  // Aura
  ctx.fillStyle = c.aura
  ctx.beginPath()
  ctx.arc(0, 0, hw + 12 + pulse * 10, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  ctx.fillStyle = c.body
  const legAnim = Math.sin(enemy.animFrame * 0.1) * 4
  ctx.fillRect(-hw + 6, hh - 14 + legAnim, 12, 18)
  ctx.fillRect(hw - 18, hh - 14 - legAnim, 12, 18)
  ctx.fillStyle = '#882222'
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-hw + 4 + i * 4, hh + 2 + legAnim, 3, 5)
    ctx.fillRect(hw - 18 + i * 4, hh + 2 - legAnim, 3, 5)
  }

  // Body
  ctx.fillStyle = c.body
  roundRect(ctx, -hw + 2, -hh + 6, enemy.width - 4, enemy.height - 18, 8)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  roundRect(ctx, -hw + 6, -hh + 10, enemy.width - 12, enemy.height - 26, 6)
  ctx.fill()

  // Spikes
  ctx.fillStyle = '#aa1122'
  for (let i = 0; i < 5; i++) {
    const sx = -hw + 8 + i * ((enemy.width - 16) / 4)
    ctx.beginPath()
    ctx.moveTo(sx - 4, -hh + 6)
    ctx.lineTo(sx, -hh - 8 - Math.sin(Date.now() * 0.004 + i) * 3)
    ctx.lineTo(sx + 4, -hh + 6)
    ctx.closePath()
    ctx.fill()
  }

  // Arms
  ctx.fillStyle = c.body
  ctx.fillRect(-hw - 8, -hh + 14, 12, 24)
  ctx.fillRect(hw - 4, -hh + 14, 12, 24)
  ctx.fillStyle = '#aa1122'
  ctx.beginPath()
  ctx.arc(-hw - 2, -hh + 40, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(hw + 2, -hh + 40, 8, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.fillStyle = c.body
  roundRect(ctx, -12, -hh - 8, 26, 20, 5)
  ctx.fill()

  // Crown
  ctx.fillStyle = c.crown
  ctx.beginPath()
  ctx.moveTo(-10, -hh - 8)
  ctx.lineTo(-8, -hh - 18)
  ctx.lineTo(-2, -hh - 10)
  ctx.lineTo(4, -hh - 20)
  ctx.lineTo(10, -hh - 10)
  ctx.lineTo(16, -hh - 18)
  ctx.lineTo(18, -hh - 8)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#ff2222'
  ctx.beginPath()
  ctx.arc(-8, -hh - 14, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2222ff'
  ctx.beginPath()
  ctx.arc(4, -hh - 16, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#22ff22'
  ctx.beginPath()
  ctx.arc(16, -hh - 14, 2, 0, Math.PI * 2)
  ctx.fill()

  // Eyes (glowing)
  ctx.shadowColor = c.eye
  ctx.shadowBlur = 8
  ctx.fillStyle = c.eye
  ctx.beginPath()
  ctx.ellipse(-4, -hh - 1, 5, 4, -0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(10, -hh - 1, 5, 4, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#cc0000'
  ctx.beginPath()
  ctx.arc(-3, -hh - 1, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(11, -hh - 1, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Mouth
  ctx.fillStyle = '#880000'
  ctx.beginPath()
  ctx.ellipse(3, -hh + 8, 8, 4, 0, 0, Math.PI)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(-3 + i * 3, -hh + 6, 2, 4)
  }
}

// ─── Bullets ───
export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, cameraX: number, cameraY: number) {
  const bx = bullet.x - cameraX
  const by = bullet.y - cameraY

  ctx.shadowColor = bullet.fromPlayer ? COLORS.bullet.playerGlow : COLORS.bullet.enemyGlow
  ctx.shadowBlur = 10

  ctx.fillStyle = bullet.fromPlayer ? COLORS.bullet.player : COLORS.bullet.enemy
  ctx.beginPath()
  ctx.arc(bx, by, bullet.radius, 0, Math.PI * 2)
  ctx.fill()

  // Trail
  ctx.fillStyle = bullet.fromPlayer ? COLORS.bullet.playerGlow : COLORS.bullet.enemyGlow
  ctx.beginPath()
  ctx.arc(bx - bullet.vx * 0.02, by - bullet.vy * 0.02, bullet.radius * 0.7, 0, Math.PI * 2)
  ctx.fill()

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
  roundRect(ctx, 10, 10, 220, 80, 8)
  ctx.fill()
  ctx.strokeStyle = COLORS.hud.panelBorder
  ctx.lineWidth = 1
  roundRect(ctx, 10, 10, 220, 80, 8)
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
  ctx.fillText(`SCORE: ${player.score}`, 20, 78)

  // Controls hint (top right)
  ctx.fillStyle = COLORS.hud.panelBg
  roundRect(ctx, canvasW - 210, 10, 200, 80, 8)
  ctx.fill()
  ctx.strokeStyle = COLORS.hud.panelBorder
  roundRect(ctx, canvasW - 210, 10, 200, 80, 8)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = '11px Geist, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('A/D or Arrows - Move', canvasW - 20, 30)
  ctx.fillText('W or Space - Jump', canvasW - 20, 46)
  ctx.fillText('Shift - Jetpack', canvasW - 20, 62)
  ctx.fillText('Click or J - Shoot', canvasW - 20, 78)
  ctx.textAlign = 'left'
}

// ─── Jetpack Flames ───
export function drawJetpackFlame(ctx: CanvasRenderingContext2D, player: Player, cameraX: number, cameraY: number) {
  const px = player.x - cameraX + player.width / 2
  const py = player.y - cameraY + player.height / 2
  const f = player.facing

  const baseX = px - f * 10
  const baseY = py + 18

  for (let i = 0; i < 3; i++) {
    const flameH = 8 + Math.random() * 12
    const flameW = 3 + Math.random() * 3
    ctx.fillStyle = COLORS.player.flame[i]
    ctx.globalAlpha = 0.7 + Math.random() * 0.3
    ctx.beginPath()
    ctx.ellipse(baseX + (Math.random() - 0.5) * 4, baseY + flameH / 2, flameW, flameH, 0, 0, Math.PI * 2)
    ctx.fill()
  }
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
