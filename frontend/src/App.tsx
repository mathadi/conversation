import { useState, useEffect } from 'react'
import './App.css'

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
}

interface Conversation {
  id: number
  title: string
  messages: Message[]
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [dropdownId, setDropdownId] = useState<number | null>(null)

  const API_BASE = 'http://localhost:8000'

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`)
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    }
  }

  // Créer nouvelle conversation
  const createConversation = async (mode: string) => {
    try {
      const title = mode === 'ai_initiated' ? 'Conversation IA' : 'Nouvelle conversation'
      const response = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, mode })
      })
      if (!response.ok) return
      const newConv = await response.json()
      setConversations([newConv, ...conversations])
      setCurrentConversation(newConv)
      await loadConversations()
    } catch (error) {
      console.error('Erreur création conversation:', error)
    }
  }

  // Envoyer message
  const sendMessage = async () => {
    if (!message.trim() || !currentConversation || loading) return

    console.log('Envoi message...')
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      })
      
      console.log('Status:', response.status)
      
      if (response.ok) {
        const messageData = await response.json()
        console.log('Message IA:', messageData)
        const convResponse = await fetch(`${API_BASE}/conversations/${currentConversation.id}`)
        const updatedConv = await convResponse.json()
        setCurrentConversation(updatedConv)
        setMessage('')
      } else {
        const errorText = await response.text()
        console.error('Erreur:', response.status, errorText)
      }
    } catch (error) {
      console.error('Exception:', error)
    }
    setLoading(false)
  }

  // Supprimer conversation
  const deleteConversation = async (id: number) => {
    if (!confirm('Supprimer cette conversation ?')) return
    try {
      await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' })
      setConversations(conversations.filter(c => c.id !== id))
      if (currentConversation?.id === id) setCurrentConversation(null)
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  // Renommer conversation
  const renameConversation = async (id: number, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${id}?title=${encodeURIComponent(newTitle)}`, {
        method: 'PATCH'
      })
      const updated = await response.json()
      setConversations(conversations.map(c => c.id === id ? updated : c))
      if (currentConversation?.id === id) setCurrentConversation(updated)
      setEditingId(null)
    } catch (error) {
      console.error('Erreur renommage:', error)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-menu') && !target.closest('button')) {
        setDropdownId(null)
      }
    }
    if (dropdownId !== null) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [dropdownId])

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Chat IA
          </h1>
          <button 
            onClick={() => createConversation('user_initiated')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-lg transition-all mb-2"
          >
            + Nouvelle conversation
          </button>
          <button 
            onClick={() => createConversation('ai_initiated')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 text-sm font-medium shadow-lg transition-all"
          >
            🤖 Conversation IA
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div 
              key={conv.id}
              className={`relative group ${
                currentConversation?.id === conv.id ? 'bg-gray-800/80' : ''
              }`}
            >
              {editingId === conv.id ? (
                <div className="p-4 flex gap-2 items-center">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && renameConversation(conv.id, editTitle)}
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => renameConversation(conv.id, editTitle)} 
                    className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    ✓
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div 
                    onClick={() => setCurrentConversation(conv)}
                    className={`p-4 cursor-pointer transition-all rounded-lg mx-2 my-1 ${
                      currentConversation?.id === conv.id 
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-white text-sm flex-1 truncate pr-2">
                        {conv.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          conv.mode === 'ai_initiated' 
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30' 
                            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {conv.mode === 'ai_initiated' ? '🤖' : '👤'}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDropdownId(dropdownId === conv.id ? null : conv.id); }}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                          ⋯
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>💬 {conv.messages?.length || 0} messages</span>
                    </div>
                  </div>
                  
                  {dropdownId === conv.id && (
                    <div className="dropdown-menu absolute right-6 top-16 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 py-2 z-50 min-w-[180px] animate-fadeIn">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); setDropdownId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <span className="text-base">✏️</span>
                        <span>Renommer</span>
                      </button>
                      <div className="h-px bg-gray-700 my-1"></div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); setDropdownId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                      >
                        <span className="text-base">🗑️</span>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {currentConversation.mode === 'ai_initiated' ? '🤖' : '💬'}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{currentConversation.title}</h2>
                  <p className="text-xs text-gray-500">{currentConversation.messages?.length || 0} messages</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentConversation.messages?.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  }`}>
                    {msg.sender === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`max-w-2xl px-5 py-3 rounded-2xl message-content shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    🤖
                  </div>
                  <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
              <div className="max-w-4xl mx-auto flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 chat-input rounded-full px-6 py-4 text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !message.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:hover:from-blue-500 disabled:hover:to-blue-600"
                >
                  <span>Envoyer</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">Aucune conversation sélectionnée</h3>
            <p className="text-sm">Créez une nouvelle conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
