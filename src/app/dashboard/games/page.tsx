'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Eye, Search, AlertTriangle, Shield, Clock, Zap,
  ArrowRight, Gamepad2, Sparkles, Filter, Users, Baby,
  GraduationCap, Briefcase, Heart, Trophy, Flame, Star,
  ChevronDown, TrendingUp
} from 'lucide-react';

interface GameResult {
  gameSlug: string;
  score: number;
  xpEarned: number;
  accuracy: number;
}

const categories = [
  { id: 'all', name: 'All Games', icon: Gamepad2, color: '#2D6BFF' },
  { id: 'cognitive', name: 'Cognitive Training', icon: Brain, color: '#2EE6C7', desc: 'Sharpen reasoning and analytical skills' },
  { id: 'strategic', name: 'Strategic Thinking', icon: Shield, color: '#9B5CFF', desc: 'Master high-stakes decision-making' },
  { id: 'analytical', name: 'Data Analysis', icon: Search, color: '#FFB547', desc: 'Detect patterns and anomalies' },
  { id: 'social', name: 'Social Dynamics', icon: Users, color: '#FF5E8A', desc: 'Understand collective behavior' },
];

const ageGroups = [
  { id: 'all', name: 'All Ages', icon: Users, minAge: 0 },
  { id: 'youth', name: 'Youth (13-17)', icon: Baby, minAge: 13 },
  { id: 'young_adult', name: 'Young Adult (18-25)', icon: GraduationCap, minAge: 18 },
  { id: 'adult', name: 'Adult (26-55)', icon: Briefcase, minAge: 26 },
  { id: 'senior', name: 'Senior (55+)', icon: Heart, minAge: 55 },
];

const interestTags = [
  'Governance', 'Democracy', 'Data Science', 'Psychology',
  'Strategy', 'Leadership', 'Ethics', 'Finance',
  'Community', 'Technology', 'Policy', 'Logic'
];

const games = [
  {
    id: 'neural-consensus', name: 'Neural Consensus', tagline: 'Converge with the collective mind',
    icon: Brain, accent: '#2EE6C7', accentBg: 'rgba(46,230,199,0.1)', accentBorder: 'rgba(46,230,199,0.15)',
    desc: 'Pick an option. The more minds that align, the greater the reward. Pure coordination where collective intelligence emerges from individual choices.',
    xp: '50-200 XP', difficulty: 'Medium', category: 'cognitive', minAge: 13,
    interests: ['Governance', 'Democracy', 'Psychology'],
    animation: 'neural', // type of canvas animation
  },
  {
    id: 'oracle-protocol', name: 'Oracle Protocol', tagline: 'Predict the future of proposals',
    icon: Eye, accent: '#9B5CFF', accentBg: 'rgba(155,92,255,0.1)', accentBorder: 'rgba(155,92,255,0.15)',
    desc: 'Forecast whether proposals pass or fail. Set your confidence. Your Brier score reveals if you truly see the future — or just think you do.',
    xp: '30-250 XP', difficulty: 'Hard', category: 'analytical', minAge: 18,
    interests: ['Data Science', 'Strategy', 'Governance'],
    animation: 'oracle',
  },
  {
    id: 'signal-detective', name: 'Signal Detective', tagline: 'Spot anomalies in the data stream',
    icon: Search, accent: '#FFB547', accentBg: 'rgba(255,181,71,0.1)', accentBorder: 'rgba(255,181,71,0.15)',
    desc: 'Scan vote timelines for manipulation patterns — late clusters, whale flips, bot swarms. Train your eye to catch what others miss.',
    xp: '40-180 XP', difficulty: 'Medium', category: 'analytical', minAge: 13,
    interests: ['Data Science', 'Logic', 'Technology'],
    animation: 'signal',
  },
  {
    id: 'cognitive-warfare', name: 'Cognitive Warfare', tagline: 'Defeat bias with evidence',
    icon: AlertTriangle, accent: '#FF5E8A', accentBg: 'rgba(255,94,138,0.1)', accentBorder: 'rgba(255,94,138,0.15)',
    desc: 'Arguments are enemies. Biases are their armor. Identify the cognitive distortion — sunk cost, anchoring, confirmation bias — and strike with the right evidence.',
    xp: '30-160 XP', difficulty: 'Hard', category: 'cognitive', minAge: 18,
    interests: ['Psychology', 'Ethics', 'Logic'],
    animation: 'cognitive',
  },
  {
    id: 'strategic-command', name: 'Strategic Command', tagline: 'Command high-stakes decisions',
    icon: Shield, accent: '#2EE6C7', accentBg: 'rgba(46,230,199,0.1)', accentBorder: 'rgba(46,230,199,0.15)',
    desc: 'Face critical scenarios with no easy answers. Choose the response pattern evidence supports. History watches. Your confidence calibration determines the reward.',
    xp: '60-220 XP', difficulty: 'Expert', category: 'strategic', minAge: 26,
    interests: ['Strategy', 'Leadership', 'Policy'],
    animation: 'strategic',
  },
  {
    id: 'chrono-autopsy', name: 'Chrono Autopsy', tagline: 'Reverse-engineer failure',
    icon: Clock, accent: '#9B5CFF', accentBg: 'rgba(155,92,255,0.1)', accentBorder: 'rgba(155,92,255,0.15)',
    desc: 'A passed proposal failed. Watch events unfold backwards. Find the moment it all went wrong. The rarer your insight, the greater the reward.',
    xp: '50-200 XP', difficulty: 'Expert', category: 'strategic', minAge: 18,
    interests: ['Governance', 'Strategy', 'Logic'],
    animation: 'chrono',
  },
];

export default function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/games/history')
      .then(r => r.ok ? r.json() : [])
      .then(data => setGameHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredGames = games.filter(g => {
    if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;
    const ageGroup = ageGroups.find(a => a.id === selectedAge);
    if (ageGroup && ageGroup.minAge > 0 && g.minAge > ageGroup.minAge + 20) return false;
    if (selectedInterests.length > 0 && !selectedInterests.some(i => g.interests.includes(i))) return false;
    return true;
  });

  const getHighScore = (gameSlug: string) => {
    const results = gameHistory.filter(r => r.gameSlug === gameSlug || r.gameType === gameSlug.replace(/-/g, '_'));
    if (results.length === 0) return null;
    return Math.max(...results.map(r => r.score));
  };

  const getPlayCount = (gameSlug: string) => {
    return gameHistory.filter(r => r.gameSlug === gameSlug || r.gameType === gameSlug.replace(/-/g, '_')).length;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading mb-1">Governance Games</h1>
        <p className="text-cosmic-muted">Train your decision-making instincts, earn XP, and climb the leaderboards</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cosmic-amber/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cosmic-amber" />
            </div>
            <div>
              <p className="text-lg font-bold font-heading">{gameHistory.reduce((sum, r) => sum + r.xpEarned, 0)} XP</p>
              <p className="text-xs text-cosmic-muted">Total Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-cosmic-teal" />
            </div>
            <div>
              <p className="text-lg font-bold font-heading">{gameHistory.length}</p>
              <p className="text-xs text-cosmic-muted">Games Played</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cosmic-violet/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-cosmic-violet" />
            </div>
            <div>
              <p className="text-lg font-bold font-heading">{gameHistory.length > 0 ? Math.max(...gameHistory.map(r => r.score)) : 0}</p>
              <p className="text-xs text-cosmic-muted">Best Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'border-transparent text-white'
                  : 'border-white/5 bg-transparent text-cosmic-muted hover:text-white hover:border-white/10'
              }`}
              style={selectedCategory === cat.id ? { background: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}30` } : {}}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" className="text-cosmic-muted" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" /> {showFilters ? 'Hide' : 'Show'} Filters
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
        {(selectedAge !== 'all' || selectedInterests.length > 0) && (
          <Button variant="ghost" size="sm" className="text-cosmic-rose" onClick={() => { setSelectedAge('all'); setSelectedInterests([]); }}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="glass-card p-4 mb-6" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="mb-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Baby className="w-4 h-4 text-cosmic-muted" /> Age Group
            </p>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map(ag => (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAge(ag.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedAge === ag.id ? 'border-cosmic-accent/30 bg-cosmic-accent/10 text-cosmic-accent' : 'border-white/5 text-cosmic-muted hover:text-white'
                  }`}
                >
                  {ag.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-cosmic-muted" /> Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {interestTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedInterests.includes(tag) ? 'border-cosmic-teal/30 bg-cosmic-teal/10 text-cosmic-teal' : 'border-white/5 text-cosmic-muted hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map(game => {
          const highScore = getHighScore(game.id);
          const playCount = getPlayCount(game.id);
          const catInfo = categories.find(c => c.id === game.category);

          return (
            <Link key={game.id} href={`/dashboard/games/${game.id}`}>
              <Card className="bg-[#0B1022] border-white/5 hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-full relative overflow-hidden"
                style={{ borderColor: game.accentBorder }}>
                <CardContent className="p-6 relative z-10">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${game.accent}10, transparent 60%)` }} />

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: game.accentBg }}>
                      <game.icon className="w-6 h-6" style={{ color: game.accent }} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs" style={{ color: game.accent }}>
                        <Zap className="w-3 h-3" /> {game.xp}
                      </div>
                      {highScore !== null && (
                        <div className="flex items-center gap-1 text-xs text-cosmic-amber">
                          <Trophy className="w-3 h-3" /> {highScore}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold font-heading mb-1">{game.name}</h3>
                  <p className="text-xs mb-2" style={{ color: game.accent }}>{game.tagline}</p>
                  <p className="text-sm text-cosmic-muted leading-relaxed mb-3 line-clamp-2">{game.desc}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="outline" className="text-[10px] border-white/10 capitalize">
                      {game.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-white/10">
                      Ages {game.minAge}+
                    </Badge>
                    {catInfo && (
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${catInfo.color}30`, color: catInfo.color }}>
                        {catInfo.name}
                      </Badge>
                    )}
                  </div>

                  {/* Interest tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {game.interests.map(i => (
                      <span key={i} className="text-[10px] text-cosmic-muted bg-white/5 px-1.5 py-0.5 rounded">{i}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cosmic-muted">
                      {playCount > 0 ? `Played ${playCount}x` : 'Not yet played'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all" style={{ color: game.accent }}>
                      Play <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16">
          <Gamepad2 className="w-12 h-12 text-cosmic-muted mx-auto mb-3 opacity-30" />
          <p className="text-cosmic-muted">No games match your filters. Try adjusting your selection.</p>
          <Button variant="ghost" className="mt-3 text-cosmic-accent" onClick={() => { setSelectedCategory('all'); setSelectedAge('all'); setSelectedInterests([]); }}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
