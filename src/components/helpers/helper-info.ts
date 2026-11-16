import { BookOpen, Handshake, Languages, Lightbulb, ListChecks, Shield, type LucideIcon } from 'lucide-react';
import type { HelperType } from '@/lib/helper-languages';

export interface HelperInfo {
  name: string;
  /** Two or three words: what it's for. */
  role: string;
  icon: LucideIcon;
  /** Badge fill, from the house tints. */
  bg: string;
  /** In a debate: the button, and what it will do. */
  ask: string;
  askHint: string;
  /** On the helpers page: try it on your own text. */
  tryLabel: string;
  tryHint: string;
  placeholder: string;
}

export const HELPER_INFO: Record<HelperType, HelperInfo> = {
  summarizer: {
    name: 'Synthesis',
    role: 'Sums up',
    icon: ListChecks,
    bg: '#e1f3ff',
    ask: 'Sum up so far',
    askHint: 'The main views, where people agree, and what is still open.',
    tryLabel: 'Sum up a discussion',
    tryHint: 'Paste comments or a thread. You get the main views, where people agree and what’s left open.',
    placeholder: 'Paste the comments or discussion…',
  },
  consensus: {
    name: 'Concord',
    role: 'Finds common ground',
    icon: Handshake,
    bg: '#dff5e8',
    ask: 'Find common ground',
    askHint: 'Where people already agree, and small next steps.',
    tryLabel: 'Find common ground',
    tryHint: 'Paste two or more views. You get what they share and a few next steps worth trying.',
    placeholder: 'Paste the different views…',
  },
  facilitator: {
    name: 'Lumen',
    role: 'Explains',
    icon: Lightbulb,
    bg: '#fff0c3',
    ask: 'Explain it simply',
    askHint: 'What this is about so far, for someone just arriving.',
    tryLabel: 'Explain a notice',
    tryHint: 'Paste a notice, plan or topic. You get it in plain words, with good questions to ask.',
    placeholder: 'Paste the notice, plan or topic…',
  },
  moderator: {
    name: 'Nexus',
    role: 'Keeps it fair',
    icon: Shield,
    bg: '#eee6ff',
    ask: 'Check the tone',
    askHint: 'Is it on topic, calm and fair to everyone?',
    tryLabel: 'Check my message',
    tryHint: 'Paste a message before you post it. If it could land badly, you get a calmer version that keeps your point.',
    placeholder: 'Paste the message you want to post…',
  },
  accessibility: {
    name: 'Aegis',
    role: 'Plain language',
    icon: BookOpen,
    bg: '#ffe1ea',
    ask: 'Make it simpler',
    askHint: 'The latest messages in plain, simple words.',
    tryLabel: 'Make it easier to read',
    tryHint: 'Paste any community text. You get it in plain, simple language.',
    placeholder: 'Paste the text…',
  },
  translator: {
    name: 'Babel',
    role: 'Translates',
    icon: Languages,
    bg: '#ffe4d6',
    ask: 'Translate',
    askHint: 'The latest messages, in the language you pick.',
    tryLabel: 'Translate',
    tryHint: 'Paste community text and pick a language.',
    placeholder: 'Paste the text to translate…',
  },
};
