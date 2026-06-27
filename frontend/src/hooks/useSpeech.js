import { useState, useEffect, useRef, useCallback } from 'react'

const LANG_MAP = { en: 'en-IN', hi: 'hi-IN' }

// Activate Chrome's system-level echo cancellation once
let echoReady = false
async function activateEchoCancellation() {
  if (echoReady) return
  try {
    const s = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    s.getTracks().forEach(t => t.stop())
    echoReady = true
  } catch {}
}

// ─── Voice Activity Detection ────────────────────────────────────────────────
// Monitors mic energy while AI speaks. Fires callback only when REAL user
// speech is detected (energy > threshold for sustained duration).
// echoCancellation keeps AI echo low (~5 RMS), so threshold of 14 catches
// only actual human voice (~25+ RMS).
export function useVoiceActivity(onSpeechDetected) {
  const ctxRef      = useRef(null)
  const streamRef   = useRef(null)
  const rafRef      = useRef(null)
  const framesRef   = useRef(0)
  const runningRef  = useRef(false)
  const cbRef       = useRef(onSpeechDetected)

  useEffect(() => { cbRef.current = onSpeechDetected }, [onSpeechDetected])

  const start = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    framesRef.current  = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,   // suppresses AI speaker echo
          noiseSuppression: false,  // keep raw energy for threshold comparison
          autoGainControl: false,   // fixed gain so threshold is consistent
        },
      })
      streamRef.current = stream

      const ctx      = new AudioContext()
      ctxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)

      const data = new Uint8Array(analyser.frequencyBinCount)

      const THRESHOLD  = 14   // RMS — below: echo/silence, above: human speech
      const MIN_FRAMES = 10   // ~167ms of sustained speech at 60fps

      const tick = () => {
        if (!runningRef.current) return
        analyser.getByteTimeDomainData(data)
        const rms = Math.sqrt(
          data.reduce((sum, v) => sum + (v - 128) ** 2, 0) / data.length
        )

        if (rms > THRESHOLD) {
          framesRef.current++
          if (framesRef.current >= MIN_FRAMES) {
            // Real human speech confirmed → fire callback
            stop()
            cbRef.current?.()
            return
          }
        } else {
          framesRef.current = Math.max(0, framesRef.current - 2) // decay fast
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      runningRef.current = false
    }
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    streamRef.current = null
    framesRef.current = 0
  }, [])

  return { vadStart: start, vadStop: stop }
}

// ─── Speech Recognition ──────────────────────────────────────────────────────
export function useSpeechRecognition(language = 'en', onFinalResult, onNoSpeech) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [error,       setError]       = useState(null)
  const [isSupported, setIsSupported] = useState(false)

  const recRef        = useRef(null)
  const activeRef     = useRef(false)
  const finalRef      = useRef('')
  const gotSpeechRef  = useRef(false)
  const onFinalRef    = useRef(onFinalResult)
  const onNoSpeechRef = useRef(onNoSpeech)

  useEffect(() => { onFinalRef.current    = onFinalResult }, [onFinalResult])
  useEffect(() => { onNoSpeechRef.current = onNoSpeech    }, [onNoSpeech])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setIsSupported(true)

    const r = new SR()
    r.continuous     = false
    r.interimResults = true
    r.lang           = LANG_MAP[language] || 'en-IN'

    r.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) { final += t; gotSpeechRef.current = true }
        else interim += t
      }
      if (final) finalRef.current = final
      setInterimText(final || interim)
    }

    r.onend = () => {
      setIsListening(false)
      activeRef.current    = false
      const text      = finalRef.current.trim()
      const gotSpeech = gotSpeechRef.current
      finalRef.current     = ''
      gotSpeechRef.current = false
      setInterimText('')
      if (text) onFinalRef.current?.(text)
      else if (!gotSpeech) onNoSpeechRef.current?.()
    }

    r.onerror = (e) => {
      if (!['no-speech', 'aborted'].includes(e.error))
        setError(e.error === 'not-allowed' ? 'Microphone permission denied' : e.error)
      setIsListening(false)
      activeRef.current    = false
      finalRef.current     = ''
      gotSpeechRef.current = false
      setInterimText('')
      onNoSpeechRef.current?.()
    }

    recRef.current = r
  }, [language])

  const startListening = useCallback(async () => {
    if (!recRef.current || activeRef.current) return
    await activateEchoCancellation()
    finalRef.current     = ''
    gotSpeechRef.current = false
    setInterimText('')
    setError(null)
    recRef.current.lang = LANG_MAP[language] || 'en-IN'
    try {
      recRef.current.start()
      activeRef.current = true
      setIsListening(true)
    } catch {}
  }, [language])

  const stopListening = useCallback(() => {
    if (recRef.current && activeRef.current) recRef.current.stop()
  }, [])

  return { isListening, interimText, error, isSupported, startListening, stopListening }
}

// ─── Speech Synthesis ────────────────────────────────────────────────────────
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const onEndRef = useRef(null)

  const speak = useCallback((text, language = 'en', onEnd) => {
    if (!window.speechSynthesis) { onEnd?.(); return }
    window.speechSynthesis.cancel()
    onEndRef.current = onEnd

    const u = new SpeechSynthesisUtterance(text)
    u.lang   = LANG_MAP[language] || 'en-IN'
    u.rate   = language === 'hi' ? 0.88 : 0.92
    u.pitch  = 1.08
    u.volume = 1

    const go = () => {
      const voices = window.speechSynthesis.getVoices()
      const match =
        voices.find(v => v.lang === u.lang && v.name.includes('Google')) ||
        voices.find(v => v.lang === u.lang) ||
        voices.find(v => v.lang.startsWith(u.lang.split('-')[0]) && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith(u.lang.split('-')[0]))
      if (match) u.voice = match

      u.onstart = () => setIsSpeaking(true)
      u.onend   = () => { setIsSpeaking(false); const cb = onEndRef.current; onEndRef.current = null; cb?.() }
      u.onerror = () => { setIsSpeaking(false); const cb = onEndRef.current; onEndRef.current = null; cb?.() }
      window.speechSynthesis.speak(u)
    }

    window.speechSynthesis.getVoices().length > 0 ? go() : (window.speechSynthesis.onvoiceschanged = go)
  }, [])

  // silent=true → stop without firing restart callback
  const stopSpeaking = useCallback((silent = false) => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    if (silent) {
      onEndRef.current = null
    } else {
      const cb = onEndRef.current; onEndRef.current = null; cb?.()
    }
  }, [])

  return { isSpeaking, speak, stopSpeaking }
}
