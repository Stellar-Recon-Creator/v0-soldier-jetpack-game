'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { GameState, Keys } from '@/lib/game-types'
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
  })
  const lastTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)
  const jetpackPlayingRef = useRef<boolean>(false)
  const [screen, setScreen] = useState<'home' | 'title' | 'playing' | 'dead' | 'won'>('home')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)

  const initGame = useCallback((lvl: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { platforms, enemies, levelLength } = generateLevel(lvl)
    const stars = generateStars(200, canvas.width, canvas.height)

    stateRef.current = {
      player: createPlayer(),
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
  }, [])

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
    drawPlayer(ctx, newState.player, newState.cameraX, newState.cameraY)

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
          {/* Stars in the night sky */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(80)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() > 0.8 ? '3px' : Math.random() > 0.5 ? '2px' : '1px',
                  height: Math.random() > 0.8 ? '3px' : Math.random() > 0.5 ? '2px' : '1px',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 70}%`,
                  opacity: 0.4 + Math.random() * 0.6,
                }}
              />
            ))}
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
                      drawPlayerZoomed(ctx, 200, 100, 3.5)
                    }
                  }
                }}
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
            
            {/* Play button in the dirt */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ bottom: '30px' }}>
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
            </div>
          </div>
        </div>
      )}

      {/* Title Screen */}
      {screen === 'title' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <h1
                className="text-6xl font-bold tracking-tighter font-sans"
                style={{ color: '#2a5a2a', textShadow: '0 0 20px rgba(68,180,68,0.4), 0 2px 4px rgba(0,0,0,0.5)' }}
              >
                STELLAR RECON
              </h1>
              <p
                className="text-lg font-sans mt-2 font-semibold"
                style={{ color: '#4a7a4a' }}
              >
                Jetpack Assault
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { initAudio(); setLevel(1); initGame(1) }}
                className="block mx-auto px-8 py-3 text-lg font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #22aa44, #44dd66)',
                  color: '#0a1a0a',
                  boxShadow: '0 0 20px rgba(68,221,100,0.4)',
                }}
              >
                START MISSION
              </button>
            </div>

            <div
              className="text-sm font-sans space-y-1 mt-8 p-4 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.85)' }}
            >
              <p><span style={{ color: '#66cc66' }}>A/D</span> {'Move  |  '}<span style={{ color: '#66cc66' }}>W/Space</span> {'Jump  |  '}<span style={{ color: '#66cc66' }}>Shift</span> Jetpack</p>
              <p><span style={{ color: '#66cc66' }}>Mouse</span> {'Aim  |  '}<span style={{ color: '#66cc66' }}>Click</span> {'Shoot  |  '}Defeat the boss to win</p>
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
            <button
              onClick={() => { initAudio(); initGame(level) }}
              className="px-8 py-3 text-lg font-bold font-sans rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #cc2233, #ff4455)',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(255,68,68,0.4)',
              }}
            >
              RETRY
            </button>
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
                  initGame(nextLevel)
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
                onClick={() => { setScreen('title'); stateRef.current = null }}
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
