// ─── Game Types ───

export interface Vector2 {
  x: number
  y: number
}

export type WeaponType = 'rifle' | 'shotgun' | 'plasma' | 'smg' | 'sniper' | 'launcher'

export interface Player {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  onGround: boolean
  health: number
  maxHealth: number
  jetpackFuel: number
  maxJetpackFuel: number
  facing: 1 | -1
  animFrame: number
  animTimer: number
  shooting: boolean
  shootCooldown: number
  invincibleTimer: number
  score: number
  aimAngle: number
  bulletsFired: number
  bulletsRemaining: number
  bulletsMax: number
  lowOxygen: boolean
  weapon: WeaponType
  weapons: WeaponType[]
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'normal' | 'metal' | 'floating'
  floatOffset?: number
  floatSpeed?: number
}

export type EnemyType = 'grunt' | 'spitter' | 'flyer' | 'brute' | 'boss'

export interface Enemy {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  type: EnemyType
  health: number
  maxHealth: number
  animFrame: number
  animTimer: number
  shootCooldown: number
  active: boolean
  facing: 1 | -1
  floatAngle?: number
}

export interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  fromPlayer: boolean
  active: boolean
  damage: number
  isRedAcid?: boolean
  weaponType?: WeaponType
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface Star {
  x: number
  y: number
  size: number
  speed: number
  brightness: number
}

export interface GameState {
  player: Player
  platforms: Platform[]
  enemies: Enemy[]
  bullets: Bullet[]
  particles: Particle[]
  stars: Star[]
  cameraX: number
  cameraY: number
  levelLength: number
  gameOver: boolean
  gameWon: boolean
  started: boolean
  paused: boolean
  level: number
  backgroundLayers: BackgroundLayer[]
}

export interface BackgroundLayer {
  color: string
  speed: number
  elements: { x: number; y: number; size: number; type: string }[]
}

export interface Keys {
  left: boolean
  right: boolean
  up: boolean
  jump: boolean
  shoot: boolean
  jetpack: boolean
  mouseX: number
  mouseY: number
  switchWeapon: WeaponType | null
}

export interface SoundEvents {
  playerShoot: boolean
  playerJump: boolean
  playerHit: boolean
  alienHit: boolean
  alienDeath: boolean
  alienShoot: boolean
  bossRoar: boolean
  explosion: boolean
}
