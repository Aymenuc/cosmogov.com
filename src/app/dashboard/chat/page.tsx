'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare, Plus, Hash, Users, Send, Smile, ChevronDown,
  Circle, Search, X, Loader2, Globe, Lock, Megaphone,
  Lightbulb, Gamepad2, HeartHandshake, Scale, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────
interface ChatRoomType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  type: string;
  createdBy: string;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  _count: { messages: number; members: number };
}

interface ChatMessageType {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: string;
  createdAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null };
}

interface ChatMemberType {
  id: string;
  roomId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null; level: number };
}

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'general', label: 'General', icon: Hash, color: 'cosmic-accent' },
  { id: 'governance', label: 'Governance', icon: Scale, color: 'cosmic-teal' },
  { id: 'games', label: 'Games', icon: Gamepad2, color: 'cosmic-violet' },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, color: 'cosmic-amber' },
  { id: 'support', label: 'Support', icon: HeartHandshake, color: 'cosmic-rose' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, color: 'cosmic-success' },
] as const;

const EMOJI_LIST = [
  '👍', '❤️', '🎉', '🚀', '💡', '✅', '🔥', '👏',
  '😊', '🤔', '👀', '💯', '🎯', '⚡', '🌟', '🏆',
  '🙌', '💪', '🤝', '💎', '🪐', '🌌', '🛸', '✨',
];

// ─── Component ───────────────────────────────────────────────────────
export default function ChatPage() {
  // User
  const [user, setUser] = useState<UserInfo | null>(null);
  // Rooms
  const [rooms, setRooms] = useState<ChatRoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [roomMembers, setRoomMembers] = useState<ChatMemberType[]>([]);
  // Messages
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [messageInput, setMessageInput] = useState('');
  // Real-time
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
  // UI
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  // ─── Fetch user ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data); })
      .catch(() => {});
  }, []);

  // ─── Fetch rooms ─────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ─── Socket.io connection ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const socketInstance = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log('[Chat] Socket connected');
      socketInstance.emit('auth', { userId: user.id, userName: user.name || 'User' });

      // Re-join current room if any
      if (selectedRoom) {
        socketInstance.emit('room:join', {
          roomId: selectedRoom.id,
          userId: user.id,
          userName: user.name || 'User',
        });
      }
    });

    socketInstance.on('room:message', (msg: ChatMessageType) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socketInstance.on('room:online', (data: { roomId: string; userIds: string[] }) => {
      if (selectedRoom && data.roomId === selectedRoom.id) {
        setOnlineUsers(data.userIds);
      }
    });

    socketInstance.on('room:typing', (data: { roomId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (selectedRoom && data.roomId === selectedRoom.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            if (prev.some(t => t.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, userName: data.userName }];
          } else {
            return prev.filter(t => t.userId !== data.userId);
          }
        });
      }
    });

    socketInstance.on('room:user-joined', (data: { roomId: string; userId: string; userName: string }) => {
      if (selectedRoom && data.roomId === selectedRoom.id) {
        // Add system message
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          roomId: data.roomId,
          userId: 'system',
          content: `${data.userName} joined the room`,
          type: 'system',
          createdAt: new Date().toISOString(),
          user: { id: 'system', name: 'System', avatarUrl: null },
        }]);
      }
    });

    socketInstance.on('room:user-left', (data: { roomId: string; userId: string }) => {
      if (selectedRoom && data.roomId === selectedRoom.id) {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // ─── Select room ─────────────────────────────────────────────────
  const selectRoom = useCallback(async (room: ChatRoomType) => {
    // Leave previous room
    if (selectedRoom && socket && user) {
      socket.emit('room:leave', { roomId: selectedRoom.id, userId: user.id });
    }

    setSelectedRoom(room);
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);

    // Join new room via socket
    if (socket && user) {
      socket.emit('room:join', {
        roomId: room.id,
        userId: user.id,
        userName: user.name || 'User',
      });
    }

    // Fetch room details with messages
    try {
      const res = await fetch(`/api/chat/rooms/${room.slug}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setRoomMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch room details:', err);
    }
  }, [selectedRoom, socket, user]);

  // ─── Auto-scroll to bottom ───────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedRoom || !user) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSendingMessage(true);

    // Emit via socket for real-time
    if (socket) {
      socket.emit('room:message', {
        roomId: selectedRoom.id,
        userId: user.id,
        content,
        type: 'text',
      });
    }

    // Also POST to API as fallback persistence (socket service already persists)
    // We'll rely on socket for persistence, but use REST as fallback
    try {
      await fetch(`/api/chat/rooms/${selectedRoom.slug}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'text' }),
      });
    } catch (err) {
      console.error('Failed to send message via REST:', err);
    }

    setSendingMessage(false);
  }, [messageInput, selectedRoom, user, socket]);

  // ─── Typing indicator ────────────────────────────────────────────
  const handleTyping = useCallback((value: string) => {
    setMessageInput(value);
    if (!socket || !selectedRoom || !user) return;

    socket.emit('room:typing', {
      roomId: selectedRoom.id,
      userId: user.id,
      userName: user.name || 'User',
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('room:typing', {
        roomId: selectedRoom.id,
        userId: user.id,
        userName: user.name || 'User',
        isTyping: false,
      });
    }, 2000);
  }, [socket, selectedRoom, user]);

  // ─── Create room ─────────────────────────────────────────────────
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) return;

    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDesc.trim() || null,
          category: newRoomCategory,
          type: 'public',
        }),
      });

      if (res.ok) {
        const room = await res.json();
        setRooms(prev => [room, ...prev]);
        setShowCreateRoom(false);
        setNewRoomName('');
        setNewRoomDesc('');
        setNewRoomCategory('general');
        selectRoom(room);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  }, [newRoomName, newRoomDesc, newRoomCategory, selectRoom]);

  // ─── Add emoji ──────────────────────────────────────────────────
  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmoji(false);
  };

  // ─── Filter rooms ────────────────────────────────────────────────
  const filteredRooms = rooms.filter(room => {
    const matchesCategory = categoryFilter === 'all' || room.category === categoryFilter;
    const matchesSearch = !searchQuery || room.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ─── Get category config ─────────────────────────────────────────
  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  };

  const getCategoryColor = (category: string) => {
    const config = getCategoryConfig(category);
    return config.color;
  };

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-8rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmic-teal to-cosmic-violet animate-pulse flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-cosmic-muted text-sm">Loading chat rooms...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-8rem)] flex gap-4 -m-4 lg:-m-8 p-4 lg:p-8">
      {/* ─── Left Sidebar: Room List ──────────────────────────────── */}
      <div className="w-72 flex-shrink-0 hidden md:flex flex-col glass-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cosmic-teal/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-cosmic-teal" />
              </div>
              <h2 className="font-heading font-bold text-lg">Chat Rooms</h2>
            </div>
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 w-7 p-0 bg-cosmic-accent/20 text-cosmic-accent hover:bg-cosmic-accent/30 border-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/10">
                <DialogHeader>
                  <DialogTitle className="font-heading">Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-sm text-cosmic-muted">Room Name</Label>
                    <Input
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value)}
                      placeholder="Enter room name..."
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-cosmic-muted">Description</Label>
                    <Textarea
                      value={newRoomDesc}
                      onChange={e => setNewRoomDesc(e.target.value)}
                      placeholder="What's this room about?"
                      className="bg-white/5 border-white/10 text-white mt-1 resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-cosmic-muted">Category</Label>
                    <Select value={newRoomCategory} onValueChange={setNewRoomCategory}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1022] border-white/10">
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <cat.icon className="w-3 h-3" /> {cat.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()} className="w-full bg-cosmic-accent text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-cosmic-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="bg-white/5 border-white/10 text-white text-xs h-8 pl-8"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-cosmic-muted hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1 p-3 overflow-x-auto border-b border-white/5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-cosmic-accent/15 text-cosmic-accent border border-cosmic-accent/30'
                : 'text-cosmic-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                categoryFilter === cat.id
                  ? `bg-${cat.color}/15 text-${cat.color} border border-${cat.color}/30`
                  : 'text-cosmic-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={categoryFilter === cat.id ? {
                background: `color-mix(in srgb, var(--color-${cat.color}) 15%, transparent)`,
                color: `var(--color-${cat.color})`,
                borderColor: `color-mix(in srgb, var(--color-${cat.color}) 30%, transparent)`,
              } : {}}
            >
              <cat.icon className="w-2.5 h-2.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Room List */}
        <ScrollArea className="flex-grow">
          <div className="p-2 space-y-0.5">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-sm text-cosmic-muted">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No rooms found</p>
                <p className="text-xs mt-1">Create one to get started!</p>
              </div>
            ) : (
              filteredRooms.map(room => {
                const isActive = selectedRoom?.id === room.id;
                const catConfig = getCategoryConfig(room.category);
                return (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`w-full text-left p-3 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-cosmic-accent/10 border border-cosmic-accent/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <catConfig.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: `var(--color-${catConfig.color})` }} />
                      <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-cosmic-muted group-hover:text-white'}`}>
                        {room.name}
                      </span>
                      {room.type === 'private' && <Lock className="w-3 h-3 text-cosmic-amber flex-shrink-0" />}
                    </div>
                    {room.description && (
                      <p className="text-[10px] text-cosmic-muted truncate ml-5.5">{room.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 ml-5.5">
                      <span className="text-[10px] text-cosmic-muted flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" /> {room._count.members}
                      </span>
                      <span className="text-[10px] text-cosmic-muted flex items-center gap-0.5">
                        <MessageSquare className="w-2.5 h-2.5" /> {room._count.messages}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ─── Center: Chat Area ────────────────────────────────────── */}
      <div className="flex-grow flex flex-col min-w-0">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="glass-card p-3 mb-3 flex items-center justify-between rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile room list toggle */}
                <MobileRoomList
                  rooms={rooms}
                  selectedRoom={selectedRoom}
                  onSelectRoom={selectRoom}
                  user={user}
                  onCreated={fetchRooms}
                />
                {(() => {
                  const catConfig = getCategoryConfig(selectedRoom.category);
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, var(--color-${catConfig.color}) 15%, transparent)` }}>
                        <catConfig.icon className="w-4 h-4" style={{ color: `var(--color-${catConfig.color})` }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-sm truncate">{selectedRoom.name}</h3>
                          {selectedRoom.type === 'private' ? (
                            <Lock className="w-3 h-3 text-cosmic-amber" />
                          ) : (
                            <Globe className="w-3 h-3 text-cosmic-muted" />
                          )}
                        </div>
                        <p className="text-[10px] text-cosmic-muted truncate">
                          {selectedRoom.description || `${selectedRoom._count.members} members · ${selectedRoom._count.messages} messages`}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-cosmic-teal/30 text-cosmic-teal bg-cosmic-teal/5">
                  <Circle className="w-1.5 h-1.5 mr-1 fill-cosmic-teal text-cosmic-teal" />
                  {onlineUsers.length} online
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden h-7 w-7 p-0 text-cosmic-muted"
                  onClick={() => setShowMobileMembers(!showMobileMembers)}
                >
                  <Users className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="glass-card flex-grow overflow-hidden mb-3 flex flex-col rounded-xl">
              <div ref={messagesScrollRef} className="flex-grow overflow-y-auto p-4 space-y-1">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Sparkles className="w-10 h-10 text-cosmic-teal/30 mx-auto mb-3" />
                      <h3 className="font-heading font-bold text-lg mb-1">Welcome to {selectedRoom.name}</h3>
                      <p className="text-sm text-cosmic-muted">Be the first to send a message!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.userId === user?.id;
                    const isSystem = msg.type === 'system';
                    const showAvatar = idx === 0 || messages[idx - 1]?.userId !== msg.userId;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center py-2">
                          <span className="text-[10px] text-cosmic-muted bg-white/5 px-3 py-1 rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {showAvatar ? (
                          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                            style={{
                              background: isOwn
                                ? 'linear-gradient(135deg, #2D6BFF, #9B5CFF)'
                                : 'linear-gradient(135deg, #2EE6C7, #5B8FFF)',
                            }}
                          >
                            {(msg.user?.name || 'U')[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-7 flex-shrink-0" />
                        )}
                        <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          {showAvatar && (
                            <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] font-medium text-cosmic-muted">
                                {msg.user?.name || 'Unknown'}
                              </span>
                              <span className="text-[9px] text-cosmic-muted/50">
                                {format(new Date(msg.createdAt), 'HH:mm')}
                              </span>
                            </div>
                          )}
                          <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-cosmic-accent/15 border border-cosmic-accent/20 text-white'
                              : 'bg-white/5 border border-white/5 text-cosmic-text'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] text-cosmic-muted">
                      {typingUsers.length === 1
                        ? `${typingUsers[0].userName} is typing...`
                        : `${typingUsers.length} people are typing...`}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="glass-card p-3 rounded-xl">
              <div className="flex items-end gap-2">
                {/* Emoji Button */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-cosmic-muted hover:text-cosmic-amber"
                    onClick={() => setShowEmoji(!showEmoji)}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                  {showEmoji && (
                    <div className="absolute bottom-full left-0 mb-2 glass-card p-2 rounded-xl w-64 z-50" style={{ animation: 'scaleIn 0.15s ease-out' }}>
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-grow relative">
                  <Input
                    value={messageInput}
                    onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    className="bg-white/5 border-white/10 text-white text-sm h-9"
                    disabled={sendingMessage}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="h-9 w-9 p-0 bg-cosmic-accent text-white hover:bg-cosmic-accent/80 rounded-lg"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full glass-card rounded-xl">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-cosmic-teal/50" />
              </div>
              <h3 className="font-heading font-bold text-xl mb-2">Select a Chat Room</h3>
              <p className="text-sm text-cosmic-muted mb-4 max-w-sm">
                Choose a room from the sidebar to start chatting with the community
              </p>
              {/* Mobile room selector */}
              <MobileRoomList
                rooms={rooms}
                selectedRoom={selectedRoom}
                onSelectRoom={selectRoom}
                user={user}
                onCreated={fetchRooms}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Right Sidebar: Members ──────────────────────────────── */}
      <div className={`w-64 flex-shrink-0 hidden lg:flex flex-col glass-card overflow-hidden rounded-xl ${showMobileMembers ? '!flex fixed right-4 top-20 z-50 w-72' : ''}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm">Members</h3>
            <Badge variant="outline" className="text-[10px] border-white/10 text-cosmic-muted bg-white/5">
              {roomMembers.length}
            </Badge>
          </div>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-2 space-y-0.5">
            {roomMembers.length === 0 ? (
              <div className="text-center py-6 text-xs text-cosmic-muted">
                <Users className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No members yet
              </div>
            ) : (
              roomMembers
                .sort((a, b) => {
                  const aOnline = onlineUsers.includes(a.userId) ? 0 : 1;
                  const bOnline = onlineUsers.includes(b.userId) ? 0 : 1;
                  return aOnline - bOnline || a.role.localeCompare(b.role);
                })
                .map(member => {
                  const isOnline = onlineUsers.includes(member.userId);
                  return (
                    <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: isOnline
                              ? 'linear-gradient(135deg, #2EE6C7, #5B8FFF)'
                              : 'linear-gradient(135deg, #374151, #4B5563)',
                          }}
                        >
                          {(member.user?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B1022] ${
                          isOnline ? 'bg-cosmic-teal' : 'bg-gray-600'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${isOnline ? 'text-white' : 'text-cosmic-muted'}`}>
                          {member.user?.name || 'Unknown'}
                        </p>
                        <p className="text-[9px] text-cosmic-muted">
                          {member.role === 'admin' ? '👑 Admin' : member.role === 'moderator' ? '🛡️ Mod' : `Lv.${member.user?.level || 1}`}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Mobile Room List Component ──────────────────────────────────────
function MobileRoomList({
  rooms,
  selectedRoom,
  onSelectRoom,
  user,
  onCreated,
}: {
  rooms: ChatRoomType[];
  selectedRoom: ChatRoomType | null;
  onSelectRoom: (room: ChatRoomType) => void;
  user: UserInfo | null;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('general');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null, category: newCat, type: 'public' }),
      });
      if (res.ok) {
        onCreated();
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
        setNewCat('general');
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <div className="md:hidden">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}
        className="border-white/10 bg-white/5 text-cosmic-muted">
        <Hash className="w-3 h-3 mr-1" />
        {selectedRoom?.name || 'Rooms'}
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-[#04050b]/95 backdrop-blur-xl p-4 pt-16 overflow-y-auto" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Chat Rooms</h2>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-cosmic-muted">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full mb-4 border-dashed border-white/10 text-cosmic-muted"
            onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" /> Create Room
          </Button>
          {showCreate && (
            <div className="glass-card p-4 mb-4 space-y-3">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Room name..." className="bg-white/5 border-white/10 text-white" />
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." className="bg-white/5 border-white/10 text-white resize-none" rows={2} />
              <Select value={newCat} onValueChange={setNewCat}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0B1022] border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2"><cat.icon className="w-3 h-3" /> {cat.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} disabled={!newName.trim()} className="w-full bg-cosmic-accent text-white">
                Create
              </Button>
            </div>
          )}
          <div className="space-y-1">
            {rooms.map(room => {
              const catConfig = getCategoryConfig(room.category);
              return (
                <button
                  key={room.id}
                  onClick={() => { onSelectRoom(room); setOpen(false); }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedRoom?.id === room.id ? 'bg-cosmic-accent/10 border border-cosmic-accent/20' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <catConfig.icon className="w-4 h-4" style={{ color: `var(--color-${catConfig.color})` }} />
                    <span className="text-sm font-medium">{room.name}</span>
                    <span className="text-[10px] text-cosmic-muted ml-auto">
                      <Users className="w-3 h-3 inline" /> {room._count.members}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
