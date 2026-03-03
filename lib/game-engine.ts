import type { GameState, Player, Platform, Enemy, Bullet, Particle, Star, Keys, EnemyType, SoundEvents } from './game-types'

// ─── Constants ───
const GRAVITY = 1400
const PLAYER_SPEED = 280
const JUMP_FORCE = -520
const JETPACK_FORCE = -1400
const JETPACK_FUEL_RATE = 18
const JETPACK_REGEN_RATE = 15
const BULLET_SPEED = 700
const SHOOT_COOLDOWN = 0.18
const PLAYER_MAX_HEALTH = 100
const PLAYER_MAX_FUEL = 100
export const GROUND_Y = 500

// ─── Level Generation ───
// difficultyMultiplier: 1.0 = easy (default), 1.3 = medium, 1.65 = hard
export function generateLevel(level: number, difficultyMultiplier: number = 1.0): Pick<GameState, 'platforms' | 'enemies' | 'levelLength'> {
  const platforms: Platform[] = []
  const enemies: Enemy[] = []
  const levelLength = 6000 + level * 2000

  const MIN_PLATFORM_DIST = 180 // minimum distance between any two platforms

  // Helper to check if a new platform is far enough from all existing ones
  const isFarEnough = (px: number, py: number, pw: number) => {
    for (const p of platforms) {
      const dx = Math.abs((px + pw / 2) - (p.x + p.width / 2))
      const dy = Math.abs(py - p.y)
      if (dx < MIN_PLATFORM_DIST && dy < MIN_PLATFORM_DIST * 0.6) return false
    }
    return true
  }

  // Elevated platforms above the continuous ground (for jumping/flying to)
  const platformCount = Math.floor(levelLength / 280)
  let attempts = 0
  for (let placed = 0; placed < platformCount && attempts < platformCount * 5; attempts++) {
    const px = 250 + Math.random() * (levelLength - 400)
    const py = 180 + Math.random() * 230
    const pw = 80 + Math.random() * 120
    if (!isFarEnough(px, py, pw)) continue
    const roll = Math.random()
    const pType = roll > 0.6 ? 'floating' : roll > 0.3 ? 'metal' : 'normal'
    platforms.push({
      x: px,
      y: py,
      width: pw,
      height: 16,
      type: pType,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 1 + Math.random(),
    })
    placed++
  }

  // Add larger mid-height strategic platforms with guaranteed spacing
  for (let i = 0; i < levelLength / 600; i++) {
    const px = 400 + i * 600 + Math.random() * 200
    const py = 330 + Math.random() * 80
    const pw = 120 + Math.random() * 100
    if (!isFarEnough(px, py, pw)) continue
    platforms.push({
      x: px,
      y: py,
      width: pw,
      height: 18,
      type: 'metal',
    })
  }

  // Enemies - density affected by difficulty multiplier
  const enemyDensity = (0.8 + level * 0.3) * difficultyMultiplier
  for (let ex = 400; ex < levelLength - 200; ex += 200 + Math.random() * 300 / enemyDensity) {
    const roll = Math.random()
    let type: EnemyType
    if (roll < 0.35) type = 'grunt'
    else if (roll < 0.55) type = 'spitter'
    else if (roll < 0.75) type = 'flyer'
    else if (roll < 0.9) type = 'brute'
    else type = 'grunt'

    const eSize = getEnemySize(type)
    const ey = type === 'flyer' ? 100 + Math.random() * 200 : GROUND_Y - eSize.h
    enemies.push(createEnemy(type, ex, ey))
  }

  // Boss at end
  const bossX = levelLength - 300
  enemies.push(createEnemy('boss', bossX, GROUND_Y - 64))

  return { platforms, enemies, levelLength }
}

function getEnemySize(type: EnemyType) {
  switch (type) {
    case 'grunt': return { w: 28, h: 28 }
    case 'spitter': return { w: 30, h: 36 }
    case 'flyer': return { w: 32, h: 28 }
    case 'brute': return { w: 40, h: 48 }
    case 'boss': return { w: 56, h: 64 }
  }
}

function createEnemy(type: EnemyType, x: number, y: number): Enemy {
  const size = getEnemySize(type)
  const healthMap: Record<EnemyType, number> = {
    grunt: 2,
    spitter: 3,
    flyer: 2,
    brute: 8,
    boss: 30,
  }
  return {
    x, y,
    width: size.w,
    height: size.h,
    vx: 0, vy: 0,
    type,
    health: healthMap[type],
    maxHealth: healthMap[type],
    animFrame: 0,
    animTimer: 0,
    shootCooldown: Math.random() * 2,
    active: true,
    facing: -1,
    floatAngle: Math.random() * Math.PI * 2,
  }
}

// ─── Stars (re-used as cloud data) ───
export function generateStars(count: number, canvasW: number, canvasH: number): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvasW * 3,
      y: Math.random() * canvasH * 0.7,
      size: 0.5 + Math.random() * 2,
      speed: 0.05 + Math.random() * 0.15,
      brightness: 0.3 + Math.random() * 0.7,
    })
  }
  return stars
}

// ─── Create Initial Player ───
export function createPlayer(): Player {
  return {
    x: 50,
    y: 400,
    width: 28,
    height: 38,
    vx: 0,
    vy: 0,
    onGround: false,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    jetpackFuel: PLAYER_MAX_FUEL,
    maxJetpackFuel: PLAYER_MAX_FUEL,
    facing: 1,
    animFrame: 0,
    animTimer: 0,
    shooting: false,
    shootCooldown: 0,
    invincibleTimer: 0,
    score: 0,
    aimAngle: 0,
  }
}

// ─── Update ───
export function updateGame(state: GameState, keys: Keys, dt: number, canvasW: number, canvasH: number): GameState & { soundEvents: SoundEvents } {
  const emptySoundEvents: SoundEvents = {
    playerShoot: false,
    playerJump: false,
    playerHit: false,
    alienHit: false,
    alienDeath: false,
    alienShoot: false,
    bossRoar: false,
    explosion: false,
  }
  
  if (state.gameOver || state.gameWon || state.paused || !state.started) {
    return { ...state, soundEvents: emptySoundEvents }
  }

  dt = Math.min(dt, 0.033)

  const soundEvents = { ...emptySoundEvents }
  const player = { ...state.player }
  let bullets = [...state.bullets]
  let enemies = state.enemies.map(e => ({ ...e }))
  let particles = [...state.particles]

  // ─ Player Movement ─
  player.vx = 0
  if (keys.left) { player.vx = -PLAYER_SPEED; player.facing = -1 }
  if (keys.right) { player.vx = PLAYER_SPEED; player.facing = 1 }

  // Compute aim angle from mouse position (screen coords to world-relative angle)
  const playerScreenX = player.x - state.cameraX + player.width / 2
  const playerScreenY = player.y - state.cameraY + player.height / 2 - 6 // gun height offset
  const aimDx = keys.mouseX - playerScreenX
  const aimDy = keys.mouseY - playerScreenY
  player.aimAngle = Math.atan2(aimDy, aimDx)
  // Face the direction of the mouse
  if (aimDx > 0) player.facing = 1
  else if (aimDx < 0) player.facing = -1

  // Jump
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE
    player.onGround = false
    soundEvents.playerJump = true
  }

  // Jetpack
  let usingJetpack = false
  if (keys.jetpack && player.jetpackFuel > 0) {
    player.vy += JETPACK_FORCE * dt
    player.jetpackFuel -= JETPACK_FUEL_RATE * dt
    player.jetpackFuel = Math.max(0, player.jetpackFuel)
    usingJetpack = true
  } else if (player.onGround) {
    player.jetpackFuel = Math.min(player.maxJetpackFuel, player.jetpackFuel + JETPACK_REGEN_RATE * dt)
  }

  // Gravity
  player.vy += GRAVITY * dt
  player.vy = Math.max(-600, Math.min(player.vy, 800))

  // Apply velocity
  player.x += player.vx * dt
  player.y += player.vy * dt

  // Animation
  player.animTimer += dt
  if (player.animTimer > 0.05) {
    player.animFrame++
    player.animTimer = 0
  }

  // Shooting
  player.shootCooldown -= dt
  if (keys.shoot && player.shootCooldown <= 0) {
    player.shootCooldown = SHOOT_COOLDOWN
    player.shooting = true
    soundEvents.playerShoot = true
    const bulletAngle = player.aimAngle
    bullets.push({
      x: player.x + player.width / 2 + Math.cos(bulletAngle) * 20,
      y: player.y + 12 + Math.sin(bulletAngle) * 20,
      vx: Math.cos(bulletAngle) * BULLET_SPEED,
      vy: Math.sin(bulletAngle) * BULLET_SPEED,
      radius: 4,
      fromPlayer: true,
      active: true,
      damage: 1,
    })
  }

  // Invincibility
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt
  }

  // ─ Continuous Ground Collision ─
  player.onGround = false
  if (player.y + player.height >= GROUND_Y && player.vy >= 0) {
    player.y = GROUND_Y - player.height
    player.vy = 0
    player.onGround = true
  }

  // ─ Platform Collision (elevated platforms only) ─
  for (const plat of state.platforms) {
    const platY = plat.y + (plat.type === 'floating' ? Math.sin((Date.now() * 0.002) + (plat.floatOffset || 0)) * 6 : 0)
    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > platY &&
      player.y + player.height < platY + plat.height + player.vy * dt + 10 &&
      player.vy >= 0
    ) {
      player.y = platY - player.height
      player.vy = 0
      player.onGround = true
    }
  }

  // Fall death (shouldn't happen with continuous ground but safety net)
  if (player.y > 800) {
    player.health = 0
  }

  // ─ Enemy Update ���
  for (const enemy of enemies) {
    if (!enemy.active) continue

    enemy.animTimer += dt
    if (enemy.animTimer > 0.05) {
      enemy.animFrame++
      enemy.animTimer = 0
    }

    enemy.facing = player.x < enemy.x ? -1 : 1

    const distToPlayer = Math.abs(enemy.x - player.x)

    switch (enemy.type) {
      case 'grunt':
        if (distToPlayer < 400) {
          enemy.vx = enemy.facing * 60
        } else {
          enemy.vx = 0
        }
        enemy.vy += GRAVITY * dt
        break

      case 'spitter':
        if (distToPlayer < 500) {
          enemy.vx = enemy.facing * 30
        }
        enemy.vy += GRAVITY * dt
        enemy.shootCooldown -= dt
        if (enemy.shootCooldown <= 0 && distToPlayer < 500) {
          enemy.shootCooldown = 2 + Math.random()
          soundEvents.alienShoot = true
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
          bullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 250,
            vy: Math.sin(angle) * 250,
            radius: 5,
            fromPlayer: false,
            active: true,
            damage: 10,
          })
        }
        break

      case 'flyer':
        enemy.floatAngle = (enemy.floatAngle || 0) + dt * 2
        enemy.vy = Math.sin(enemy.floatAngle) * 80
        if (distToPlayer < 450) {
          enemy.vx = enemy.facing * 100
        } else {
          enemy.vx *= 0.95
        }
        if (distToPlayer < 150 && enemy.y < player.y) {
          enemy.vy += 200 * dt
        }
        break

      case 'brute':
        if (distToPlayer < 300) {
          enemy.vx = enemy.facing * 40
        } else {
          enemy.vx = 0
        }
        enemy.vy += GRAVITY * dt
        break

      case 'boss':
        if (distToPlayer < 600) {
          enemy.vx = enemy.facing * 35
        }
        enemy.vy += GRAVITY * dt
        enemy.shootCooldown -= dt
        if (enemy.shootCooldown <= 0 && distToPlayer < 600) {
          enemy.shootCooldown = 0.8 + Math.random() * 0.5
          soundEvents.bossRoar = true
          for (let i = -1; i <= 1; i++) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + i * 0.3
            bullets.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(angle) * 280,
              vy: Math.sin(angle) * 280,
              radius: 6,
              fromPlayer: false,
              active: true,
              damage: 15,
            })
          }
        }
        break
    }

    enemy.x += enemy.vx * dt
    enemy.y += enemy.vy * dt

    // Enemy ground collision (not flyers)
    if (enemy.type !== 'flyer') {
      if (enemy.y + enemy.height >= GROUND_Y && enemy.vy >= 0) {
        enemy.y = GROUND_Y - enemy.height
        enemy.vy = 0
      }
      // Also check elevated platforms
      for (const plat of state.platforms) {
        const platY = plat.y + (plat.type === 'floating' ? Math.sin((Date.now() * 0.002) + (plat.floatOffset || 0)) * 6 : 0)
        if (
          enemy.x + enemy.width > plat.x &&
          enemy.x < plat.x + plat.width &&
          enemy.y + enemy.height > platY &&
          enemy.y + enemy.height < platY + 20 &&
          enemy.vy >= 0
        ) {
          enemy.y = platY - enemy.height
          enemy.vy = 0
        }
      }
    }

    // Enemy-player collision
    if (
      player.invincibleTimer <= 0 &&
      player.x + player.width > enemy.x &&
      player.x < enemy.x + enemy.width &&
      player.y + player.height > enemy.y &&
      player.y < enemy.y + enemy.height
    ) {
      const contactDmg = enemy.type === 'boss' ? 20 : enemy.type === 'brute' ? 15 : 10
      player.health -= contactDmg
      player.invincibleTimer = 1.0
      player.vy = -300
      player.vx = (player.x < enemy.x ? -1 : 1) * 200
      soundEvents.playerHit = true

      for (let i = 0; i < 8; i++) {
        particles.push(createParticle(player.x + player.width / 2, player.y + player.height / 2, '#ff4444'))
      }
    }
  }

  // ─ Bullet Update ─
  for (const bullet of bullets) {
    if (!bullet.active) continue
    bullet.x += bullet.vx * dt
    bullet.y += bullet.vy * dt

    if (bullet.x < state.cameraX - 100 || bullet.x > state.cameraX + canvasW + 100 || bullet.y < -100 || bullet.y > 800) {
      bullet.active = false
      continue
    }

    if (bullet.fromPlayer) {
      for (const enemy of enemies) {
        if (!enemy.active) continue
        if (
          bullet.x + bullet.radius > enemy.x &&
          bullet.x - bullet.radius < enemy.x + enemy.width &&
          bullet.y + bullet.radius > enemy.y &&
          bullet.y - bullet.radius < enemy.y + enemy.height
        ) {
          bullet.active = false
          enemy.health -= bullet.damage
          soundEvents.alienHit = true

          for (let i = 0; i < 5; i++) {
            particles.push(createParticle(bullet.x, bullet.y, '#44ffaa'))
          }

          if (enemy.health <= 0) {
            enemy.active = false
            soundEvents.alienDeath = true
            soundEvents.explosion = true
            const scoreMap: Record<EnemyType, number> = { grunt: 100, spitter: 200, flyer: 250, brute: 500, boss: 2000 }
            player.score += scoreMap[enemy.type]

            for (let i = 0; i < 15; i++) {
              const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ffffff']
              particles.push(createParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, colors[Math.floor(Math.random() * colors.length)]))
            }

            if (enemy.type === 'boss') {
              return {
                ...state,
                player,
                bullets,
                enemies,
                particles,
                gameWon: true,
                soundEvents,
              }
            }
          }
          break
        }
      }
    } else {
      if (
        player.invincibleTimer <= 0 &&
        bullet.x + bullet.radius > player.x &&
        bullet.x - bullet.radius < player.x + player.width &&
        bullet.y + bullet.radius > player.y &&
        bullet.y - bullet.radius < player.y + player.height
      ) {
        bullet.active = false
        player.health -= bullet.damage
        player.invincibleTimer = 0.5
        soundEvents.playerHit = true

        for (let i = 0; i < 6; i++) {
          particles.push(createParticle(bullet.x, bullet.y, '#ff4444'))
        }
      }
    }

    // Bullets hit ground
    if (bullet.y >= GROUND_Y) {
      bullet.active = false
      for (let i = 0; i < 3; i++) {
        particles.push(createParticle(bullet.x, GROUND_Y, '#8b5e3c'))
      }
    }

    // Bullets hit platforms
    for (const plat of state.platforms) {
      const platY = plat.y + (plat.type === 'floating' ? Math.sin((Date.now() * 0.002) + (plat.floatOffset || 0)) * 6 : 0)
      if (
        bullet.x > plat.x && bullet.x < plat.x + plat.width &&
        bullet.y > platY && bullet.y < platY + plat.height
      ) {
        bullet.active = false
        for (let i = 0; i < 3; i++) {
          particles.push(createParticle(bullet.x, bullet.y, '#888888'))
        }
        break
      }
    }
  }

  // ─ Jetpack Particles ─
  if (usingJetpack) {
    const baseX = player.x + player.width / 2 - player.facing * 10
    const baseY = player.y + player.height - 2
    for (let i = 0; i < 2; i++) {
      const colors = ['#ff6622', '#ffaa22', '#ffdd44']
      particles.push({
        x: baseX + (Math.random() - 0.5) * 6,
        y: baseY,
        vx: (Math.random() - 0.5) * 40,
        vy: 100 + Math.random() * 80,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
      })
    }
  }

  // ─ Particle Update ─
  particles = particles.filter(p => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 200 * dt
    p.life -= dt
    return p.life > 0
  })

  // ─ Camera ─
  const targetCamX = player.x - canvasW * 0.35
  const targetCamY = Math.min(0, player.y - canvasH * 0.5)
  const camX = state.cameraX + (targetCamX - state.cameraX) * 0.08
  const camY = state.cameraY + (targetCamY - state.cameraY) * 0.05

  // ─ Clean up ─
  bullets = bullets.filter(b => b.active)
  enemies = enemies.filter(e => e.active || e.type === 'boss')

  const gameOver = player.health <= 0

  return {
    ...state,
    player,
    bullets,
    enemies,
    particles,
    cameraX: camX,
    cameraY: camY,
    gameOver,
    soundEvents,
  }
}

function createParticle(x: number, y: number, color: string): Particle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 200,
    vy: (Math.random() - 0.5) * 200 - 50,
    life: 0.4 + Math.random() * 0.4,
    maxLife: 0.8,
    color,
    size: 2 + Math.random() * 4,
  }
}
