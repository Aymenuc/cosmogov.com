'use client';

import Link from 'next/link';
import { Rocket, Key, FileText, Users, Globe, MessageSquare, BookOpen } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const apiSections = [
  {
    icon: Key,
    title: 'Authentication',
    accent: '#2EE6C7',
    description: 'All API requests require authentication via Bearer token. Obtain your API key from the CosmoGov dashboard under Settings → API Keys. Tokens expire after 30 days and can be revoked at any time. Include the token in the Authorization header of every request.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate a user and receive an access token',
        example: `curl -X POST https://api.cosmogov.io/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "*****"}'`,
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        description: 'Retrieve the authenticated user\'s profile and organization memberships',
        example: `curl https://api.cosmogov.io/api/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
    ],
  },
  {
    icon: FileText,
    title: 'Proposals API',
    accent: '#9B5CFF',
    description: 'Create, read, update, and manage governance proposals. Proposals support three voting modes: direct democracy, council vote, and ranked choice. Each proposal can have comments, endorsements, and AI-generated impact assessments.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/proposals',
        description: 'List all proposals for the authenticated user\'s organizations',
        example: `curl https://api.cosmogov.io/api/proposals?status=active&limit=20 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'POST',
        path: '/api/proposals',
        description: 'Create a new governance proposal with specified voting mode',
        example: `curl -X POST https://api.cosmogov.io/api/proposals \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Community Budget Allocation Q3",
    "description": "Proposal to allocate Q3 budget...",
    "votingMode": "ranked_choice",
    "organizationId": "org_abc123",
    "options": ["Option A", "Option B", "Option C"]
  }'`,
      },
      {
        method: 'POST',
        path: '/api/proposals/:id/vote',
        description: 'Cast a vote on an active proposal',
        example: `curl -X POST https://api.cosmogov.io/api/proposals/proposal_xyz/vote \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"choice": "Option A", "rankings": ["A", "B", "C"]}'`,
      },
    ],
  },
  {
    icon: Users,
    title: 'Participation API',
    accent: '#FFB547',
    description: 'Access e-Participation features including processes, assemblies, initiatives, and budgeting. Track citizen engagement, manage participation milestones, and retrieve accountability data for implemented decisions.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/participation/processes',
        description: 'List all participatory processes across organizations',
        example: `curl https://api.cosmogov.io/api/participation/processes?phase=deliberation \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'POST',
        path: '/api/participation/initiatives/:id/sign',
        description: 'Sign a citizen initiative to show support',
        example: `curl -X POST https://api.cosmogov.io/api/participation/initiatives/init_abc/sign \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"comment": "I support this initiative because..."}'`,
      },
    ],
  },
  {
    icon: Globe,
    title: 'Geo API',
    accent: '#2D6BFF',
    description: 'Manage geographic data for location-based governance features. Set user locations, retrieve map data, and access location-specific activities for participatory budgeting and local decision-making.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/geo/set-location',
        description: 'Set the authenticated user\'s geographic location',
        example: `curl -X POST https://api.cosmogov.io/api/geo/set-location \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"latitude": 37.7749, "longitude": -122.4194, "city": "San Francisco"}'`,
      },
      {
        method: 'GET',
        path: '/api/geo/map-data',
        description: 'Retrieve geo-aggregated data for the interactive map view',
        example: `curl https://api.cosmogov.io/api/geo/map-data?bounds=37.7,-122.5,37.8,-122.3 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
    ],
  },
  {
    icon: MessageSquare,
    title: 'Chat API',
    accent: '#FF5E8A',
    description: 'Access CosmoGov\'s real-time chat system for community discussions. Create chat rooms, send messages, and manage community conversations. Supports both public channels and private group discussions within organizations.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/chat/rooms',
        description: 'List all chat rooms accessible to the authenticated user',
        example: `curl https://api.cosmogov.io/api/chat/rooms?organizationId=org_abc123 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
      {
        method: 'GET',
        path: '/api/chat/rooms/:slug/messages',
        description: 'Retrieve message history for a specific chat room',
        example: `curl https://api.cosmogov.io/api/chat/rooms/general/messages?limit=50&before=2026-04-01 \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
      },
    ],
  },
];

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#04050b]">
      <Starfield />
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg">CosmoGov</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-cosmic-muted hover:text-white transition-colors">Log in</Link>
          <Link href="/auth/signup" className="text-sm bg-cosmic-accent text-white px-4 py-1.5 rounded-lg hover:bg-cosmic-accent/90 transition-colors">Sign up free</Link>
        </div>
      </nav>

      <main className="relative z-10 flex-grow max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Developer Docs</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            API <span className="text-gradient">Reference</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Integrate CosmoGov into your applications with our RESTful API. All endpoints return JSON and require Bearer token authentication. Base URL: <code className="text-cosmic-teal text-sm">https://api.cosmogov.io</code>
          </p>
        </div>

        <div className="space-y-10">
          {apiSections.map((section) => (
            <section key={section.title}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${section.accent}15` }}
                >
                  <section.icon className="w-5 h-5" style={{ color: section.accent }} />
                </div>
                <h2 className="text-2xl font-bold text-white font-heading">{section.title}</h2>
              </div>
              <p className="text-cosmic-muted text-sm leading-relaxed mb-6">{section.description}</p>
              <div className="space-y-4">
                {section.endpoints.map((endpoint) => (
                  <div key={endpoint.path} className="glass-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <span
                        className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md font-mono"
                        style={{
                          background: endpoint.method === 'GET' ? 'rgba(46,230,199,0.1)' : endpoint.method === 'POST' ? 'rgba(155,92,255,0.1)' : 'rgba(45,107,255,0.1)',
                          color: endpoint.method === 'GET' ? '#2EE6C7' : endpoint.method === 'POST' ? '#9B5CFF' : '#2D6BFF',
                        }}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-cosmic-text font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-cosmic-muted text-sm mb-4">{endpoint.description}</p>
                    <div className="bg-[#04050b]/60 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-xs text-cosmic-muted font-mono leading-relaxed whitespace-pre-wrap">{endpoint.example}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
