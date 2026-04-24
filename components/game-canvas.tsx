'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { GameState, Keys } from '@/lib/game-types'
import { generateLevel, generateStars, createPlayer, updateGame } from '@/lib/game-engine'
import {
  drawBackground,
  drawStars,
  drawParallaxMountains,
  drawPlatform,
  drawPlayer,
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
  })
  const lastTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number>(0)
  const [screen, setScreen] = useState<'title' | 'playing' | 'dead' | 'won'>('title')
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

    // Check game state transitions
    if (newState.gameOver && screen === 'playing') {
      setScore(newState.player.score)
      setScreen('dead')
    }
    if (newState.gameWon && screen === 'playing') {
      setScore(newState.player.score)
      setScreen('won')
    }

    // ─── Render ───
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    drawBackground(ctx, newState, canvas.width, canvas.height)
    drawStars(ctx, newState.stars, newState.cameraX)
    drawParallaxMountains(ctx, newState.cameraX, canvas.width, canvas.height)

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
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(10, canvas.height - 16, canvas.width - 20, 8)
    const progGrad = ctx.createLinearGradient(10, 0, 10 + (canvas.width - 20) * progress, 0)
    progGrad.addColorStop(0, '#2266cc')
    progGrad.addColorStop(1, '#44ddff')
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

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
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

      {/* Title Screen */}
      {screen === 'title' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <h1
                className="text-6xl font-bold tracking-tighter font-sans"
                style={{ color: '#44ddff', textShadow: '0 0 30px rgba(68,221,255,0.5), 0 2px 4px rgba(0,0,0,0.8)' }}
              >
                STELLAR RECON
              </h1>
              <p
                className="text-lg font-sans mt-2"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Jetpack Assault
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setLevel(1); initGame(1) }}
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
              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}
            >
              <p><span style={{ color: '#44ddff' }}>A/D</span> {'Move  |  '}<span style={{ color: '#44ddff' }}>W/Space</span> {'Jump  |  '}<span style={{ color: '#44ddff' }}>Shift</span> Jetpack</p>
              <p><span style={{ color: '#44ddff' }}>Click/J</span> {'Shoot  |  '}Defeat the boss to win</p>
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
              onClick={() => initGame(level)}
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
