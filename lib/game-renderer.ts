import type { GameState, Player, Platform, Enemy, Bullet, Particle, Star } from './game-types'

// ─── Colors ───
const COLORS = {
  sky: {
    top: '#0a0e1a',
    mid: '#121832',
    bottom: '#1a2244',
  },
  stars: '#ffffff',
  platform: {
    normal: { top: '#4a7c59', side: '#2d5a3a', grass: '#6db87a' },
    metal: { top: '#5a6a7a', side: '#3a4a5a', highlight: '#8a9aaa' },
    floating: { top: '#4a5a8a', side: '#2a3a5a', glow: 'rgba(100,140,255,0.3)' },
  },
  player: {
    body: '#3a5a3a',
    bodyLight: '#5a8a5a',
    skin: '#e8c49a',
    helmet: '#4a5a4a',
    visor: '#44aaff',
    jetpack: '#6a6a6a',
    jetpackLight: '#8a8a8a',
    flame: ['#ff6622', '#ffaa22', '#ffdd44'],
    gun: '#555555',
    gunLight: '#777777',
  },
  enemy: {
    grunt: { body: '#44aa55', bodyLight: '#66cc77', eye: '#ffffff', pupil: '#111111' },
    spitter: { body: '#55aa88', bodyLight: '#77ccaa', eye: '#ffff44', spit: '#88ff44' },
    flyer: { body: '#6688cc', bodyLight: '#88aaee', wing: '#4466aa', eye: '#ff4444' },
    brute: { body: '#cc8844', bodyLight: '#eeaa66', eye: '#ff2222', armor: '#aa6622' },
    boss: { body: '#cc2233', bodyLight: '#ee4455', eye: '#ffff00', crown: '#ffaa00', aura: 'rgba(255,50,50,0.2)' },
  },
  bullet: {
    player: '#44ddff',
    playerGlow: 'rgba(68,221,255,0.4)',
    enemy: '#ff4444',
    enemyGlow: 'rgba(255,68,68,0.4)',
  },
  hud: {
    health: '#44dd55',
    healthBg: '#333333',
    fuel: '#44aaff',
    fuelBg: '#333333',
    text: '#ffffff',
    textShadow: '#000000',
    panelBg: 'rgba(0,0,0,0.6)',
    panelBorder: 'rgba(255,255,255,0.1)',
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
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], cameraX: number) {
  for (const star of stars) {
    const sx = ((star.x - cameraX * star.speed) % (ctx.canvas.width + 100) + ctx.canvas.width + 100) % (ctx.canvas.width + 100)
    ctx.globalAlpha = star.brightness * (0.5 + 0.5 * Math.sin(Date.now() * 0.001 + star.x))
    ctx.fillStyle = COLORS.stars
    ctx.beginPath()
    ctx.arc(sx, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawParallaxMountains(ctx: CanvasRenderingContext2D, cameraX: number, canvasW: number, canvasH: number) {
  // Far mountains
  ctx.fillStyle = '#0d1525'
  drawMountainLayer(ctx, cameraX * 0.1, canvasW, canvasH, 0.6, 150, 200)
  // Mid mountains
  ctx.fillStyle = '#111d30'
  drawMountainLayer(ctx, cameraX * 0.2, canvasW, canvasH, 0.7, 120, 160)
  // Near hills
  ctx.fillStyle = '#152540'
  drawMountainLayer(ctx, cameraX * 0.35, canvasW, canvasH, 0.8, 80, 120)
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

// ─── Platforms ───
export function drawPlatform(ctx: CanvasRenderingContext2D, platform: Platform, cameraX: number, cameraY: number) {
  const x = platform.x - cameraX
  const y = platform.y - cameraY + (platform.type === 'floating' ? Math.sin((Date.now() * 0.002) + (platform.floatOffset || 0)) * 6 : 0)
  const w = platform.width
  const h = platform.height

  const colors = COLORS.platform[platform.type]

  if (platform.type === 'floating') {
    ctx.shadowColor = COLORS.platform.floating.glow
    ctx.shadowBlur = 12
  }

  // Side face
  ctx.fillStyle = colors.side
  ctx.fillRect(x, y + 4, w, h - 4)

  // Top face
  const topGrad = ctx.createLinearGradient(x, y, x, y + 6)
  topGrad.addColorStop(0, colors.top)
  topGrad.addColorStop(1, colors.side)
  ctx.fillStyle = topGrad
  ctx.fillRect(x, y, w, 6)

  // Grass / highlight on top
  if (platform.type === 'normal') {
    ctx.fillStyle = (colors as typeof COLORS.platform.normal).grass
    for (let gx = x + 2; gx < x + w - 2; gx += 6) {
      const gh = 3 + Math.sin(gx * 0.3) * 2
      ctx.fillRect(gx, y - gh, 2, gh)
    }
  }

  // Metal rivets
  if (platform.type === 'metal') {
    ctx.fillStyle = (colors as typeof COLORS.platform.metal).highlight
    for (let rx = x + 10; rx < x + w - 10; rx += 24) {
      ctx.beginPath()
      ctx.arc(rx, y + h / 2 + 2, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.shadowBlur = 0
}

// ─── Player ───
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

  // ─ Jetpack ─
  ctx.fillStyle = COLORS.player.jetpack
  ctx.fillRect(-hw - 6, -hh + 6, 8, 20)
  ctx.fillStyle = COLORS.player.jetpackLight
  ctx.fillRect(-hw - 5, -hh + 7, 3, 18)
  // Nozzle
  ctx.fillStyle = '#444444'
  ctx.fillRect(-hw - 4, -hh + 26, 6, 4)

  // ─ Legs ─
  const legOffset = player.onGround ? Math.sin(player.animFrame * 0.3) * 4 : -2
  ctx.fillStyle = COLORS.player.body
  ctx.fillRect(-4, hh - 12, 6, 12 + legOffset)
  ctx.fillRect(2, hh - 12, 6, 12 - legOffset)
  // Boots
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(-5, hh - 1 + legOffset, 8, 4)
  ctx.fillRect(1, hh - 1 - legOffset, 8, 4)

  // ─ Body (torso) ─
  ctx.fillStyle = COLORS.player.body
  roundRect(ctx, -hw + 4, -hh + 8, player.width - 8, 22, 3)
  ctx.fill()
  // Body highlight
  ctx.fillStyle = COLORS.player.bodyLight
  roundRect(ctx, -hw + 6, -hh + 10, 6, 16, 2)
  ctx.fill()
  // Belt
  ctx.fillStyle = '#5a4a2a'
  ctx.fillRect(-hw + 4, -hh + 26, player.width - 8, 3)
  ctx.fillStyle = '#bba833'
  ctx.fillRect(-2, -hh + 25, 5, 5) // buckle

  // ─ Arm + Gun ─
  const armY = -hh + 14
  const recoil = player.shootCooldown > 0.1 ? -2 : 0
  // Arm
  ctx.fillStyle = COLORS.player.body
  ctx.fillRect(hw - 8, armY, 14 + recoil, 5)
  // Gun
  ctx.fillStyle = COLORS.player.gun
  ctx.fillRect(hw + 4 + recoil, armY - 2, 14, 4)
  ctx.fillRect(hw + 14 + recoil, armY - 4, 6, 8)
  ctx.fillStyle = COLORS.player.gunLight
  ctx.fillRect(hw + 6 + recoil, armY - 1, 10, 2)
  // Muzzle flash
  if (player.shootCooldown > 0.12) {
    ctx.fillStyle = '#ffff88'
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(hw + 22, armY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // ─ Head / Helmet ─
  ctx.fillStyle = COLORS.player.helmet
  roundRect(ctx, -6, -hh - 2, 14, 14, 4)
  ctx.fill()
  // Visor
  ctx.fillStyle = COLORS.player.visor
  const visorGrad = ctx.createLinearGradient(0, -hh, 0, -hh + 8)
  visorGrad.addColorStop(0, '#66ccff')
  visorGrad.addColorStop(1, '#2288cc')
  ctx.fillStyle = visorGrad
  roundRect(ctx, 0, -hh + 1, 9, 7, 2)
  ctx.fill()
  // Visor shine
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillRect(2, -hh + 2, 3, 2)

  // Antenna
  ctx.strokeStyle = '#888888'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-2, -hh - 2)
  ctx.lineTo(-4, -hh - 10)
  ctx.stroke()
  ctx.fillStyle = '#ff3333'
  ctx.beginPath()
  ctx.arc(-4, -hh - 11, 2, 0, Math.PI * 2)
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
    ctx.fillStyle = '#333'
    ctx.fillRect(ex, ey - 10, barW, barH)
    ctx.fillStyle = hpRatio > 0.5 ? '#44dd55' : hpRatio > 0.25 ? '#ddaa22' : '#dd2222'
    ctx.fillRect(ex, ey - 10, barW * hpRatio, barH)
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
  // Lighter belly
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

  // Body - taller, thin
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(0, bob, hw - 4, hh, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.beginPath()
  ctx.ellipse(0, bob + 2, hw - 8, hh - 6, 0, 0, Math.PI * 2)
  ctx.fill()
  // Long neck head
  ctx.fillStyle = c.body
  ctx.beginPath()
  ctx.ellipse(4, bob - hh + 4, 8, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  // Eyes (2)
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
  // Mouth
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

  // Eyes (menacing)
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

  // Legs (thick)
  ctx.fillStyle = c.body
  const legAnim = Math.sin(enemy.animFrame * 0.12) * 3
  ctx.fillRect(-hw + 4, hh - 10 + legAnim, 10, 14)
  ctx.fillRect(hw - 14, hh - 10 - legAnim, 10, 14)

  // Body (large, armored)
  ctx.fillStyle = c.armor
  roundRect(ctx, -hw + 2, -hh + 4 + bob, enemy.width - 4, enemy.height - 14, 6)
  ctx.fill()
  ctx.fillStyle = c.body
  roundRect(ctx, -hw + 4, -hh + 6 + bob, enemy.width - 8, enemy.height - 18, 4)
  ctx.fill()
  ctx.fillStyle = c.bodyLight
  ctx.fillRect(-hw + 8, -hh + 10 + bob, 8, 14)

  // Arms (beefy)
  ctx.fillStyle = c.body
  ctx.fillRect(-hw - 6, -hh + 12 + bob, 10, 20)
  ctx.fillRect(hw - 4, -hh + 12 + bob, 10, 20)
  // Fists
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
  // Eyes (angry)
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
  // Clawed feet
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

  // Spikes on back
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
  // Crown gems
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

  const colors = bullet.fromPlayer ? COLORS.bullet : { player: COLORS.bullet.enemy, playerGlow: COLORS.bullet.enemyGlow }

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

  // Health label
  ctx.fillStyle = COLORS.hud.text
  ctx.font = 'bold 12px Geist, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('HEALTH', 20, 32)
  // Health bar
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

  // Fuel label
  ctx.fillStyle = COLORS.hud.text
  ctx.fillText('FUEL', 20, 52)
  // Fuel bar
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
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
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
