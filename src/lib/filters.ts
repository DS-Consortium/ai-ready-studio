import { Brain, Shield, Target, Cpu, Building2, Users, Globe, Sparkles } from "lucide-react";

export interface AIFilter {
  id: string;
  name: string;
  shortName: string;
  description: string;
  detailedDescription: string;
  icon: typeof Brain;
  colorClass: string;
  linkedEvents: string[];
  captionPrompt: string;
}

/**
 * DSC Filters (formerly AI Filters)
 * These filters are used to categorize the AI Readiness declarations.
 */
export const AI_FILTERS: AIFilter[] = [
  {
    id: "ready",
    name: "I AM AI Ready (DSC Filter)",
    shortName: "AI Ready",
    description: "The foundational declaration of AI maturity",
    detailedDescription: "I understand AI's potential and take responsibility for how it shapes our future.",
    icon: Sparkles,
    colorClass: "filter-ready",
    linkedEvents: ["Full AI Readiness Roadmap 2026"],
    captionPrompt: "AI readiness to me means…",
  },
  {
    id: "savvy",
    name: "I AM AI Savvy (DSC Filter)",
    shortName: "AI Savvy",
    description: "Understanding how AI actually works — beyond buzzwords",
    detailedDescription: "I grasp the technical foundations, capabilities, and limitations of AI systems.",
    icon: Brain,
    colorClass: "filter-savvy",
    linkedEvents: ["Applied AI Bootcamp (Apr–Jun)", "Storytelling with Data (July)"],
    captionPrompt: "Understanding AI means more than just using it…",
  },
  {
    id: "accountable",
    name: "I AM AI Accountable (DSC Filter)",
    shortName: "AI Accountable",
    description: "AI without accountability destroys trust",
    detailedDescription: "I champion ethical AI governance, transparency, and responsible deployment.",
    icon: Shield,
    colorClass: "filter-accountable",
    linkedEvents: ["AI Ethics & Governance (March 25)", "Data Governance Masterclass (March 17–19)"],
    captionPrompt: "Trust is the real AI infrastructure because…",
  },
  {
    id: "driven",
    name: "I AM AI Driven (DSC Filter)",
    shortName: "AI Driven",
    description: "AI decisions must drive real outcomes",
    detailedDescription: "I leverage AI strategically to transform operations and achieve measurable impact.",
    icon: Target,
    colorClass: "filter-driven",
    linkedEvents: ["Digital Strategy & Transformation Workshop (May)", "Leadership in the Digital Era (Nov)"],
    captionPrompt: "The biggest AI opportunity for institutions is…",
  },
  {
    id: "enabler",
    name: "I AM an AI Enabler (DSC Filter)",
    shortName: "AI Enabler",
    description: "Infrastructure, security, and governance make AI possible",
    detailedDescription: "I build the secure foundations that allow AI to scale safely across organizations.",
    icon: Cpu,
    colorClass: "filter-enabler",
    linkedEvents: ["Cybersecurity for AI Ecosystems (April)", "Cloud-Ready Culture Workshop (Sept)"],
    captionPrompt: "Enabling AI requires building…",
  },
  {
    id: "building",
    name: "I AM Building AI-Ready Institutions (DSC Filter)",
    shortName: "Building Institutions",
    description: "AI readiness is institutional, not individual",
    detailedDescription: "I transform organizational structures, cultures, and processes to embrace AI.",
    icon: Building2,
    colorClass: "filter-building",
    linkedEvents: ["Feb 18 Seminar", "Pre-UNGA Strategy Review (Sept 17)"],
    captionPrompt: "The biggest mistake institutions make with AI is…",
  },
  {
    id: "leading",
    name: "I AM Leading Responsible AI (DSC Filter)",
    shortName: "Leading Responsibly",
    description: "People, trust, and leadership determine AI success",
    detailedDescription: "I guide teams through AI transformation with empathy, vision, and ethical clarity.",
    icon: Users,
    colorClass: "filter-leading",
    linkedEvents: ["Operational Change & AI Readiness (June)", "Culture, Change & Talent Seminar (July)"],
    captionPrompt: "Responsible AI leadership means…",
  },
  {
    id: "shaping",
    name: "I AM Shaping AI Ecosystems (DSC Filter)",
    shortName: "Shaping Ecosystems",
    description: "AI scales through collaboration, not isolation",
    detailedDescription: "I forge partnerships and cross-sector alliances to advance AI for collective benefit.",
    icon: Globe,
    colorClass: "filter-shaping",
    linkedEvents: ["Cross-Market AI Partnerships (Sept 10)", "Closing Session (Nov 18)"],
    captionPrompt: "AI ecosystems thrive when…",
  },
];

export const getFilterById = (id: string): AIFilter | undefined => {
  return AI_FILTERS.find((filter) => filter.id === id);
};

export const getFilterColor = (id: string): string => {
  const colorMap: Record<string, string> = {
    ready: "hsl(220, 70%, 45%)",
    savvy: "hsl(210, 100%, 50%)",
    accountable: "hsl(175, 80%, 40%)",
    driven: "hsl(40, 90%, 50%)",
    enabler: "hsl(270, 70%, 55%)",
    building: "hsl(160, 60%, 45%)",
    leading: "hsl(350, 70%, 55%)",
    shaping: "hsl(190, 90%, 45%)",
  };
  return colorMap[id] || colorMap.ready;
};
