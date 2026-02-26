import type { GameState, Player, Platform, Enemy, Bullet, Particle, Star, Keys, EnemyType } from './game-types'

// ─── Constants ───
const GRAVITY = 1400
const PLAYER_SPEED = 280
const JUMP_FORCE = -520
const JETPACK_FORCE = -600
const JETPACK_FUEL_RATE = 35
const JETPACK_REGEN_RATE = 12
const BULLET_SPEED = 700
const SHOOT_COOLDOWN = 0.18
const PLAYER_MAX_HEALTH = 100
const PLAYER_MAX_FUEL = 100
export const GROUND_Y = 500

// ─── Level Generation ───
export function generateLevel(level: number): Pick<GameState, 'platforms' | 'enemies' | 'levelLength'> {
  const platforms: Platform[] = []
  const enemies: Enemy[] = []
  const levelLength = 6000 + level * 2000

  // Elevated platforms above the continuous ground (for jumping/flying to)
  for (let i = 0; i < levelLength / 250; i++) {
    const px = 250 + Math.random() * (levelLength - 400)
    const py = 200 + Math.random() * 220
    const pw = 80 + Math.random() * 120
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
  }

  // Add a few larger mid-height platforms for strategic positions
  for (let i = 0; i < levelLength / 600; i++) {
    const px = 400 + i * 600 + Math.random() * 200
    const py = 340 + Math.random() * 80
    platforms.push({
      x: px,
      y: py,
      width: 120 + Math.random() * 100,
      height: 18,
      type: 'metal',
    })
  }

  // Enemies
  const enemyDensity = 0.8 + level * 0.3
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
  }
}

// ─── Update ───
export function updateGame(state: GameState, keys: Keys, dt: number, canvasW: number, canvasH: number): GameState {
  if (state.gameOver || state.gameWon || state.paused || !state.started) return state

  dt = Math.min(dt, 0.033)

  const player = { ...state.player }
  let bullets = [...state.bullets]
  let enemies = state.enemies.map(e => ({ ...e }))
  let particles = [...state.particles]

  // ─ Player Movement ─
  player.vx = 0
  if (keys.left) { player.vx = -PLAYER_SPEED; player.facing = -1 }
  if (keys.right) { player.vx = PLAYER_SPEED; player.facing = 1 }

  // Jump
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE
    player.onGround = false
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
  player.vy = Math.min(player.vy, 800)

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
    bullets.push({
      x: player.x + player.width / 2 + player.facing * 20,
      y: player.y + 12,
      vx: BULLET_SPEED * player.facing,
      vy: 0,
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

  // ─ Enemy Update ─
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

          for (let i = 0; i < 5; i++) {
            particles.push(createParticle(bullet.x, bullet.y, '#44ffaa'))
          }

          if (enemy.health <= 0) {
            enemy.active = false
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
