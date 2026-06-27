import React from 'react'
import { Volume2, VolumeX, Bot, User } from 'lucide-react'

export default function MessageBubble({ message, onSpeak, isSpeaking }) {
  const isUser = message.role === 'user'
  const isHindi = message.language === 'hi'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
        ${isUser ? 'bg-blue-600' : 'bg-violet-600'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white/8 border border-white/10 text-slate-100 rounded-tl-sm'
          }
          ${isHindi ? 'font-medium' : ''}
        `}>
          {message.content}
        </div>

        {/* AI message actions */}
        {!isUser && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onSpeak(message.content, message.language)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking
                ? <VolumeX size={13} />
                : <Volume2 size={13} />
              }
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
        <Bot size={16} />
      </div>
      <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <div className="w-2 h-2 bg-white/50 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-white/50 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-white/50 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  )
}
