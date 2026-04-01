'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { GameState, Keys, WeaponType } from '@/lib/game-types'
import { generateLevel, generateStars, createPlayer, updateGame, GROUND_Y } from '@/lib/game-engine'
import {
  initAudio,
  playLaserSound,
  playJumpSound,
  playPlayerHitSound,
  playAlienHitSound,
  playAlienDeathSound,
  playAlienShootSound,
  playBossRoarSound,
  playExplosionSound,
  startJetpackSound,
  stopJetpackSound,
} from '@/lib/game-sounds'
import {
  drawBackground,
  drawStars,
  drawParallaxMountains,
  drawGround,
  drawPlatform,
  drawPlayer,
  drawPlayerZoomed,
  drawEnemy,
  drawBullet,
  drawParticle,
  drawHUD,
  drawJetpackFlame,
} from '@/lib/game-renderer'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const keysRef = useRef<Keys>({
    left: false,
    right: false,
    up: false,
    jump: false,
    shoot: false,
    jetpack: false,
    mouseX: 0,
    mouseY: 0,
    switchWeapon: null,
  })
  const lastTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)
  const jetpackPlayingRef = useRef<boolean>(false)
  const [screen, setScreen] = useState<'home' | 'shop' | 'gear' | 'title' | 'playing' | 'dead' | 'won'>('home')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [equippedWeapon, setEquippedWeapon] = useState<WeaponType>('blastop')
  const [starCurrency, setStarCurrency] = useState(100000)
  const [ownedWeapons, setOwnedWeapons] = useState<WeaponType[]>(['blastop'])
  const ownedWeaponsRef = useRef<WeaponType[]>(['blastop'])
  const [crateResult, setCrateResult] = useState<{ weapon: WeaponType; isDuplicate: boolean; refund: number } | null>(null)

  // Keep ref in sync with state
  useEffect(() => { ownedWeaponsRef.current = ownedWeapons }, [ownedWeapons])

  // Weapon loot tables per crate tier
  const crateLootTables: Record<string, WeaponType[]> = {
    pulsar: ['relav', 'spalmer'],
    nova: ['spalmer', 'plasma'],
    stellar: ['lerange', 'plasma', 'hypershot'],
  }

  const crateColors: Record<string, string> = {
    relav: '#44ddff', spalmer: '#ff8844', lerange: '#ff4488', plasma: '#aa66ff', hypershot: '#ff2222', blastop: '#ffcc22',
  }

  const openCrate = (tier: 'pulsar' | 'nova' | 'stellar', cost: number) => {
    if (starCurrency < cost) return
    setStarCurrency(prev => prev - cost)
    const table = crateLootTables[tier]
    const weapon = table[Math.floor(Math.random() * table.length)]
    const isDuplicate = ownedWeapons.includes(weapon)
    if (!isDuplicate) {
      setOwnedWeapons(prev => [...prev, weapon])
    } else {
      // Refund 50% of crate cost for duplicates
      const refund = Math.floor(cost * 0.5)
      setStarCurrency(prev => prev + refund)
    }
    setCrateResult({ weapon, isDuplicate, refund: isDuplicate ? Math.floor(cost * 0.5) : 0 })
  }

  const initGame = useCallback((lvl: number, diff: 'easy' | 'medium' | 'hard' = 'easy') => {
    const canvas = canvasRef.current
    if (!canvas) return

    const diffMultiplier = diff === 'easy' ? 1.0 : diff === 'medium' ? 1.3 : 1.65
    const startingAmmo = diff === 'easy' ? 200 : diff === 'medium' ? 250 : 300
    const { platforms, enemies, levelLength } = generateLevel(lvl, diffMultiplier)
    const stars = generateStars(200, canvas.width, canvas.height)

    const player = createPlayer()
    const healthMultiplier = diff === 'easy' ? 1.0 : diff === 'medium' ? 0.75 : 0.5
    player.health = Math.round(player.health * healthMultiplier)
    player.maxHealth = Math.round(player.maxHealth * healthMultiplier)
    player.bulletsRemaining = startingAmmo
    player.bulletsMax = startingAmmo
    player.weapons = [...ownedWeapons]
    player.weapon = equippedWeapon

    stateRef.current = {
      player,
      platforms,
      enemies,
      bullets: [],
      particles: [],
      stars,
      cameraX: 0,
      cameraY: 0,
      levelLength,
      gameOver: false,
      gameWon: false,
      started: true,
      paused: false,
      level: lvl,
      backgroundLayers: [],
    }

    setScreen('playing')
    lastTimeRef.current = performance.now()
  }, [ownedWeapons, equippedWeapon])

  // ─── Game Loop ───
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const state = stateRef.current

    if (!canvas || !ctx || !state) {
      animFrameRef.current = requestAnimationFrame(gameLoop)
      return
    }

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = timestamp

    // Update
    const newState = updateGame(state, keysRef.current, dt, canvas.width, canvas.height)
    stateRef.current = newState

    // Play sounds based on events
    if (newState.soundEvents) {
      if (newState.soundEvents.playerShoot) playLaserSound()
      if (newState.soundEvents.playerJump) playJumpSound()
      if (newState.soundEvents.playerHit) playPlayerHitSound()
      if (newState.soundEvents.alienHit) playAlienHitSound()
      if (newState.soundEvents.alienDeath) playAlienDeathSound()
      if (newState.soundEvents.alienShoot) playAlienShootSound()
      if (newState.soundEvents.bossRoar) playBossRoarSound()
      if (newState.soundEvents.explosion) playExplosionSound()
    }

    // Handle jetpack sound (continuous)
    const jetpackActive = keysRef.current.jetpack && newState.player.jetpackFuel > 0
    if (jetpackActive && !jetpackPlayingRef.current) {
      startJetpackSound()
      jetpackPlayingRef.current = true
    } else if (!jetpackActive && jetpackPlayingRef.current) {
      stopJetpackSound()
      jetpackPlayingRef.current = false
    }

    // Check game state transitions
    if (newState.gameOver && screen === 'playing') {
      setScore(newState.player.score)
      setScreen('dead')
      stopJetpackSound()
      jetpackPlayingRef.current = false
    }
    if (newState.gameWon && screen === 'playing') {
      setScore(newState.player.score)
      // Award stars based on difficulty
      const starReward = difficulty === 'easy' ? 25 : difficulty === 'medium' ? 50 : 75
      setStarCurrency(prev => prev + starReward)
      setScreen('won')
      stopJetpackSound()
      jetpackPlayingRef.current = false
    }

    // ─── Render ───
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    drawBackground(ctx, newState, canvas.width, canvas.height)
    drawStars(ctx, newState.stars, newState.cameraX)
    drawParallaxMountains(ctx, newState.cameraX, canvas.width, canvas.height)

    // Continuous ground
    drawGround(ctx, newState.cameraX, newState.cameraY, canvas.width, canvas.height, GROUND_Y)

    // Platforms
    for (const plat of newState.platforms) {
      if (plat.x - newState.cameraX > canvas.width + 50 || plat.x + plat.width - newState.cameraX < -50) continue
      drawPlatform(ctx, plat, newState.cameraX, newState.cameraY)
    }

    // Enemies
    for (const enemy of newState.enemies) {
      if (!enemy.active) continue
      if (enemy.x - newState.cameraX > canvas.width + 50 || enemy.x + enemy.width - newState.cameraX < -50) continue
      drawEnemy(ctx, enemy, newState.cameraX, newState.cameraY)
    }

    // Bullets
    for (const bullet of newState.bullets) {
      if (!bullet.active) continue
      drawBullet(ctx, bullet, newState.cameraX, newState.cameraY)
    }

    // Player
    if (keysRef.current.jetpack && newState.player.jetpackFuel > 0) {
      drawJetpackFlame(ctx, newState.player, newState.cameraX, newState.cameraY)
    }
    drawPlayer(ctx, newState.player, newState.cameraX, newState.cameraY, newState.platforms, GROUND_Y)

    // Particles
    for (const particle of newState.particles) {
      drawParticle(ctx, particle, newState.cameraX, newState.cameraY)
    }

    // HUD
    drawHUD(ctx, newState.player, canvas.width, canvas.height)

    // Progress bar at bottom
    const progress = Math.max(0, Math.min(1, newState.player.x / newState.levelLength))
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(10, canvas.height - 16, canvas.width - 20, 8)
    const progGrad = ctx.createLinearGradient(10, 0, 10 + (canvas.width - 20) * progress, 0)
    progGrad.addColorStop(0, '#2a7a2a')
    progGrad.addColorStop(1, '#44cc44')
    ctx.fillStyle = progGrad
    ctx.fillRect(10, canvas.height - 16, (canvas.width - 20) * progress, 8)
    // Boss icon at end
    ctx.fillStyle = '#ff3344'
    ctx.font = 'bold 10px Geist, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('BOSS', canvas.width - 30, canvas.height - 8)

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [screen])

  // ─── Input Handling ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = keysRef.current
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': keys.left = true; break
        case 'ArrowRight': case 'KeyD': keys.right = true; break
        case 'ArrowUp': case 'KeyW': case 'Space':
          e.preventDefault()
          keys.jump = true
          break
        case 'ShiftLeft': case 'ShiftRight':
          e.preventDefault()
          keys.jetpack = true
          break
        case 'KeyJ': keys.shoot = true; break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = keysRef.current
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': keys.left = false; break
        case 'ArrowRight': case 'KeyD': keys.right = false; break
        case 'ArrowUp': case 'KeyW': case 'Space': keys.jump = false; break
        case 'ShiftLeft': case 'ShiftRight': keys.jetpack = false; break
        case 'KeyJ': keys.shoot = false; break
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) keysRef.current.shoot = true
    }
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) keysRef.current.shoot = false
    }
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      keysRef.current.mouseX = e.clientX - rect.left
      keysRef.current.mouseY = e.clientY - rect.top
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // ─── Start Game Loop ───
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameLoop])

  // ─── Canvas Resize ───
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.min(1200, window.innerWidth)
      canvas.height = Math.min(650, window.innerHeight - 20)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-background overflow-hidden">
      <canvas
        ref={canvasRef}
        className="border border-border rounded-lg shadow-2xl"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Home Screen */}
      {screen === 'home' && (
        <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#2a2a4a]">
          {/* Star currency display - top right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#ffdd44', fontSize: '24px' }}>&#9733;</span>
            <span className="text-xl font-bold font-sans" style={{ color: '#ffdd44' }}>{starCurrency}</span>
          </div>

          {/* Stars in the night sky - using seeded positions to avoid hydration mismatch */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(80)].map((_, i) => {
              const seed = i * 137.5
              const size = (i % 5 === 0) ? '3px' : (i % 3 === 0) ? '2px' : '1px'
              const left = ((seed * 7) % 100)
              const top = ((seed * 3) % 70)
              const opacity = 0.4 + ((seed * 11) % 60) / 100
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: size,
                    height: size,
                    left: `${left}%`,
                    top: `${top}%`,
                    opacity,
                  }}
                />
              )
            })}
          </div>

          {/* Title at top */}
          <div className="pt-12 pb-4 flex justify-center z-10">
            <h1
              className="text-7xl font-black tracking-wider font-sans uppercase"
              style={{
                color: '#8a2be2',
                textShadow: '0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.6), 0 0 30px rgba(100,20,180,0.5), 0 4px 8px rgba(0,0,0,0.6)',
                letterSpacing: '0.1em',
                WebkitTextStroke: '2px #5a1a9a',
              }}
            >
              STELLAR RECON
            </h1>
          </div>

          {/* Sky area - spacer */}
          <div className="flex-1" />

          {/* Ground section - shorter height for lower ground */}
          <div className="relative w-full" style={{ height: '200px' }}>
            {/* Character positioned on grass - feet on grass top */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ bottom: '140px' }}>
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = 500
                      el.height = 200
                      ctx.clearRect(0, 0, 500, 200)
                      drawPlayerZoomed(ctx, 200, 100, 3.5, equippedWeapon)
                    }
                  }
                }}
                key={equippedWeapon}
                width={500}
                height={200}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Full-width grass and dirt ground */}
            <canvas
              ref={(el) => {
                if (el) {
                  const ctx = el.getContext('2d')
                  if (ctx) {
                    el.width = window.innerWidth
                    el.height = 200
                    ctx.clearRect(0, 0, el.width, 200)
                    
                    const grassY = 20
                    
                    // Dirt layer (fills to bottom)
                    ctx.fillStyle = '#3a2820'
                    ctx.fillRect(0, grassY + 28, el.width, 160)
                    
                    // Dirt texture - rocks
                    ctx.fillStyle = '#2a1a15'
                    for (let i = 0; i < el.width; i += 15) {
                      ctx.fillRect(i + Math.random() * 8, grassY + 40 + Math.random() * 80, 5, 4)
                    }
                    ctx.fillStyle = '#4a3525'
                    for (let i = 5; i < el.width; i += 20) {
                      ctx.fillRect(i + Math.random() * 10, grassY + 50 + Math.random() * 80, 4, 3)
                    }
                    
                    // Grass base - darker for night
                    ctx.fillStyle = '#2a6a2a'
                    ctx.fillRect(0, grassY, el.width, 32)
                    
                    // Grass top highlight
                    ctx.fillStyle = '#3a7a3a'
                    ctx.fillRect(0, grassY, el.width, 8)
                    
                    // Grass blades - tall
                    ctx.fillStyle = '#2a5a2a'
                    for (let i = 0; i < el.width; i += 4) {
                      const h = 10 + Math.random() * 14
                      ctx.fillRect(i, grassY - h + 8, 3, h)
                    }
                    // Grass blades - medium
                    ctx.fillStyle = '#3a6a3a'
                    for (let i = 2; i < el.width; i += 6) {
                      const h = 8 + Math.random() * 10
                      ctx.fillRect(i, grassY - h + 8, 2, h)
                    }
                    // Grass blades - highlights
                    ctx.fillStyle = '#4a7a4a'
                    for (let i = 3; i < el.width; i += 9) {
                      const h = 6 + Math.random() * 8
                      ctx.fillRect(i, grassY - h + 8, 2, h)
                    }
                  }
                }
              }}
              width={1200}
              height={200}
              className="w-full h-full"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Buttons in the dirt */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20 flex gap-4 items-center" style={{ bottom: '30px' }}>
              {/* Gear settings button */}
              <button
                onClick={() => setScreen('gear')}
                className="px-12 py-5 text-2xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ff8800, #ffaa22)',
                  color: '#0a0a0a',
                  boxShadow: '0 4px 20px rgba(255,136,0,0.5), 0 0 40px rgba(255,136,0,0.3)',
                }}
              >
                GEAR
              </button>

              {/* Play button */}
              <button
                onClick={() => setScreen('title')}
                className="px-16 py-5 text-2xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                  color: '#0a1a0a',
                  boxShadow: '0 4px 20px rgba(68,221,100,0.5), 0 0 40px rgba(68,221,100,0.3)',
                }}
              >
                PLAY
              </button>

              {/* Shop button */}
              <button
                onClick={() => setScreen('shop')}
                className="px-12 py-5 text-2xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #aa2222, #dd4444)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(221,68,68,0.5), 0 0 40px rgba(221,68,68,0.3)',
                }}
              >
                SHOP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Screen */}
      {screen === 'gear' && (
        <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#2a2a4a]">
          {/* Stars background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(60)].map((_, i) => {
              const seed = (i + 200) * 137.5
              const size = (i % 4 === 0) ? '2px' : '1px'
              const left = ((seed * 7) % 100)
              const top = ((seed * 3) % 100)
              const opacity = 0.3 + ((seed * 11) % 50) / 100
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{ width: size, height: size, left: `${left}%`, top: `${top}%`, opacity }}
                />
              )
            })}
          </div>

          {/* Star currency display - top right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#ffdd44', fontSize: '24px' }}>&#9733;</span>
            <span className="text-xl font-bold font-sans" style={{ color: '#ffdd44' }}>{starCurrency}</span>
          </div>

          {/* Title at top */}
          <div className="pt-8 z-10 text-center">
            <h1
              className="text-5xl font-black tracking-wider font-sans uppercase"
              style={{
                color: '#ff8800',
                textShadow: '0 0 10px rgba(255,136,0,0.8), 0 0 20px rgba(255,136,0,0.5), 0 4px 8px rgba(0,0,0,0.6)',
              }}
            >
              GEAR
            </h1>
          </div>

          {/* Gear options */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="flex gap-6">
              {/* Jetpack column */}
              <div className="relative flex flex-col items-center gap-3">
                <button
                  onClick={() => {/* Jetpack handler */}}
                  className="w-[229px] py-[35px] text-xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #aa2222, #dd4444)',
                    color: '#ffffff',
                    boxShadow: '0 4px 20px rgba(221,68,68,0.5), 0 0 40px rgba(221,68,68,0.3)',
                  }}
                >
                  JETPACK
                </button>
                {/* Connecting lines */}
                <svg className="absolute pointer-events-none" style={{ top: '85px', left: 0, width: '100%', height: '70px', overflow: 'visible' }}>
                  <line x1="50%" y1="0" x2="25%" y2="100%" stroke="rgba(221,68,68,0.25)" strokeWidth="2" />
                  <line x1="50%" y1="0" x2="75%" y2="100%" stroke="rgba(221,68,68,0.25)" strokeWidth="2" />
                </svg>
                <div className="flex gap-6 mt-24">
                  <button
                    onClick={() => {}}
                    className="w-[109px] py-[18px] text-xs font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer -ml-3"
                    style={{
                      background: 'linear-gradient(135deg, #aa2222, #dd4444)',
                      color: '#ffffff',
                      boxShadow: '0 2px 10px rgba(221,68,68,0.4)',
                    }}
                  >
                    <span className="flex flex-col items-center leading-tight"><span>POWER</span><span className="text-[9px] font-normal opacity-80">Level: 0</span></span>
                  </button>
                  <button
                    onClick={() => {}}
                    className="w-[109px] py-[18px] text-xs font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer -mr-3"
                    style={{
                      background: 'linear-gradient(135deg, #aa2222, #dd4444)',
                      color: '#ffffff',
                      boxShadow: '0 2px 10px rgba(221,68,68,0.4)',
                    }}
                  >
                    <span className="flex flex-col items-center leading-tight"><span>FUEL</span><span className="text-[9px] font-normal opacity-80">Level: 0</span></span>
                  </button>
                </div>
              </div>

              {/* Ammo column */}
              <div className="relative flex flex-col items-center gap-3">
                <button
                  onClick={() => {/* Ammo handler */}}
                  className="w-[229px] py-[35px] text-xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #dddd22, #ffff44)',
                    color: '#0a0a0a',
                    boxShadow: '0 4px 20px rgba(255,255,68,0.5), 0 0 40px rgba(255,255,68,0.3)',
                  }}
                >
                  AMMO
                </button>
                {/* Connecting lines */}
                <svg className="absolute pointer-events-none" style={{ top: '85px', left: 0, width: '100%', height: '70px', overflow: 'visible' }}>
                  <line x1="50%" y1="0" x2="25%" y2="100%" stroke="rgba(255,255,68,0.25)" strokeWidth="2" />
                  <line x1="50%" y1="0" x2="75%" y2="100%" stroke="rgba(255,255,68,0.25)" strokeWidth="2" />
                </svg>
                <div className="flex gap-6 mt-24">
                  <button
                    onClick={() => {}}
                    className="w-[109px] py-[18px] text-xs font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap -ml-3"
                    style={{
                      background: 'linear-gradient(135deg, #dddd22, #ffff44)',
                      color: '#0a0a0a',
                      boxShadow: '0 2px 10px rgba(255,255,68,0.4)',
                    }}
                  >
                    <span className="flex flex-col items-center leading-tight"><span>STARTING AMMO</span><span className="text-[9px] font-normal opacity-80">Level: 0</span></span>
                  </button>
                  <button
                    onClick={() => {}}
                    className="w-[109px] py-[18px] text-xs font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap -mr-3"
                    style={{
                      background: 'linear-gradient(135deg, #dddd22, #ffff44)',
                      color: '#0a0a0a',
                      boxShadow: '0 2px 10px rgba(255,255,68,0.4)',
                    }}
                  >
                    <span className="flex flex-col items-center leading-tight"><span>AMMO USE</span><span className="text-[9px] font-normal opacity-80">Level: 0</span></span>
                  </button>
                </div>
              </div>

              {/* Armor column */}
              <div className="relative flex flex-col items-center gap-3">
                <button
                  onClick={() => {/* Armor handler */}}
                  className="w-[229px] py-[35px] text-xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                    color: '#0a1a0a',
                    boxShadow: '0 4px 20px rgba(68,221,100,0.5), 0 0 40px rgba(68,221,100,0.3)',
                  }}
                >
                  ARMOR
                </button>
                {/* Connecting lines */}
                <svg className="absolute pointer-events-none" style={{ top: '85px', left: 0, width: '100%', height: '70px', overflow: 'visible' }}>
                  <line x1="50%" y1="0" x2="25%" y2="100%" stroke="rgba(68,221,100,0.25)" strokeWidth="2" />
                  <line x1="50%" y1="0" x2="75%" y2="100%" stroke="rgba(68,221,100,0.25)" strokeWidth="2" />
                </svg>
                <div className="flex gap-6 mt-24">
                  <button
                    onClick={() => {}}
                    className="w-[109px] py-[18px] text-xs font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap -ml-3"
                    style={{
                      background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                      color: '#0a1a0a',
                      boxShadow: '0 2px 10px rgba(68,221,100,0.4)',
                    }}
                  >
                    <span className="flex flex-col items-center leading-tight"><span>DURABILITY</span><span className="text-[9px] font-normal opacity-80">Level: 0</span></span>
                  </button>
                  <button
                    onClick={() => {}}
                    className="w-[109px] py-[18px] text-xs font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer -mr-3"
                    style={{
                      background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                      color: '#0a1a0a',
                      boxShadow: '0 2px 10px rgba(68,221,100,0.4)',
                    }}
                  >
                    <span className="flex flex-col items-center leading-tight"><span>WEIGHT</span><span className="text-[9px] font-normal opacity-80">Level: 0</span></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Back button at bottom */}
          <div className="flex justify-center pb-8 z-10">
            <button
              onClick={() => setScreen('home')}
              className="px-[70px] py-[22px] text-xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              BACK
            </button>
          </div>
        </div>
      )}

      {screen === 'shop' && (
        <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#2a2a4a]">
          {/* Stars background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(60)].map((_, i) => {
              const seed = (i + 100) * 137.5
              const size = (i % 4 === 0) ? '2px' : '1px'
              const left = ((seed * 7) % 100)
              const top = ((seed * 3) % 100)
              const opacity = 0.3 + ((seed * 11) % 50) / 100
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: size,
                    height: size,
                    left: `${left}%`,
                    top: `${top}%`,
                    opacity,
                  }}
                />
              )
            })}
          </div>

          {/* Star currency display - top right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <span style={{ color: '#ffdd44', fontSize: '24px' }}>&#9733;</span>
            <span className="text-xl font-bold font-sans" style={{ color: '#ffdd44' }}>{starCurrency}</span>
          </div>

          {/* Header */}
          <div className="pt-8 pb-2 flex justify-center z-10">
            <h1
              className="text-5xl font-black tracking-wider font-sans uppercase"
              style={{
                color: '#dd4444',
                textShadow: '0 0 10px rgba(221,68,68,0.8), 0 0 20px rgba(221,68,68,0.5), 0 4px 8px rgba(0,0,0,0.6)',
              }}
            >
              SHOP
            </h1>
          </div>

          {/* Owned weapons display */}
          <div className="flex justify-center z-10 pb-2">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <span className="text-xs font-sans" style={{ color: 'rgba(255,255,255,0.6)' }}>OWNED:</span>
              {ownedWeapons.map(w => (
                <span key={w} className="text-xs font-bold font-sans px-2 py-1 rounded" style={{ color: crateColors[w], background: 'rgba(255,255,255,0.08)' }}>
                  {w.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Crate result popup */}
          {crateResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
              <div className="text-center space-y-6 p-8 rounded-2xl" style={{ background: 'rgba(20,20,40,0.95)', border: `2px solid ${crateColors[crateResult.weapon]}`, boxShadow: `0 0 40px ${crateColors[crateResult.weapon]}40, 0 0 80px ${crateColors[crateResult.weapon]}20` }}>
                <h2
                  className="text-4xl font-black font-sans uppercase"
                  style={{ color: crateColors[crateResult.weapon], textShadow: `0 0 20px ${crateColors[crateResult.weapon]}80` }}
                >
                  {crateResult.isDuplicate ? 'DUPLICATE' : 'NEW WEAPON!'}
                </h2>
                <div className="text-6xl font-black font-sans uppercase" style={{ color: crateColors[crateResult.weapon], textShadow: `0 0 30px ${crateColors[crateResult.weapon]}` }}>
                  {crateResult.weapon.toUpperCase()}
                </div>
                {crateResult.isDuplicate && (
                  <div className="space-y-2">
                    <p className="text-lg font-sans" style={{ color: 'rgba(255,255,255,0.6)' }}>You already own this weapon</p>
                    <p className="text-xl font-bold font-sans" style={{ color: '#ffdd44' }}>+{crateResult.refund} refund</p>
                  </div>
                )}
                <button
                  onClick={() => setCrateResult(null)}
                  className="px-10 py-3 text-lg font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${crateColors[crateResult.weapon]}88, ${crateColors[crateResult.weapon]})`,
                    color: '#ffffff',
                    boxShadow: `0 4px 20px ${crateColors[crateResult.weapon]}60`,
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Crates */}
          <div className="flex-1 flex items-center justify-center gap-8 z-10 px-8">
            {/* Pulsar Crate - Green */}
            {([
              { tier: 'pulsar' as const, cost: 100, color: '#44aa44', colorLight: '#44dd44', bgFrom: '#1a4a1a', bgMid: '#2a6a2a', plankLight: '#4a6a3a', plankMid: '#3a5a2a', plankDark: '#2a4a1a', border: '#1a3a0a', beamLight: '#3a5a2a', nailColor: '#666', filterGlow: 'rgba(68,255,68,0.4)', label: 'PULSAR', weapons: ['RELAV', 'SPALMER'] },
              { tier: 'nova' as const, cost: 300, color: '#dd8844', colorLight: '#ffaa44', bgFrom: '#4a2a0a', bgMid: '#6a3a1a', plankLight: '#7a5a3a', plankMid: '#6a4a2a', plankDark: '#5a3a1a', border: '#3a2a0a', beamLight: '#6a4a2a', nailColor: '#777', filterGlow: 'rgba(255,170,68,0.4)', label: 'NOVA', weapons: ['SPALMER', 'PLASMA'] },
              { tier: 'stellar' as const, cost: 750, color: '#aa66dd', colorLight: '#bb88ff', bgFrom: '#2a1a4a', bgMid: '#3a2a6a', plankLight: '#5a4a6a', plankMid: '#4a3a5a', plankDark: '#3a2a4a', border: '#2a1a3a', beamLight: '#4a3a5a', nailColor: '#888', filterGlow: 'rgba(170,102,255,0.4)', label: 'STELLAR', weapons: ['LERANGE', 'PLASMA', 'HYPERSHOT'] },
            ]).map(crate => {
              const canAfford = starCurrency >= crate.cost
              return (
                <div key={crate.tier} className="flex flex-col items-center gap-3">
                  <div
                    onClick={() => canAfford && openCrate(crate.tier, crate.cost)}
                    className="w-44 h-44 rounded-lg flex items-center justify-center transition-all active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${crate.bgFrom}, ${crate.bgMid}, ${crate.bgFrom})`,
                      border: `4px solid ${canAfford ? crate.color : '#555'}`,
                      boxShadow: canAfford ? `0 0 20px ${crate.color}80, inset 0 0 30px ${crate.color}4d` : 'none',
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      opacity: canAfford ? 1 : 0.5,
                      transform: canAfford ? undefined : 'none',
                    }}
                  >
                    <div className="w-28 h-28 relative" style={{ filter: canAfford ? `drop-shadow(0 0 8px ${crate.filterGlow})` : 'none' }}>
                      <div className="absolute inset-0 rounded" style={{ background: `linear-gradient(180deg, ${crate.plankMid} 0%, ${crate.plankDark} 100%)`, border: `3px solid ${crate.border}` }}>
                        <div className="absolute top-2 left-0 right-0 h-5" style={{ background: `linear-gradient(180deg, ${crate.plankLight} 0%, ${crate.plankMid} 50%, ${crate.plankDark} 100%)`, borderBottom: `2px solid ${crate.border}` }} />
                        <div className="absolute top-9 left-0 right-0 h-5" style={{ background: `linear-gradient(180deg, ${crate.plankLight} 0%, ${crate.plankMid} 50%, ${crate.plankDark} 100%)`, borderBottom: `2px solid ${crate.border}` }} />
                        <div className="absolute top-16 left-0 right-0 h-5" style={{ background: `linear-gradient(180deg, ${crate.plankLight} 0%, ${crate.plankMid} 50%, ${crate.plankDark} 100%)`, borderBottom: `2px solid ${crate.border}` }} />
                        <div className="absolute top-0 bottom-0 left-2 w-2" style={{ background: `linear-gradient(90deg, ${crate.plankDark}, ${crate.beamLight}, ${crate.plankDark})`, borderLeft: `1px solid ${crate.border}`, borderRight: `1px solid ${crate.border}` }} />
                        <div className="absolute top-0 bottom-0 right-2 w-2" style={{ background: `linear-gradient(90deg, ${crate.plankDark}, ${crate.beamLight}, ${crate.plankDark})`, borderLeft: `1px solid ${crate.border}`, borderRight: `1px solid ${crate.border}` }} />
                        <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full" style={{ background: crate.nailColor }} />
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: crate.nailColor }} />
                        <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full" style={{ background: crate.nailColor }} />
                        <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: crate.nailColor }} />
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-xl font-bold font-sans"
                    style={{ color: crate.colorLight, textShadow: `0 0 10px ${crate.colorLight}80` }}
                  >
                    {crate.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span style={{ color: canAfford ? '#ffdd44' : '#888', fontSize: '18px' }}>&#9733;</span>
                    <span className="text-lg font-bold font-sans" style={{ color: canAfford ? '#ffdd44' : '#888' }}>{crate.cost}</span>
                  </div>
                  <div className="text-xs font-sans text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {crate.weapons.join(' / ')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Back button */}
          <div className="pb-8 flex justify-center z-10">
            <button
              onClick={() => { setCrateResult(null); setScreen('home') }}
              className="px-12 py-4 text-xl font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #444, #666)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              BACK
            </button>
          </div>
        </div>
      )}

      {/* Title Screen / Difficulty Selection */}
      {screen === 'title' && (
        <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#2a2a4a]">
          {/* Stars background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(60)].map((_, i) => {
              const seed = (i + 200) * 137.5
              const size = (i % 5 === 0) ? '3px' : (i % 3 === 0) ? '2px' : '1px'
              const left = ((seed * 7) % 100)
              const top = ((seed * 3) % 80)
              const opacity = 0.3 + ((seed * 11) % 50) / 100
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: size,
                    height: size,
                    left: `${left}%`,
                    top: `${top}%`,
                    opacity,
                  }}
                />
              )
            })}
          </div>

          <div className="flex-1 flex items-center justify-center z-10 py-4">
            <div className="text-center space-y-4">
              <div className="relative">
                <h1
                  className="text-6xl font-black tracking-wider font-sans uppercase"
                  style={{
                    color: '#8a2be2',
                    textShadow: '0 0 10px rgba(138,43,226,0.8), 0 0 20px rgba(138,43,226,0.6), 0 0 30px rgba(100,20,180,0.5), 0 4px 8px rgba(0,0,0,0.6)',
                    letterSpacing: '0.1em',
                    WebkitTextStroke: '2px #5a1a9a',
                  }}
                >
                  STELLAR RECON
                </h1>
                <p
                  className="text-base font-sans mt-1 font-semibold"
                  style={{ color: '#9a6acc', textShadow: '0 0 10px rgba(154,106,204,0.5)' }}
                >
                  Jetpack Assault
                </p>
              </div>

              {/* Weapon selector */}
              <div className="space-y-2">
                <p className="text-sm font-bold font-sans uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.8)' }}>Select Weapon</p>
                <div className="flex justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg flex-wrap" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    {ownedWeapons.map(w => (
                      <button
                        key={w}
                        onClick={() => setEquippedWeapon(w)}
                        className="text-xs font-bold font-sans px-3 py-1.5 rounded transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                          color: crateColors[w],
                          background: equippedWeapon === w ? `${crateColors[w]}33` : 'rgba(255,255,255,0.08)',
                          border: equippedWeapon === w ? `1px solid ${crateColors[w]}` : '1px solid transparent',
                          boxShadow: equippedWeapon === w ? `0 0 10px ${crateColors[w]}66` : 'none',
                        }}
                      >
                        {w.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold font-sans uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.8)' }}>Select Difficulty</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => { initAudio(); setLevel(1); setDifficulty('easy'); initGame(1, 'easy') }}
                    className="px-8 py-3 text-lg font-bold font-sans rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                      color: '#0a1a0a',
                      boxShadow: '0 4px 20px rgba(68,221,100,0.5), 0 0 40px rgba(68,221,100,0.3)',
                    }}
                  >
                    EASY
                  </button>
                  <button
                    onClick={() => { initAudio(); setLevel(1); setDifficulty('medium'); initGame(1, 'medium') }}
                    className="px-8 py-3 text-lg font-bold font-sans rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #cc8822, #ffaa44)',
                      color: '#1a1a0a',
                      boxShadow: '0 4px 20px rgba(255,170,68,0.5), 0 0 40px rgba(255,170,68,0.3)',
                    }}
                  >
                    MEDIUM
                  </button>
                  <button
                    onClick={() => { initAudio(); setLevel(1); setDifficulty('hard'); initGame(1, 'hard') }}
                    className="px-8 py-3 text-lg font-bold font-sans rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #aa2222, #dd4444)',
                      color: '#ffffff',
                      boxShadow: '0 4px 20px rgba(221,68,68,0.5), 0 0 40px rgba(221,68,68,0.3)',
                    }}
                  >
                    HARD
                  </button>
                </div>
              </div>

              <div
                className="text-sm font-sans space-y-1 p-3 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p><span style={{ color: '#66cc66' }}>A/D</span> {'Move  |  '}<span style={{ color: '#66cc66' }}>W/Space</span> {'Jump  |  '}<span style={{ color: '#66cc66' }}>Shift</span> Jetpack</p>
                <p><span style={{ color: '#66cc66' }}>Mouse</span> {'Aim  |  '}<span style={{ color: '#66cc66' }}>Click</span> Shoot</p>
              </div>

              <button
                onClick={() => setScreen('home')}
                className="px-8 py-3 text-lg font-bold font-sans rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                BACK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Death Screen */}
      {screen === 'dead' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-center space-y-6">
            <h2
              className="text-5xl font-bold font-sans"
              style={{ color: '#ff4444', textShadow: '0 0 20px rgba(255,68,68,0.5)' }}
            >
              MISSION FAILED
            </h2>
            <p className="text-2xl font-sans" style={{ color: '#ffffff' }}>
              Score: {score}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { initAudio(); initGame(level, difficulty) }}
                className="px-8 py-3 text-lg font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #cc2233, #ff4455)',
                  color: '#ffffff',
                  boxShadow: '0 0 20px rgba(255,68,68,0.4)',
                }}
              >
                RETRY
              </button>
              <button
                onClick={() => { setScreen('home'); stateRef.current = null }}
                className="px-8 py-3 text-lg font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                HOME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {screen === 'won' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-center space-y-6">
            <h2
              className="text-5xl font-bold font-sans"
              style={{ color: '#44ff88', textShadow: '0 0 20px rgba(68,255,136,0.5)' }}
            >
              MISSION COMPLETE
            </h2>
            <p className="text-2xl font-sans" style={{ color: '#ffffff' }}>
              Score: {score}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  initAudio()
                  const nextLevel = level + 1
                  setLevel(nextLevel)
                  initGame(nextLevel, difficulty)
                }}
                className="px-8 py-3 text-lg font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                  color: '#0a1a0a',
                  boxShadow: '0 0 20px rgba(68,221,100,0.4)',
                }}
              >
                NEXT LEVEL
              </button>
              <button
                onClick={() => { setScreen('home'); stateRef.current = null }}
                className="px-8 py-3 text-lg font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
