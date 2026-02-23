export interface SeedVideo {
  id: string;
  author: string;
  organization: string;
  title: string;
  filterId: string;
  videoUrl: string;
  thumbnail: string;
  votes: number;
  views: number;
}

export const SEED_VIDEOS: SeedVideo[] = [
  {
    id: "seed-1",
    author: "Sarah Chen",
    organization: "Global FinTech",
    title: "Leading the AI Revolution in Finance",
    filterId: "leading",
    videoUrl: "https://example.com/videos/seed1.mp4",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1200&fit=crop",
    votes: 1240,
    views: 5600
  },
  {
    id: "seed-2",
    author: "Marcus Thorne",
    organization: "Tech Solutions Inc",
    title: "Why AI Readiness is Non-Negotiable",
    filterId: "ready",
    videoUrl: "https://example.com/videos/seed2.mp4",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop",
    votes: 890,
    views: 3200
  },
  {
    id: "seed-3",
    author: "Amina Yusuf",
    organization: "Innovation Hub",
    title: "Building Responsible AI Ecosystems",
    filterId: "shaping",
    videoUrl: "https://example.com/videos/seed3.mp4",
    thumbnail: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=1200&fit=crop",
    votes: 2100,
    views: 8400
  },
  {
    id: "seed-4",
    author: "David Park",
    organization: "Future Systems",
    title: "Empowering Teams with AI Enablers",
    filterId: "enabler",
    videoUrl: "https://example.com/videos/seed4.mp4",
    thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=1200&fit=crop",
    votes: 1560,
    views: 4100
  }
];
