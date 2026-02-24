/**
 * Knowledge Library Page
 * Mobile-optimized learning resources
 * Replication of website knowledge library
 */

import { useState } from 'react';
import { Search, BookOpen, Play, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  items: number;
  thumbnail?: string;
  type: 'video' | 'article' | 'podcast' | 'infographic';
}

const KNOWLEDGE_CATEGORIES: Resource[] = [
  {
    id: 'ai-foundations',
    title: 'AI Foundations',
    description: 'Core concepts and fundamentals of AI',
    category: 'Learning Path',
    icon: '🧠',
    color: 'from-blue-500 to-blue-600',
    items: 12,
    type: 'video',
  },
  {
    id: 'ai-ethics',
    title: 'AI Ethics & Governance',
    description: 'Responsible AI and ethical frameworks',
    category: 'Course',
    icon: '⚖️',
    color: 'from-emerald-500 to-emerald-600',
    items: 8,
    type: 'article',
  },
  {
    id: 'digital-strategy',
    title: 'Digital Strategy',
    description: 'Transform your organization for the digital age',
    category: 'Workshop',
    icon: '📊',
    color: 'from-purple-500 to-purple-600',
    items: 15,
    type: 'video',
  },
  {
    id: 'data-governance',
    title: 'Data Governance',
    description: 'Managing data as a strategic asset',
    category: 'Course',
    icon: '📁',
    color: 'from-orange-500 to-orange-600',
    items: 10,
    type: 'article',
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity for AI',
    description: 'Protecting AI systems and data',
    category: 'Learning Path',
    icon: '🔒',
    color: 'from-red-500 to-red-600',
    items: 9,
    type: 'podcast',
  },
  {
    id: 'leadership',
    title: 'AI Leadership',
    description: 'Leading transformation through AI',
    category: 'Masterclass',
    icon: '👑',
    color: 'from-pink-500 to-pink-600',
    items: 14,
    type: 'video',
  },
  {
    id: 'implementation',
    title: 'Implementation Strategies',
    description: 'Practical AI deployment and scaling',
    category: 'Guide',
    icon: '🚀',
    color: 'from-indigo-500 to-indigo-600',
    items: 11,
    type: 'infographic',
  },
  {
    id: 'case-studies',
    title: 'Case Studies',
    description: 'Real-world AI success stories',
    category: 'Resource',
    icon: '📖',
    color: 'from-cyan-500 to-cyan-600',
    items: 20,
    type: 'article',
  },
];

const KnowledgeLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredResources = KNOWLEDGE_CATEGORIES.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(KNOWLEDGE_CATEGORIES.map((r) => r.category))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Knowledge Library</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-10 py-2 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${resource.color} rounded-lg p-4 h-40 flex flex-col justify-between text-white overflow-hidden relative`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="text-6xl">{resource.icon}</div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold opacity-90 bg-white/20 px-2 py-1 rounded-full">
                      {resource.category}
                    </span>
                    <span className="text-sm opacity-90">{resource.items} items</span>
                  </div>
                  <h3 className="font-bold text-lg group-hover:underline transition">
                    {resource.title}
                  </h3>
                </div>

                {/* Description */}
                <div className="relative z-10">
                  <p className="text-sm opacity-90 line-clamp-2 mb-3">
                    {resource.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {resource.type === 'video' && <Play className="w-4 h-4" />}
                    {resource.type === 'article' && <BookOpen className="w-4 h-4" />}
                    {resource.type === 'podcast' && '🎙️'}
                    {resource.type === 'infographic' && '📊'}
                    <span className="capitalize">{resource.type}</span>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="rounded-full">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" className="rounded-full">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No resources found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeLibrary;
