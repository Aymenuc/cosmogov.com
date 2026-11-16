'use client';

import { useState, useRef, useEffect } from 'react';
import WorkspaceHeading from '@/components/WorkspaceHeading';
import { AI_LIMITS } from '@/lib/ai-limits';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Send, Loader2, FileText, MessageSquare, Sparkles,
  Copy, Check, BarChart3, Target, Lightbulb, RotateCcw,
  Zap, Trash2
} from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: number; isError?: boolean; }

const DAILY_QUESTIONS = AI_LIMITS.assistant.day;

const modes = [
  { id: 'chat', name: 'Chat', icon: MessageSquare, desc: 'Questions about taking part', color: 'cosmic-accent' },
  { id: 'proposal_draft', name: 'Proposal draft', icon: FileText, desc: 'Help drafting a proposal', color: 'cosmic-teal' },
  { id: 'analysis', name: 'Analysis', icon: BarChart3, desc: 'Think through options you describe', color: 'cosmic-violet' },
  { id: 'coaching', name: 'Coaching', icon: Target, desc: 'Tips for fair meetings and decisions', color: 'cosmic-amber' },
];

const suggestions = [
  'Draft a proposal for implementing quadratic voting in our organization',
  'What should we check before putting a budget idea to a vote?',
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
  const [remaining, setRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number>(DAILY_QUESTIONS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Follow the conversation; an empty box stays at the top so its tips read from the start.
    if (messages.length) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
          // Only recent turns: the helper has a short memory on purpose.
          messages: [...messages, userMsg].filter(m => !m.isError).slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: Date.now() }]);
        if (typeof data.remainingToday === 'number') setRemaining(data.remainingToday);
        if (typeof data.dailyLimit === 'number') setDailyLimit(data.dailyLimit);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'I couldn\'t generate a response. Please try again.', timestamp: Date.now(), isError: true }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection and try again.', timestamp: Date.now(), isError: true }]);
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
    <div>
      <WorkspaceHeading
        look="assistant"
        title="AI assistant"
        description="Ask about a community matter, get help drafting a proposal, or think through options you describe."
      >
        {messages.length > 0 && (
          <button type="button" className="civic-button outline" onClick={clearChat}>
            <Trash2 size={14} aria-hidden="true" /> Clear the conversation
          </button>
        )}
      </WorkspaceHeading>
      <div className="max-w-3xl mx-auto flex flex-col mt-5">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" role="group" aria-label="What kind of help">
        {modes.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            title={m.desc}
            className={`assistant-mode${mode === m.id ? ' is-active' : ''}`}
          >
            <m.icon className="w-3.5 h-3.5" aria-hidden="true" />
            {m.name}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <Card className="bg-card border-border mb-4 overflow-hidden assistant-chat">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cosmic-teal opacity-70" />
              </div>
              <h3 className="text-lg font-semibold font-heading mb-1">Your AI helper</h3>
              <p className="text-sm text-cosmic-muted mb-2">Mode: <span className="text-cosmic-teal">{currentMode.desc}</span></p>
              <p className="text-xs text-cosmic-muted mb-6">Answers come from an AI. It can’t see votes or private data, and it can be wrong, so check facts before you rely on them.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {suggestions.map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-xs bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border hover:border-border rounded-xl px-3 py-2.5 text-cosmic-muted hover:text-foreground transition-all text-left">
                    <Lightbulb className="w-3 h-3 text-cosmic-amber inline mr-1.5" />{q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div className={`max-w-[85%] rounded-xl p-4 ${msg.role === 'user' ? 'bg-cosmic-accent/10 border border-cosmic-accent/20' : 'bg-foreground/[0.03] border border-border'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3 h-3 text-cosmic-teal" />
                    <span className="text-[10px] text-cosmic-teal font-medium">AI helper</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                    <button onClick={() => handleCopy(i, msg.content)} className="text-xs text-cosmic-muted hover:text-foreground transition-colors">
                      {copied === i ? <><Check className="w-3 h-3 inline mr-1" />Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start" style={{ animation: 'slideUp 0.3s ease-out' }}>
              <div className="bg-foreground/[0.03] border border-border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-cosmic-muted" role="status">Thinking…</span>
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
            placeholder={mode === 'chat' ? 'Ask about a community matter...' : mode === 'proposal_draft' ? 'Describe the proposal you want to create...' : mode === 'analysis' ? 'Describe the options your community is weighing...' : 'Ask about running a fair meeting...'}
            maxLength={1500}
            aria-label="Your question"
            className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 resize-none pr-10"
            rows={2}
          />
        </div>
        <Button onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send"
          className="bg-cosmic-accent text-primary-foreground self-end rounded-xl h-10 w-10 p-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-cosmic-muted">
        For community matters only, up to {dailyLimit} questions a day
        {remaining !== null ? ` · ${remaining} left today` : ''}.
      </p>
      </div>
    </div>
  );
}
