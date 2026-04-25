// CosmoGov - Centralized Category System
// Unified governance categories across all platform features
// Used by: Proposals, Initiatives, Participatory Processes, Explore, Budget

import {
  Heart,
  TreePine,
  Landmark,
  Wallet,
  Building2,
  GraduationCap,
  Stethoscope,
  Palette,
  Cpu,
  ShieldCheck,
  FileText,
  Users,
} from 'lucide-react';

export interface GovernanceCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;           // Tailwind text color
  bgColor: string;         // Tailwind bg color
  borderColor: string;     // Tailwind border color
  glowClass?: string;      // Optional glow effect
}

/**
 * The 10 core governance categories for CosmoGov.
 * These provide a consistent taxonomy across all participation features,
 * making it easy for citizens to discover, filter, and engage with
 * topics that matter to them.
 */
export const GOVERNANCE_CATEGORIES: GovernanceCategory[] = [
  {
    id: 'social',
    label: 'Social',
    description: 'Community welfare, housing, equality, and social services',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    borderColor: 'border-pink-400/20',
  },
  {
    id: 'environment',
    label: 'Environmental',
    description: 'Climate action, sustainability, green spaces, and pollution',
    icon: TreePine,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
  },
  {
    id: 'political',
    label: 'Political',
    description: 'Governance reform, transparency, voting rights, and institutional change',
    icon: Landmark,
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    borderColor: 'border-violet-400/20',
  },
  {
    id: 'economic',
    label: 'Economic',
    description: 'Budget, taxation, economic development, and employment',
    icon: Wallet,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Urban planning, transportation, utilities, and public works',
    icon: Building2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/20',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Schools, training, research, and digital literacy',
    icon: GraduationCap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    id: 'health',
    label: 'Health',
    description: 'Healthcare, mental health, public health, and safety',
    icon: Stethoscope,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/20',
  },
  {
    id: 'culture',
    label: 'Culture',
    description: 'Arts, heritage, sports, recreation, and creative expression',
    icon: Palette,
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-400/10',
    borderColor: 'border-fuchsia-400/20',
  },
  {
    id: 'technology',
    label: 'Technology',
    description: 'Digital services, innovation, open data, and connectivity',
    icon: Cpu,
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    borderColor: 'border-teal-400/20',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Public safety, emergency services, justice, and defense',
    icon: ShieldCheck,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
  },
];

/** Map for quick lookup by ID */
export const CATEGORY_MAP: Record<string, GovernanceCategory> = Object.fromEntries(
  GOVERNANCE_CATEGORIES.map(c => [c.id, c])
);

/** Fallback for unknown categories */
export const DEFAULT_CATEGORY: GovernanceCategory = {
  id: 'general',
  label: 'General',
  description: 'General governance topics',
  icon: FileText,
  color: 'text-cosmic-muted',
  bgColor: 'bg-white/5',
  borderColor: 'border-white/10',
};

/**
 * Get category config by ID, with fallback to DEFAULT_CATEGORY
 */
export function getCategory(id: string | null | undefined): GovernanceCategory {
  if (!id) return DEFAULT_CATEGORY;
  return CATEGORY_MAP[id] || DEFAULT_CATEGORY;
}

/**
 * Legacy category mapping — maps old category IDs to new unified categories.
 * This ensures backward compatibility with existing seed data.
 */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  // Old proposal categories → new
  governance: 'political',
  finance: 'economic',
  operations: 'infrastructure',
  community: 'social',
  policy: 'political',
  engagement: 'social',

  // Old participatory process categories → new
  urban_planning: 'infrastructure',
  budget: 'economic',

  // Old process proposal categories → new
  culture: 'culture',
  health: 'health',
  technology: 'technology',
  environment: 'environment',
  social: 'social',
  infrastructure: 'infrastructure',
};

/**
 * Resolve a category ID (possibly legacy) to the new unified ID
 */
export function resolveCategory(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_CATEGORY.id;
  // If it's already a new category ID, return as-is
  if (CATEGORY_MAP[raw]) return raw;
  // Try legacy mapping
  return LEGACY_CATEGORY_MAP[raw] || raw;
}

/**
 * Category group definitions for the "Browse by Aspect" UI pattern.
 * Groups related categories together for a cleaner navigation experience.
 */
export interface CategoryGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  categoryIds: string[];
  description: string;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'people',
    label: 'People & Society',
    icon: Users,
    categoryIds: ['social', 'education', 'health', 'culture'],
    description: 'Welfare, learning, well-being, and creative life',
  },
  {
    id: 'planet',
    label: 'Planet & Place',
    icon: TreePine,
    categoryIds: ['environment', 'infrastructure', 'security'],
    description: 'Environment, built spaces, and public safety',
  },
  {
    id: 'power',
    label: 'Power & Economy',
    icon: Landmark,
    categoryIds: ['political', 'economic', 'technology'],
    description: 'Governance, budgets, and digital innovation',
  },
];
