import type { GameState, Player, Platform, Enemy, Bullet, Particle, Star, Keys, EnemyType, SoundEvents, WeaponType, GearUpgrades } from './game-types'

// ─── Constants ───
const GRAVITY = 1400
const PLAYER_SPEED = 280
const JUMP_FORCE = -520
const JETPACK_FORCE = -1000
const JETPACK_FUEL_RATE = 30
const JETPACK_REGEN_RATE = 8
const BULLET_SPEED = 700
const SHOOT_COOLDOWN = 0.18

// Weapon configs
const WEAPON_CONFIGS: Record<WeaponType, { speed: number; cooldown: number; damage: number; count: number; spread: number; radius: number; ammoCost: number }> = {
  blastop:  { speed: 700,  cooldown: 0.18, damage: 0.8, count: 1, spread: 0,    radius: 4,  ammoCost: 1 },
  relav:    { speed: 650,  cooldown: 0.08, damage: 0.2, count: 1, spread: 0.08, radius: 3,  ammoCost: 0.2 },
  spalmer:  { speed: 500,  cooldown: 0.72, damage: 1,  count: 5, spread: 0.15, radius: 3,  ammoCost: 2 },
  lerange:  { speed: 1200, cooldown: 1.2,  damage: 8,  count: 1, spread: 0,    radius: 3,  ammoCost: 6 },
  plasma:   { speed: 400,  cooldown: 0.8,  damage: 4,  count: 1, spread: 0,    radius: 7,  ammoCost: 4 },
  hypershot: { speed: 350,  cooldown: 1.5,  damage: 10, count: 1, spread: 0,    radius: 10, ammoCost: 8 },
  pulse:     { speed: 556,  cooldown: 0.092, damage: 1.012, count: 1, spread: 0, radius: 4,  ammoCost: 0.8 },
  charger:   { speed: 700,  cooldown: 0.3,  damage: 0.88, count: 1, spread: 0, radius: 5,  ammoCost: 2 },
  homer:     { speed: 960,  cooldown: 1.14, damage: 7.6, count: 1, spread: 0, radius: 3,  ammoCost: 9.2 },
}
// Maximum turn rate for HOMER homing bullets (radians per second)
const HOMER_TURN_RATE = (40 * Math.PI) / 180
const PLAYER_MAX_HEALTH = 100
const PLAYER_MAX_FUEL = 100
export const GROUND_Y = 500
export const MAX_ALTITUDE_Y = -100 // y below this triggers low oxygen

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

  // Apply health boost based on difficulty (easy = 1.0, medium = 1.3, hard = 1.65)
  for (const enemy of enemies) {
    enemy.health = Math.ceil(enemy.health * difficultyMultiplier)
    enemy.maxHealth = Math.ceil(enemy.maxHealth * difficultyMultiplier)
  }

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
    bulletsFired: 0,
    bulletsRemaining: 275,
    bulletsMax: 275,
    lowOxygen: false,
    weapon: 'blastop',
    weapons: ['blastop'],
    burstCount: 0,
    burstCooldown: 0,
    chargeTime: 0,
    wasShootingLastFrame: false,
  }
}

// ─── Update ───
export function updateGame(state: GameState, keys: Keys, dt: number, canvasW: number, canvasH: number, gear?: GearUpgrades, enemyFireRateMult: number = 1): GameState & { soundEvents: SoundEvents } {
  // Gear upgrade multipliers
  const g = gear || { power: 0, fuel: 0, ammoUse: 0, weight: 0 }
  const jetpackForceMult = 1 + g.power * 0.06 + g.weight * 0.03   // power: +6%, weight: +3%
  const fuelRateMult = 1 - g.fuel * 0.06                           // fuel: -6% per level
  const ammoUseMult = 1 - g.ammoUse * 0.06                         // ammo use: -6% per level
  const speedMult = 1 + g.weight * 0.03                            // weight: +3% per level
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
  const effectiveSpeed = PLAYER_SPEED * speedMult
  if (keys.left) { player.vx = -effectiveSpeed; player.facing = -1 }
  if (keys.right) { player.vx = effectiveSpeed; player.facing = 1 }

  // Compute aim angle - mouse aim or facing-direction aim
  if (keys.mouseAim) {
    // Mouse aim: aim toward cursor position
    const playerScreenX = player.x - state.cameraX + player.width / 2
    const playerScreenY = player.y - state.cameraY + player.height / 2 - 6
    const aimDx = keys.mouseX - playerScreenX
    const aimDy = keys.mouseY - playerScreenY
    player.aimAngle = Math.atan2(aimDy, aimDx)
    // Face the direction of the mouse
    if (aimDx > 0) player.facing = 1
    else if (aimDx < 0) player.facing = -1
  } else {
    // Keyboard aim: fire in the direction the player is facing (horizontal)
    player.aimAngle = player.facing === 1 ? 0 : Math.PI
  }

  // Jump
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE
    player.onGround = false
    soundEvents.playerJump = true
  }

  // Jetpack
  let usingJetpack = false
  if (keys.jetpack && player.jetpackFuel > 0) {
    player.vy += JETPACK_FORCE * jetpackForceMult * dt
    player.jetpackFuel -= JETPACK_FUEL_RATE * fuelRateMult * dt
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

  // Weapon switching
  if (keys.switchWeapon && player.weapons.includes(keys.switchWeapon)) {
    player.weapon = keys.switchWeapon
    keys.switchWeapon = null
  }

  // Shooting
  const weaponCfg = WEAPON_CONFIGS[player.weapon]
  player.shootCooldown -= dt
  player.burstCooldown -= dt

  // Charger charge mechanic: hold to charge, release to fire
  if (player.weapon === 'charger') {
    if (keys.shoot && player.shootCooldown <= 0 && player.bulletsRemaining > 0) {
      player.chargeTime = Math.min(player.chargeTime + dt, 0.9)
    }
    // Fire on release if charged enough
    const justReleased = !keys.shoot && player.wasShootingLastFrame
    if (justReleased && player.chargeTime >= 0.3 && player.shootCooldown <= 0 && player.bulletsRemaining > 0) {
      const chargeLevel = player.chargeTime >= 0.9 ? 3 : player.chargeTime >= 0.6 ? 2 : 1
      const chargeDamage = chargeLevel === 3 ? 8.5 : chargeLevel === 2 ? 1.08 : 0.88
      const chargeCooldown = chargeLevel === 3 ? 0.9 : chargeLevel === 2 ? 0.65 : 0.3
      const chargeRadius = chargeLevel === 3 ? 8 : chargeLevel === 2 ? 6 : 5
      const chargeSpeed = chargeLevel === 3 ? 500 : chargeLevel === 2 ? 600 : 700
      const chargeAmmo = chargeLevel === 3 ? 5 : chargeLevel === 2 ? 3 : 2
      player.shootCooldown = chargeCooldown
      player.shooting = true
      soundEvents.playerShoot = true
      player.bulletsFired++
      player.bulletsRemaining = Math.max(0, player.bulletsRemaining - chargeAmmo * ammoUseMult)
      player.chargeTime = 0

      // Fire charger bullet (uses same muzzle position logic below)
      const bulletAngle = player.aimAngle
      const muzzleTipX: Record<string, number> = { blastop: 30, relav: 22, lerange: 38, hypershot: 29, spalmer: 26, plasma: 31, pulse: 26, charger: 28, homer: 38 }
      const tipLocal = muzzleTipX[player.weapon] ?? 30
      const hw = player.width / 2
      const hh = player.height / 2
      const f = player.facing
      const shoulderX = hw - 4
      const shoulderY = -hh + 16
      let drawAngle = player.aimAngle
      if (f === -1) {
        drawAngle = Math.PI - player.aimAngle
        if (drawAngle > Math.PI) drawAngle -= 2 * Math.PI
        if (drawAngle < -Math.PI) drawAngle += 2 * Math.PI
      }
      drawAngle = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, drawAngle))
      const tipArmX = tipLocal, tipArmY = 1.5
      const rotX = tipArmX * Math.cos(drawAngle) - tipArmY * Math.sin(drawAngle)
      const rotY = tipArmX * Math.sin(drawAngle) + tipArmY * Math.cos(drawAngle)
      let localX = shoulderX + rotX
      const localY = shoulderY + rotY
      if (f === -1) localX = -localX
      const spawnX = player.x + player.width / 2 + localX
      const spawnY = player.y + player.height / 2 + localY

      bullets.push({
        x: spawnX, y: spawnY,
        vx: Math.cos(bulletAngle) * chargeSpeed,
        vy: Math.sin(bulletAngle) * chargeSpeed,
        radius: chargeRadius, fromPlayer: true, active: true,
        damage: chargeDamage, weaponType: 'charger',
      })
    }
    if (!keys.shoot) player.chargeTime = 0
    player.wasShootingLastFrame = keys.shoot
  }

  // Pulse burst mechanic: after 6 shots, 1 second forced cooldown
  const burstBlocked = player.weapon === 'pulse' && player.burstCooldown > 0
  const chargerBlocked = player.weapon === 'charger'
  if (keys.shoot && player.shootCooldown <= 0 && player.bulletsRemaining > 0 && !burstBlocked && !chargerBlocked) {
    player.shootCooldown = weaponCfg.cooldown
    player.shooting = true
    soundEvents.playerShoot = true
    player.bulletsFired++
    // Pulse burst tracking
    if (player.weapon === 'pulse') {
      player.burstCount++
      if (player.burstCount >= 6) {
        player.burstCount = 0
        player.burstCooldown = 1.0  // 1 second forced pause
      }
    } else {
      player.burstCount = 0
    }
    player.bulletsRemaining = Math.max(0, player.bulletsRemaining - weaponCfg.ammoCost * ammoUseMult)
    const bulletAngle = player.aimAngle
    for (let i = 0; i < weaponCfg.count; i++) {
      const angle = bulletAngle + (i - (weaponCfg.count - 1) / 2) * weaponCfg.spread

      // Muzzle tip offsets in arm-local space (matches renderer gunX/muzzleX, gunY+2)
      const muzzleTipX: Record<string, number> = { blastop: 30, relav: 22, lerange: 38, hypershot: 29, spalmer: 26, plasma: 31, pulse: 26, charger: 28, homer: 38 }
      const tipLocal = muzzleTipX[player.weapon] ?? 30

      // Reconstruct world-space muzzle position matching the renderer transforms:
      // 1. shoulder offset from player center (shoulderX = hw-4, shoulderY = -hh+16)
      // 2. arm rotation by drawAngle (clamped aimAngle, flipped if facing left)
      // 3. muzzle tip at (tipLocal, 1.5) in arm-local space
      const hw = player.width / 2
      const hh = player.height / 2
      const f = player.facing
      const shoulderX = hw - 4
      const shoulderY = -hh + 16
      let drawAngle = player.aimAngle
      if (f === -1) {
        drawAngle = Math.PI - player.aimAngle
        if (drawAngle > Math.PI) drawAngle -= 2 * Math.PI
        if (drawAngle < -Math.PI) drawAngle += 2 * Math.PI
      }
      drawAngle = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, drawAngle))

      // Tip in arm space
      const tipArmX = tipLocal
      const tipArmY = 1.5

      // Rotate by drawAngle
      const rotX = tipArmX * Math.cos(drawAngle) - tipArmY * Math.sin(drawAngle)
      const rotY = tipArmX * Math.sin(drawAngle) + tipArmY * Math.cos(drawAngle)

      // Apply shoulder offset
      let localX = shoulderX + rotX
      const localY = shoulderY + rotY

      // Flip for facing
      if (f === -1) localX = -localX

      // World space - shoulder origin and muzzle tip
      const shoulderWorldX = player.x + player.width / 2 + (f === -1 ? -shoulderX : shoulderX)
      const shoulderWorldY = player.y + player.height / 2 + shoulderY
      const spawnX = player.x + player.width / 2 + localX
      const spawnY = player.y + player.height / 2 + localY

      // Check if the line from shoulder to muzzle intersects any platform
      let blockedByPlatform = false
      for (const plat of state.platforms) {
        const platY = plat.y + (plat.type === 'floating' ? Math.sin((Date.now() * 0.002) + (plat.floatOffset || 0)) * 6 : 0)
        // Line-segment vs AABB intersection test
        const x1 = shoulderWorldX, y1 = shoulderWorldY
        const x2 = spawnX, y2 = spawnY
        const left = plat.x, right = plat.x + plat.width
        const top = platY, bottom = platY + plat.height
        
        // Check if line segment intersects rectangle
        // Using parametric line clipping (Liang-Barsky style)
        let tMin = 0, tMax = 1
        const dx = x2 - x1, dy = y2 - y1
        const edges = [
          { p: -dx, q: x1 - left },   // left
          { p: dx, q: right - x1 },   // right
          { p: -dy, q: y1 - top },    // top
          { p: dy, q: bottom - y1 },  // bottom
        ]
        let intersects = true
        for (const { p, q } of edges) {
          if (p === 0) {
            if (q < 0) { intersects = false; break }
          } else {
            const t = q / p
            if (p < 0) { if (t > tMax) { intersects = false; break } else if (t > tMin) tMin = t }
            else { if (t < tMin) { intersects = false; break } else if (t < tMax) tMax = t }
          }
        }
        if (intersects && tMin <= tMax) {
          blockedByPlatform = true
          break
        }
      }
      // Also check ground collision - line crosses ground level
      if (spawnY > GROUND_Y || (shoulderWorldY < GROUND_Y && spawnY >= GROUND_Y)) {
        blockedByPlatform = true
      }

      if (!blockedByPlatform) {
        bullets.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * weaponCfg.speed,
          vy: Math.sin(angle) * weaponCfg.speed,
          radius: weaponCfg.radius,
          fromPlayer: true,
          active: true,
          damage: weaponCfg.damage,
          weaponType: player.weapon,
        })
      }
    }
  }

  // Invincibility
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt
  }

  // ─ Max Altitude / Low Oxygen ─
  if (player.y < MAX_ALTITUDE_Y) {
    player.lowOxygen = true
    player.health -= 8 * dt // drain ~8 HP per second
    if (player.health < 0) player.health = 0
  } else {
    player.lowOxygen = false
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
        if (distToPlayer < 1400) {
          enemy.vx = enemy.facing * 60
        } else {
          enemy.vx = 0
        }
        enemy.vy += GRAVITY * dt
        break

      case 'spitter':
        if (distToPlayer < 1400) {
          enemy.vx = enemy.facing * 30
        }
        enemy.vy += GRAVITY * dt
        enemy.shootCooldown -= dt
        if (enemy.shootCooldown <= 0 && distToPlayer < 1400) {
          enemy.shootCooldown = (2 + Math.random()) / enemyFireRateMult
          soundEvents.alienShoot = true
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
          bullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
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
        if (distToPlayer < 1400) {
          enemy.vx = enemy.facing * 100
        } else {
          enemy.vx *= 0.95
        }
        if (distToPlayer < 150 && enemy.y < player.y) {
          enemy.vy += 200 * dt
        }
        // Flyer shoots acid (same as spitter)
        enemy.shootCooldown -= dt
        if (enemy.shootCooldown <= 0 && distToPlayer < 1400) {
          enemy.shootCooldown = 2.0 / enemyFireRateMult
          soundEvents.alienShoot = true
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
          bullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: Math.cos(angle) * 216,
            vy: Math.sin(angle) * 216,
            radius: 5,
            fromPlayer: false,
            active: true,
            damage: 8,
          })
        }
        break

      case 'brute':
        if (distToPlayer < 1400) {
          enemy.vx = enemy.facing * 40
        } else {
          enemy.vx = 0
        }
        enemy.vy += GRAVITY * dt
        break

      case 'boss':
        if (distToPlayer < 1400) {
          enemy.vx = enemy.facing * 35
        }
        enemy.vy += GRAVITY * dt
        enemy.shootCooldown -= dt
        if (enemy.shootCooldown <= 0 && distToPlayer < 1400) {
          enemy.shootCooldown = (0.8 + Math.random() * 0.5) / enemyFireRateMult
          soundEvents.bossRoar = true
          for (let i = -1; i <= 1; i++) {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + i * 0.3
            bullets.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: Math.cos(angle) * 336,
              vy: Math.sin(angle) * 336,
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

    // HOMER homing: gently steer toward closest active enemy, capped at HOMER_TURN_RATE
    if (bullet.fromPlayer && bullet.weaponType === 'homer') {
      let closest: Enemy | null = null
      let closestDist = Infinity
      for (const e of enemies) {
        if (!e.active) continue
        const dx = (e.x + e.width / 2) - bullet.x
        const dy = (e.y + e.height / 2) - bullet.y
        const d = dx * dx + dy * dy
        if (d < closestDist) { closestDist = d; closest = e }
      }
      if (closest) {
        const tx = closest.x + closest.width / 2
        const ty = closest.y + closest.height / 2
        const desired = Math.atan2(ty - bullet.y, tx - bullet.x)
        const current = Math.atan2(bullet.vy, bullet.vx)
        let delta = desired - current
        while (delta > Math.PI) delta -= 2 * Math.PI
        while (delta < -Math.PI) delta += 2 * Math.PI
        const maxTurn = HOMER_TURN_RATE * dt
        const turn = Math.max(-maxTurn, Math.min(maxTurn, delta))
        const newAngle = current + turn
        const speed = Math.hypot(bullet.vx, bullet.vy)
        bullet.vx = Math.cos(newAngle) * speed
        bullet.vy = Math.sin(newAngle) * speed
      }
    }

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

          // Hit particle colors: plasma=purple, hypershot=red, otherwise match alien body color
          const alienColors: Record<EnemyType, string[]> = {
            grunt:   ['#3da34d', '#5cc06c', '#2a8a3a'],
            spitter: ['#4a9a7a', '#6abba0', '#387a5a'],
            flyer:   ['#5578bb', '#7799dd', '#3a5588'],
            brute:   ['#cc8844', '#eeaa66', '#aa6622'],
            boss:    ['#cc2233', '#ee4455', '#991122'],
          }
          const hitColors = bullet.weaponType === 'charger'
            ? ['#ff8800', '#ffaa33', '#cc6600', '#ffcc66']
            : bullet.weaponType === 'pulse'
            ? ['#3355ff', '#2244cc', '#5588ff', '#1a33aa']
            : bullet.weaponType === 'plasma'
            ? ['#aa66ff', '#8833dd', '#cc88ff', '#7722cc']
            : bullet.weaponType === 'hypershot'
            ? ['#ff2222', '#ff4444', '#dd0000', '#ff6644']
            : bullet.weaponType === 'homer'
            ? ['#ff5522', '#ff7733', '#cc3311', '#ffaa44']
            : alienColors[enemy.type] || ['#44ffaa']

          for (let i = 0; i < 5; i++) {
            particles.push(createParticle(bullet.x, bullet.y, hitColors[Math.floor(Math.random() * hitColors.length)]))
          }

          if (enemy.health <= 0) {
            enemy.active = false
            soundEvents.alienDeath = true
            soundEvents.explosion = true
            const scoreMap: Record<EnemyType, number> = { grunt: 100, spitter: 200, flyer: 250, brute: 500, boss: 2000 }
            player.score += scoreMap[enemy.type]

            // Death particles: plasma=purple, hypershot=red, otherwise alien body colors
            const deathColors = bullet.weaponType === 'charger'
              ? ['#ff8800', '#ffaa33', '#cc6600', '#ffcc66']
              : bullet.weaponType === 'pulse'
              ? ['#3355ff', '#2244cc', '#5588ff', '#1a33aa']
              : bullet.weaponType === 'plasma'
              ? ['#aa66ff', '#8833dd', '#cc88ff', '#7722cc']
              : bullet.weaponType === 'hypershot'
              ? ['#ff2222', '#ff4444', '#dd0000', '#ff6644']
              : bullet.weaponType === 'homer'
              ? ['#ff5522', '#ff7733', '#cc3311', '#ffaa44', '#ffffff']
              : [...(alienColors[enemy.type] || ['#44ffaa']), '#ffffff']
            for (let i = 0; i < 15; i++) {
              particles.push(createParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, deathColors[Math.floor(Math.random() * deathColors.length)]))
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
