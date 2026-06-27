import React from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

export default function VoiceButton({ isListening, isSupported, onClick, disabled }) {
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-40">
          <MicOff size={24} />
        </div>
        <span className="text-xs text-white/30">Voice not supported in this browser</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
        ${isListening
          ? 'bg-red-500 shadow-lg shadow-red-500/40 scale-110'
          : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
      `}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
          <span className="absolute inset-[-6px] rounded-full border-2 border-red-400/40 animate-pulse" />
        </>
      )}

      {/* Voice bars animation */}
      {isListening ? (
        <div className="flex gap-[3px] items-center h-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white rounded-full voice-bar"
              style={{
                height: `${[10, 18, 24, 16, 10][i]}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      ) : (
        <Mic size={22} className="text-white" />
      )}
    </button>
  )
}
