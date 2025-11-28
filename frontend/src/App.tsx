import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  mode: string
  messages: Message[]
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [dropdownId, setDropdownId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const API_BASE = 'https://overfew-subtriquetrous-jae.ngrok-free.dev'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, loading])

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    }
  }

  const createConversation = async (mode: string) => {
    try {
      // Supprimer la conversation actuelle si elle est vide ou sans message utilisateur
      if (currentConversation) {
        const hasUserMessage = currentConversation.messages.some(m => m.sender === 'user')
        if (!hasUserMessage) {
          await fetch(`${API_BASE}/conversations/${currentConversation.id}`, { method: 'DELETE' })
        }
      }

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

  const deleteConversation = (id: string) => {
    setDeleteTargetId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (deleteTargetId === null) return

    try {
      await fetch(`${API_BASE}/conversations/${deleteTargetId}`, { method: 'DELETE' })
      setConversations(conversations.filter(c => c.id !== deleteTargetId))
      if (currentConversation?.id === deleteTargetId) setCurrentConversation(null)
      setShowDeleteModal(false)
      setDeleteTargetId(null)
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const renameConversation = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${id}?title=${encodeURIComponent(newTitle)}`, {
        method: 'PATCH'
      })

      if (response.status === 404) {
        console.warn('Conversation introuvable pour renommage (404), suppression locale.')
        setConversations(prev => prev.filter(c => c.id !== id))
        if (currentConversation?.id === id) setCurrentConversation(null)
        setEditingId(null)
        return
      }

      if (!response.ok) return

      const updated = await response.json()
      setConversations(conversations.map(c => c.id === id ? updated : c))
      if (currentConversation?.id === id) setCurrentConversation(updated)
      setEditingId(null)
    } catch (error) {
      console.error('Erreur renommage:', error)
    }
  }

  const [isThinking, setIsThinking] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || !currentConversation) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...currentConversation.messages, userMsg]
    const updatedConversation = { ...currentConversation, messages: updatedMessages }

    setCurrentConversation(updatedConversation)
    setConversations(conversations.map(c => c.id === currentConversation.id ? updatedConversation : c))
    setMessage('')
    setLoading(true)
    setIsThinking(true)

    try {
      const response = await fetch(`${API_BASE}/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg.content, stream: true })
      })

      if (!response.ok) {
        if (response.status === 404) {
          alert("Cette conversation n'existe plus sur le serveur.")
          setConversations(prev => prev.filter(c => c.id !== currentConversation.id))
          setCurrentConversation(null)
          return
        }
        throw new Error('Erreur réseau')
      }

      const contentType = response.headers.get('content-type')
      let aiContent = ''
      const aiMsgId = (Date.now() + 1).toString()
      const aiMsg: Message = {
        id: aiMsgId,
        sender: 'ai',
        content: '',
        timestamp: new Date().toISOString()
      }

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        aiContent = data.content
        setIsThinking(false)

        // Add full message
        const finalMessages = [...updatedMessages, { ...aiMsg, content: aiContent }]
        setCurrentConversation({ ...updatedConversation, messages: finalMessages })
        setConversations(prev => prev.map(c => c.id === currentConversation.id ? { ...c, messages: finalMessages } : c))

      } else {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let isFirstChunk = true

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            aiContent += chunk

            if (isFirstChunk) {
              setIsThinking(false)
              isFirstChunk = false
              // Initialize AI message with first chunk
              setCurrentConversation(prev => {
                if (!prev) return null
                return { ...prev, messages: [...prev.messages, { ...aiMsg, content: aiContent }] }
              })
            } else {
              // Update existing AI message
              setCurrentConversation(prev => {
                if (!prev) return null
                const newMessages = prev.messages.map(m =>
                  m.id === aiMsgId ? { ...m, content: aiContent } : m
                )
                return { ...prev, messages: newMessages }
              })
            }
          }
        }
      }

      // Final update to ensure consistency
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversation.id) {
          const finalMessages = [...updatedMessages, { ...aiMsg, content: aiContent }]
          return { ...c, messages: finalMessages }
        }
        return c
      }))

    } catch (error) {
      console.error('Erreur envoi message:', error)
    } finally {
      setLoading(false)
      setIsThinking(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setDropdownId(null)
      }
    }
    if (dropdownId !== null) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [dropdownId])

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className="w-[320px] glass-panel flex flex-col h-full transition-all duration-300 z-20 flex-shrink-0">
        <div className="p-6 border-b border-slate-200/50 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">

            AI Chat
          </h1>
        </div>

        <div className="p-4 space-y-3">
          <button
            onClick={() => createConversation('user_initiated')}
            className="w-full group relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="flex items-center justify-center gap-2 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Nouvelle conversation
            </div>
          </button>

          <button
            onClick={() => createConversation('ai_initiated')}
            className="w-full group bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 p-3 rounded-xl transition-all duration-300 border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-lg">🤖</span>
            Démarrer avec l'IA
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-2">Historique</div>
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`group relative rounded-xl transition-all duration-200 ${currentConversation?.id === conv.id
                ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30'
                : 'hover:bg-slate-100 border border-transparent'
                }`}
            >
              {editingId === conv.id ? (
                <div className="p-2 flex gap-2 items-center">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && renameConversation(conv.id, editTitle)}
                    className="flex-1 bg-white text-slate-900 px-3 py-2 rounded-lg text-sm border border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                  <button onClick={() => renameConversation(conv.id, editTitle)} className="text-green-500 hover:text-green-600 p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
                  <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600 p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              ) : (
                <div
                  onClick={async () => {
                    // Supprimer la conversation actuelle si elle est vide ou sans message utilisateur
                    if (currentConversation) {
                      const hasUserMessage = currentConversation.messages.some(m => m.sender === 'user')
                      if (!hasUserMessage) {
                        await fetch(`${API_BASE}/conversations/${currentConversation.id}`, { method: 'DELETE' })
                      }
                    }

                    // Recharger la conversation complète depuis le serveur
                    try {
                      const response = await fetch(`${API_BASE}/conversations/${conv.id}`, {
                        headers: { 'ngrok-skip-browser-warning': 'true' }
                      })
                      
                      if (response.ok) {
                        const fullConv = await response.json()
                        setCurrentConversation(fullConv)
                      } else if (response.status === 404) {
                        // La conversation n'existe plus sur le serveur
                        console.warn('Conversation introuvable (404), suppression locale.')
                        setConversations(prev => prev.filter(c => c.id !== conv.id))
                        if (currentConversation?.id === conv.id) setCurrentConversation(null)
                      } else {
                        // Autre erreur, on garde la version locale
                        setCurrentConversation(conv)
                      }
                    } catch (error) {
                      console.error('Erreur chargement conversation:', error)
                      setCurrentConversation(conv)
                    }
                  }}
                  className="p-3 cursor-pointer flex items-center gap-3"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${currentConversation?.id === conv.id ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-400'
                    }`}></div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${currentConversation?.id === conv.id
                      ? 'text-slate-900'
                      : 'text-slate-600 group-hover:text-slate-900'
                      }`}>
                      {conv.title}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setDropdownId(dropdownId === conv.id ? null : conv.id); }}
                    className="dropdown-trigger opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                  </button>
                </div>
              )}

              {dropdownId === conv.id && (
                <div className="dropdown-menu absolute right-2 top-10 w-40 glass bg-white/95 rounded-xl shadow-2xl border border-slate-200 py-1 z-50 animate-fadeIn backdrop-blur-xl">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); setDropdownId(null); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Renommer
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); setDropdownId(null); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-20 glass border-b border-slate-200/50 flex items-center justify-between px-8 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg ${currentConversation.mode === 'ai_initiated'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                  {currentConversation.mode === 'ai_initiated' ? '🤖' : '💬'}
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-800 tracking-wide">{currentConversation.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    En ligne
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
              {currentConversation.messages?.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <div className="text-6xl mb-4">👋</div>
                  <p className="text-lg">Commencez la discussion...</p>
                </div>
              )}

              {currentConversation.messages?.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 animate-slideIn ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10 ${msg.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                    : 'bg-gradient-to-br from-slate-200 to-slate-300'
                    }`}>
                    {msg.sender === 'user' ? '👤' : '🤖'}
                  </div>

                  <div className={`max-w-2xl group relative ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-6 py-4 rounded-2xl shadow-xl backdrop-blur-sm border leading-relaxed ${msg.sender === 'user'
                      ? 'bg-blue-600/90 text-white rounded-tr-sm border-blue-500/20'
                      : 'glass text-slate-800 rounded-tl-sm border-slate-200/50'
                      }`}>
                      {msg.content}
                    </div>
                    <div className={`text-[10px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'
                      }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-4 animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center border border-white/10">
                    🤖
                  </div>
                  <div className="glass px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 relative z-20">
              <div className="max-w-4xl mx-auto relative">
                <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border border-slate-200">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Écrivez votre message..."
                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 px-4 py-3 focus:outline-none"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg hover:shadow-blue-500/25 active:scale-95"
                  >
                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </button>
                </div>
              </div>
              <div className="text-center mt-3">
                <p className="text-[10px] text-slate-500">L'IA peut faire des erreurs. Vérifiez les informations importantes.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="relative z-10 text-center space-y-6 p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-slate-200 shadow-2xl rotate-3 hover:rotate-6 transition-transform duration-500">
                <span className="text-5xl">✨</span>
              </div>
              <h1 className="font-display text-4xl font-bold text-slate-800 tracking-tight">Bienvenue sur AI Chat</h1>
              <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
                Une expérience conversationnelle nouvelle génération. Créez une conversation pour commencer à échanger.
              </p>
              <div className="flex gap-4 justify-center mt-8">
                <button onClick={() => createConversation('user_initiated')} className="px-6 py-3 bg-white/50 hover:bg-white/80 border border-slate-200 rounded-xl text-sm font-medium transition-all hover:scale-105 text-slate-700">
                  Nouvelle discussion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 transform transition-all scale-100 animate-slideIn">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Supprimer la conversation ?</h3>
                <p className="text-slate-500 text-sm mb-6">Cette action est irréversible. Voulez-vous vraiment continuer ?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/20"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default App
