'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, User, Send, Sparkles, Droplets, Sun, Shield, Layers,
  Eraser, ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';

interface ChatEntry { role: 'user' | 'bot'; content: string; timestamp: string; }
interface QuickAction { label: string; message: string; icon: string }

const ICON_MAP: Record<string, any> = { Droplets, Sun, Shield, Sparkles, Layers };

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-gray-500">$1</em>')
    .replace(/^## (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-gray-800 mt-3 mb-1">$1</h4>')
    .replace(/^(- .+)$/gm, '<div class="pl-4 text-sm text-gray-700">$1</div>')
    .replace(/^(\d+\. .+)$/gm, '<div class="pl-4 text-sm text-gray-700">$1</div>')
    .replace(/^(✅ .+)$/gm, '<div class="pl-2 text-sm text-emerald-700">$1</div>')
    .replace(/^(❌ .+)$/gm, '<div class="pl-2 text-sm text-red-600">$1</div>')
    .replace(/^(⚠️ .+)$/gm, '<div class="pl-2 text-sm text-amber-600">$1</div>')
    .replace(/^(💡 .+)$/gm, '<div class="pl-2 text-sm text-blue-600">$1</div>')
    .replace(/^(☀️ .+)$/gm, '<div class="pl-2 text-sm text-orange-600">$1</div>')
    .replace(/^(👤 .+)$/gm, '<div class="pl-2 text-sm text-gray-600">$1</div>')
    .replace(/^(---)$/gm, '<hr class="my-3 border-gray-200" />')
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
}

export default function BeautyCoachPage() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/beauty-coach/quick-actions').then(r => setQuickActions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }]);
    setSending(true);
    try {
      const r = await api.post('/beauty-coach/chat', { message: msg });
      setMessages(prev => [...prev, { role: 'bot', content: r.data.bot_response, timestamp: r.data.timestamp }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I couldn't process that. Please try again!", timestamp: new Date().toISOString() }]);
    }
    setSending(false);
  };

  const clearChat = async () => {
    setMessages([]);
    await api.delete('/beauty-coach/history').catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-16 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">AI Beauty Coach</h1>
            <p className="text-xs text-gray-500">Ask me anything about skincare</p>
          </div>
        </div>
        <button onClick={clearChat} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" title="Clear chat">
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">How can I help your skin today?</h2>
              <p className="text-gray-500 mb-6">Ask me about ingredients, routines, or product combinations.</p>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((qa, i) => {
                  const Icon = ICON_MAP[qa.icon] || Sparkles;
                  return (
                    <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => send(qa.message)}
                      className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-pink-300 hover:shadow-sm transition-all">
                      <Icon className="w-5 h-5 text-pink-500 mb-2" />
                      <div className="text-sm font-medium text-gray-900">{qa.label}</div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-pink-500 text-white rounded-br-md' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
              }`}>
                {msg.role === 'bot' ? (
                  <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </motion.div>
          ))}

          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                    className="w-2 h-2 bg-pink-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                    className="w-2 h-2 bg-pink-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                    className="w-2 h-2 bg-pink-400 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}

          {messages.length > 0 && messages[messages.length - 1].role === 'bot' && !sending && (
            <div className="flex flex-wrap gap-2 pl-11">
              {quickActions.slice(0, 3).map((qa, i) => (
                <button key={i} onClick={() => send(qa.message)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs hover:border-pink-300 hover:text-pink-600 transition-all flex items-center gap-1">
                  {qa.label} <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEnd} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about skincare, ingredients, routines..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={sending} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => send()}
            disabled={!input.trim() || sending}
            className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-white hover:bg-pink-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
