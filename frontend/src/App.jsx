import React, { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, Shield, MessageCircle, ChevronRight } from 'lucide-react'
import StudentChat from './components/StudentChat/StudentChat'
import AdminDashboard from './components/AdminDashboard/AdminDashboard'

function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
          <GraduationCap size={36} />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          College Admission
          <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Voice Agent
          </span>
        </h1>

        <p className="text-white/50 text-lg mb-2">
          AI-powered admission assistant with voice & text support
        </p>
        <p className="text-white/30 text-sm mb-10">
          हिंदी और अंग्रेजी में बात करें • Hindi & English supported
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <button
            onClick={() => navigate('/chat')}
            className="glass-card p-5 flex flex-col items-center gap-3 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <MessageCircle size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Student Portal</p>
              <p className="text-xs text-white/40 mt-0.5">Ask admission questions</p>
            </div>
            <ChevronRight size={16} className="text-white/30 group-hover:text-blue-400 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin')}
            className="glass-card p-5 flex flex-col items-center gap-3 hover:bg-violet-600/10 hover:border-violet-500/30 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
              <Shield size={22} className="text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Admin Panel</p>
              <p className="text-xs text-white/40 mt-0.5">Manage knowledge base</p>
            </div>
            <ChevronRight size={16} className="text-white/30 group-hover:text-violet-400 transition-colors" />
          </button>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/25">
          <span>Gemini 1.5 Flash</span>
          <span>•</span>
          <span>RAG + LangChain</span>
          <span>•</span>
          <span>ChromaDB</span>
          <span>•</span>
          <span>Web Speech API</span>
          <span>•</span>
          <span>FastAPI + MySQL</span>
        </div>
      </div>
    </div>
  )
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <nav className="border-b border-white/10 px-4 py-3 flex items-center gap-4 glass">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-white">
          <GraduationCap size={20} className="text-blue-400" />
          <span className="text-sm">Admission Agent</span>
        </NavLink>
        <div className="flex-1" />
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
             ${isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`
          }
        >
          <MessageCircle size={15} /> Student
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
             ${isActive ? 'bg-violet-600/20 text-violet-400 border border-violet-600/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`
          }
        >
          <Shield size={15} /> Admin
        </NavLink>
      </nav>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/chat"
        element={
          <Layout>
            <div className="h-[calc(100vh-57px)] flex flex-col max-w-2xl mx-auto w-full">
              <StudentChat />
            </div>
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <div className="h-[calc(100vh-57px)] overflow-y-auto">
              <div className="max-w-5xl mx-auto w-full">
                <AdminDashboard />
              </div>
            </div>
          </Layout>
        }
      />
    </Routes>
  )
}
