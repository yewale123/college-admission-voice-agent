import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Trash2, GraduationCap, Globe, RefreshCw, Phone, PhoneOff, Mic, Brain, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'
import MessageBubble, { TypingIndicator } from './MessageBubble'
import { useSpeechRecognition, useSpeechSynthesis, useVoiceActivity } from '../../hooks/useSpeech'
import { sendMessage, clearSession } from '../../api/api'

const WELCOME = {
  en: {
    role: 'assistant',
    content: `Hello! I'm your College Admission Counselor. 😊\n\nI'm here to help you with anything related to admissions — eligibility, fees, important dates, required documents, entrance exams, and more.\n\nPress "Start Conversation" to talk with me directly, or type your question below. I'll do my best to help!`,
    language: 'en',
  },
  hi: {
    role: 'assistant',
    content: `नमस्ते! मैं आपका College Admission Counselor हूं। 😊\n\nAdmission से जुड़े किसी भी सवाल में मैं आपकी मदद कर सकता हूं — eligibility, fees, important dates, documents, entrance exams, सब कुछ।\n\n"बातचीत शुरू करें" दबाएं और सीधे बात करें, या नीचे type करें। पूछने में बिल्कुल संकोच न करें!`,
    language: 'hi',
  },
}

const FALLBACK = {
  en: "I'm sorry, I couldn't find specific information on that right now. Could you please rephrase or ask something else? I'm here to help!",
  hi: "माफ करें, इस सवाल का जवाब अभी मेरे पास नहीं है। क्या आप दोबारा या कुछ अलग तरीके से पूछ सकते हैं?",
}

const STATE = { IDLE: 'idle', LISTENING: 'listening', PROCESSING: 'processing', SPEAKING: 'speaking' }

export default function StudentChat() {
  const [messages,   setMessages]   = useState([])
  const [inputText,  setInputText]  = useState('')
  const [sessionId,  setSessionId]  = useState(null)
  const [isLoading,  setIsLoading]  = useState(false)
  const [language,   setLanguage]   = useState('en')
  const [convState,  setConvState]  = useState(STATE.IDLE)

  const messagesEndRef      = useRef(null)
  const conversationActive  = useRef(false)
  const sessionIdRef        = useRef(null)
  const languageRef         = useRef(language)
  const bargeInTimerRef     = useRef(null)

  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { languageRef.current  = language  }, [language])

  const { isSpeaking, speak, stopSpeaking } = useSpeechSynthesis()

  // VAD: detect user speaking while AI talks (barge-in via energy, not mic stream)
  const handleBargeIn = useCallback(() => {
    if (!conversationActive.current) return
    stopSpeaking(true)                    // stop AI silently (no restart callback)
    setTimeout(() => {
      if (conversationActive.current) {
        setConvState(STATE.LISTENING)
        startListeningRef.current?.()     // start fresh recognition for user
      }
    }, 200)
  }, [stopSpeaking])

  const { vadStart, vadStop } = useVoiceActivity(handleBargeIn)

  // ── restart mic (called after AI speaks OR on silence) ──────────────────
  const restartMic = useCallback(() => {
    if (!conversationActive.current) return
    setTimeout(() => {
      if (conversationActive.current) {
        setConvState(STATE.LISTENING)
        startListening()
      }
    }, 400)
  }, []) // startListening added below via ref

  const startListeningRef = useRef(null)
  const restartMicCb = useCallback(() => {
    if (!conversationActive.current) return
    setTimeout(() => {
      if (conversationActive.current) {
        setConvState(STATE.LISTENING)
        startListeningRef.current?.()
      }
    }, 400)
  }, [])

  // ── speak helper: AI speaks → VAD listens for barge-in → mic restarts ───
  const speakAndRestart = useCallback((text, lang) => {
    setConvState(STATE.SPEAKING)
    vadStop()           // stop any previous VAD session

    speak(text, lang, () => {
      // AI finished naturally (not interrupted)
      vadStop()
      setTimeout(() => restartMicCb(), 1000)   // 1s for echo to fade
    })

    // Start VAD ~800ms into AI speech (enough time for echo cancellation to kick in)
    setTimeout(() => {
      if (conversationActive.current) vadStart()
    }, 800)
  }, [speak, restartMicCb, vadStart, vadStop])

  // ── main voice handler: called when user finishes speaking ───────────────
  const handleVoiceResult = useCallback(async (spokenText) => {
    if (!conversationActive.current || !spokenText.trim()) return

    // Silently stop AI speech — silent=true means restart callback won't fire
    stopSpeaking(true)

    const lang = languageRef.current
    const sid  = sessionIdRef.current

    setConvState(STATE.PROCESSING)
    const userMsg = { id: Date.now(), role: 'user', content: spokenText, language: lang }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await sendMessage(sid, spokenText, lang)
      const { session_id, answer } = res.data
      if (!sid) { setSessionId(session_id); sessionIdRef.current = session_id }

      const replyLang = res.data.language || lang   // use server-detected language
      const reply = answer?.trim() || FALLBACK[replyLang] || FALLBACK.en
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: reply, language: replyLang }
      setMessages(prev => [...prev, aiMsg])

      speakAndRestart(reply, replyLang)
    } catch {
      const errMsg = FALLBACK[lang] || FALLBACK.en
      const aiMsg  = { id: Date.now() + 1, role: 'assistant', content: errMsg, language: lang }
      setMessages(prev => [...prev, aiMsg])
      speakAndRestart(errMsg, lang)   // speak error too, then restart
    } finally {
      setIsLoading(false)
    }
  }, [stopSpeaking, speakAndRestart])

  // ── silence/no-speech handler: silently restart mic ──────────────────────
  const handleNoSpeech = useCallback(() => {
    if (!conversationActive.current) return
    // just restart mic quietly, no message needed
    setTimeout(() => {
      if (conversationActive.current) {
        setConvState(STATE.LISTENING)
        startListeningRef.current?.()
      }
    }, 300)
  }, [])

  const {
    isListening, interimText, error: voiceError, isSupported,
    startListening, stopListening,
  } = useSpeechRecognition(language, handleVoiceResult, handleNoSpeech)

  // keep startListening accessible in refs
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  useEffect(() => { setMessages([{ ...WELCOME[language], id: 'welcome' }]) }, [language])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (voiceError) toast.error(voiceError) }, [voiceError])

  // ── conversation start / stop ────────────────────────────────────────────
  const startConversation = () => {
    if (!isSupported) { toast.error('Voice requires Google Chrome browser'); return }
    conversationActive.current = true
    setConvState(STATE.LISTENING)
    startListening()
  }

  const stopConversation = () => {
    conversationActive.current = false
    stopListening()
    stopSpeaking(true)
    vadStop()
    setConvState(STATE.IDLE)
  }

  const isConversationActive = convState !== STATE.IDLE

  // ── manual text send ─────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const msg = inputText.trim()
    if (!msg || isLoading) return
    setInputText('')

    const lang = languageRef.current
    const sid  = sessionIdRef.current

    const userMsg = { id: Date.now(), role: 'user', content: msg, language: lang }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await sendMessage(sid, msg, lang)
      const { session_id, answer } = res.data
      if (!sid) { setSessionId(session_id); sessionIdRef.current = session_id }

      const replyLang = res.data.language || lang
      const reply = answer?.trim() || FALLBACK[replyLang] || FALLBACK.en
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: reply, language: replyLang }
      setMessages(prev => [...prev, aiMsg])
      speak(reply, replyLang)
    } catch {
      toast.error('Failed to get response.')
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, speak])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleClear = async () => {
    stopConversation()
    if (sessionId) { try { await clearSession(sessionId) } catch {} ; setSessionId(null) }
    setMessages([{ ...WELCOME[language], id: 'welcome' }])
    toast.success('Conversation cleared')
  }

  const switchLanguage = () => {
    stopConversation()
    setLanguage(l => l === 'en' ? 'hi' : 'en')
    if (sessionId) { clearSession(sessionId).catch(() => {}); setSessionId(null) }
  }

  // ── state display config ─────────────────────────────────────────────────
  const STATE_CFG = {
    idle:       { label: language === 'hi' ? 'बातचीत शुरू करें' : 'Start Conversation', color: 'text-blue-400',   dot: 'bg-blue-500'   },
    listening:  { label: language === 'hi' ? 'सुन रहा हूं...'    : 'Listening...',        color: 'text-red-400',    dot: 'bg-red-500'    },
    processing: { label: language === 'hi' ? 'सोच रहा हूं...'   : 'Thinking...',         color: 'text-yellow-400', dot: 'bg-yellow-500' },
    speaking:   { label: language === 'hi' ? 'बोल रहा हूं...'   : 'Speaking...',         color: 'text-green-400',  dot: 'bg-green-500'  },
  }
  const cfg = STATE_CFG[convState]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Admission Counselor</h1>
            <p className="text-xs text-white/40">{language === 'hi' ? 'AI द्वारा संचालित • Hindi & English' : 'AI-powered • Hindi & English'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={switchLanguage} className="btn-secondary flex items-center gap-2 text-sm">
            <Globe size={15} />
            {language === 'en' ? 'हिंदी' : 'English'}
          </button>
          <button onClick={handleClear} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Trash2 size={16} className="text-white/40 hover:text-white/70" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onSpeak={() => speak(msg.content, msg.language)} isSpeaking={isSpeaking} />
        ))}
        {isLoading && <TypingIndicator />}

        {/* Interim transcript preview */}
        {isListening && interimText && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/50 flex items-center justify-center flex-shrink-0">
              <Mic size={16} />
            </div>
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-white/50 text-sm italic max-w-[80%]">
              {interimText}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom controls */}
      <div className="border-t border-white/10 px-4 py-5 space-y-4">

        {/* Conversation toggle + state */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={isConversationActive ? stopConversation : startConversation}
            disabled={!isSupported}
            className={`relative flex items-center gap-2.5 px-7 py-3 rounded-2xl font-semibold text-white transition-all duration-200 shadow-lg
              ${isConversationActive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'}
              disabled:opacity-40`}
          >
            {isConversationActive && (
              <span className="absolute inset-0 rounded-2xl animate-ping bg-current opacity-10 pointer-events-none" />
            )}
            {isConversationActive ? <PhoneOff size={17} /> : <Phone size={17} />}
            {isConversationActive
              ? (language === 'hi' ? 'बातचीत बंद करें' : 'End Conversation')
              : cfg.label}
          </button>

          {/* State indicator */}
          {isConversationActive && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dot} ${convState !== STATE.PROCESSING ? 'animate-pulse' : ''}`} />

              {/* Voice wave bars when listening */}
              {convState === STATE.LISTENING && (
                <div className="flex gap-[3px] items-center h-4">
                  {[8, 14, 18, 12, 8].map((h, i) => (
                    <div key={i} className="w-1 bg-red-400 rounded-full voice-bar"
                      style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}

              {convState === STATE.PROCESSING && <Brain size={14} className="text-yellow-400 animate-spin" />}
              {convState === STATE.SPEAKING   && <Volume2 size={14} className="text-green-400" />}

              <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>

              {/* Barge-in hint while speaking */}
              {convState === STATE.SPEAKING && (
                <span className="text-xs text-white/25 ml-1">
                  {language === 'hi' ? '(बोलें तो रुक जाएगा)' : '(speak to interrupt)'}
                </span>
              )}
            </div>
          )}

          {!isSupported && (
            <p className="text-xs text-white/30">Voice requires Google Chrome</p>
          )}
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'hi' ? 'या यहां type करें...' : 'Or type your question here...'}
            rows={1}
            className="input-field flex-1 resize-none min-h-[44px] max-h-28 text-sm"
            style={{ fontFamily: language === 'hi' ? "'Noto Sans Devanagari', sans-serif" : 'inherit' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="btn-primary px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>
    </div>
  )
}
