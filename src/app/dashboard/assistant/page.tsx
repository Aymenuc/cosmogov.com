'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Send, Loader2, FileText, MessageSquare, Sparkles,
  Copy, Check, BarChart3, Target, Lightbulb, RotateCcw,
  Zap, Trash2
} from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: number; }

const modes = [
  { id: 'chat', name: 'Chat', icon: MessageSquare, desc: 'General governance Q&A', color: 'cosmic-accent' },
  { id: 'proposal_draft', name: 'Proposal Draft', icon: FileText, desc: 'Generate governance proposals', color: 'cosmic-teal' },
  { id: 'analysis', name: 'Analysis', icon: BarChart3, desc: 'Analyze voting patterns & outcomes', color: 'cosmic-violet' },
  { id: 'coaching', name: 'Coaching', icon: Target, desc: 'Decision-making & leadership tips', color: 'cosmic-amber' },
];

const suggestions = [
  'Draft a proposal for implementing quadratic voting in our organization',
  'Analyze the potential biases in our recent budget allocation vote',
  'What are the best practices for running effective governance meetings?',
  'Help me identify cognitive biases that could affect our upcoming decision',
  'Generate a risk assessment for our new policy proposal',
  'How can we increase voter participation in our organization?',
];

export default function AssistantPage() {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: Date.now() }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, I couldn\'t generate a response. Please try again.', timestamp: Date.now() }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection and try again.', timestamp: Date.now() }]);
    }
    setLoading(false);
  };

  const handleCopy = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const currentMode = modes.find(m => m.id === mode)!;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cosmic-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">AI Assistant</h1>
            <p className="text-xs text-cosmic-teal">Powered by CosmoGov AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-cosmic-rose" onClick={clearChat}>
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              mode === m.id
                ? `border-${m.color}/30 bg-${m.color}/10 text-${m.color}`
                : 'border-white/5 text-cosmic-muted hover:text-white hover:border-white/10'
            }`}
            style={mode === m.id ? { borderColor: `var(--color-${m.color})30`, background: `var(--color-${m.color})15`, color: `var(--color-${m.color})` } : {}}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.name}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <Card className="bg-[#0B1022] border-white/5 flex-grow mb-4 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cosmic-teal opacity-70" />
              </div>
              <h3 className="text-lg font-semibold font-heading mb-1">CosmoGov AI Assistant</h3>
              <p className="text-sm text-cosmic-muted mb-6">Mode: <span className="text-cosmic-teal">{currentMode.desc}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {suggestions.map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-xs bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-cosmic-muted hover:text-white transition-all text-left">
                    <Lightbulb className="w-3 h-3 text-cosmic-amber inline mr-1.5" />{q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div className={`max-w-[85%] rounded-xl p-4 ${msg.role === 'user' ? 'bg-cosmic-accent/10 border border-cosmic-accent/20' : 'bg-white/[0.03] border border-white/5'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3 h-3 text-cosmic-teal" />
                    <span className="text-[10px] text-cosmic-teal font-medium">CosmoGov AI</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    <button onClick={() => handleCopy(i, msg.content)} className="text-xs text-cosmic-muted hover:text-white transition-colors">
                      {copied === i ? <><Check className="w-3 h-3 inline mr-1" />Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-cosmic-muted">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Input Area */}
      <div className="flex gap-2">
        <div className="flex-grow relative">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={mode === 'chat' ? 'Ask about governance...' : mode === 'proposal_draft' ? 'Describe the proposal you want to create...' : mode === 'analysis' ? 'Ask me to analyze voting data...' : 'Ask for governance coaching...'}
            className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 resize-none pr-10"
            rows={2}
          />
        </div>
        <Button onClick={handleSend} disabled={!input.trim() || loading}
          className="bg-cosmic-accent text-white self-end rounded-xl h-10 w-10 p-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
