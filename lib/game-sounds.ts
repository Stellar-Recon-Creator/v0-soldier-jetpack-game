// ─── Game Sound System (Web Audio API) ───

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

// Ensure audio context is resumed (required after user interaction)
export function initAudio() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
}

// ─── LASER / GUN SOUND ───
export function playLaserSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    
    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Laser "pew" - starts high and drops quickly
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.12)
  } catch {
    // Audio not available
  }
}

// ─── JETPACK SOUND ───
let jetpackOscillator: OscillatorNode | null = null
let jetpackGain: GainNode | null = null
let jetpackNoise: AudioBufferSourceNode | null = null
let jetpackNoiseGain: GainNode | null = null

export function startJetpackSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    if (jetpackOscillator) return // Already playing
    
    // Low rumble oscillator
    jetpackOscillator = ctx.createOscillator()
    jetpackGain = ctx.createGain()
    
    jetpackOscillator.type = 'sawtooth'
    jetpackOscillator.frequency.setValueAtTime(80, ctx.currentTime)
    
    jetpackGain.gain.setValueAtTime(0, ctx.currentTime)
    jetpackGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05)
    
    jetpackOscillator.connect(jetpackGain)
    jetpackGain.connect(ctx.destination)
    
    jetpackOscillator.start()
    
    // Add noise for "whoosh" effect
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    
    jetpackNoise = ctx.createBufferSource()
    jetpackNoise.buffer = noiseBuffer
    jetpackNoise.loop = true
    
    jetpackNoiseGain = ctx.createGain()
    jetpackNoiseGain.gain.setValueAtTime(0, ctx.currentTime)
    jetpackNoiseGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05)
    
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(800, ctx.currentTime)
    noiseFilter.Q.setValueAtTime(1, ctx.currentTime)
    
    jetpackNoise.connect(noiseFilter)
    noiseFilter.connect(jetpackNoiseGain)
    jetpackNoiseGain.connect(ctx.destination)
    
    jetpackNoise.start()
  } catch {
    // Audio not available
  }
}

export function stopJetpackSound() {
  try {
    const ctx = getAudioContext()
    
    if (jetpackGain) {
      jetpackGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
    }
    if (jetpackNoiseGain) {
      jetpackNoiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
    }
    
    setTimeout(() => {
      if (jetpackOscillator) {
        try { jetpackOscillator.stop() } catch { /* ignore */ }
        jetpackOscillator = null
      }
      if (jetpackNoise) {
        try { jetpackNoise.stop() } catch { /* ignore */ }
        jetpackNoise = null
      }
      jetpackGain = null
      jetpackNoiseGain = null
    }, 120)
  } catch {
    // Audio not available
  }
}

// ─── ALIEN SOUNDS ───
export function playAlienHitSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Squelchy hit sound
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(400, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08)
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  } catch {
    // Audio not available
  }
}

export function playAlienDeathSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    // Multiple oscillators for a more complex death sound
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()
    
    osc1.connect(gain1)
    osc2.connect(gain2)
    gain1.connect(ctx.destination)
    gain2.connect(ctx.destination)
    
    // Descending screech
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(800, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
    
    // Low burst
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(150, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2)
    
    gain1.gain.setValueAtTime(0.1, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    gain2.gain.setValueAtTime(0.08, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 0.25)
  } catch {
    // Audio not available
  }
}

export function playAlienShootSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    
    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Alien projectile - bubbly/organic sound
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.setValueAtTime(500, ctx.currentTime + 0.02)
    oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.05)
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch {
    // Audio not available
  }
}

export function playBossRoarSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const osc3 = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    
    osc1.connect(gain)
    osc2.connect(gain)
    osc3.connect(gain)
    gain.connect(filter)
    filter.connect(ctx.destination)
    
    // Deep, menacing roar with harmonics
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(80, ctx.currentTime)
    osc1.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.4)
    
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(160, ctx.currentTime)
    osc2.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4)
    
    osc3.type = 'sawtooth'
    osc3.frequency.setValueAtTime(240, ctx.currentTime)
    osc3.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, ctx.currentTime)
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 0.5)
    osc3.start(ctx.currentTime)
    osc3.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not available
  }
}

// ─── PLAYER SOUNDS ───
export function playPlayerHitSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch {
    // Audio not available
  }
}

export function playJumpSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(250, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08)
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  } catch {
    // Audio not available
  }
}

export function playExplosionSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') return
    
    // Create noise buffer for explosion
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }
    
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    
    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3)
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    noise.start(ctx.currentTime)
  } catch {
    // Audio not available
  }
}
