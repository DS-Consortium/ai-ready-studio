/**
 * AI Readiness Score Analysis
 * 
 * Transcribe declarations using OpenAI Whisper
 * Analyze speech content to generate AI Readiness Score
 * Provide insights and recommendations
 */

/**
 * AI Readiness Score Criteria
 */
export interface AIReadinessScore {
  overallScore: number; // 0-100
  categories: {
    clarity: number; // Speech clarity (0-100)
    confidence: number; // Confidence level (0-100)
    articulation: number; // Word articulation (0-100)
    pacing: number; // Speech pace (0-100)
    keywordRelevance: number; // AI/Leadership keywords (0-100)
  };
  transcription: string;
  keywords: string[];
  insights: string[];
  recommendations: string[];
  generatedAt: string;
}

/**
 * Transcribe audio/video using OpenAI Whisper
 */
export async function transcribeDeclaration(
  audioBlob: Blob
): Promise<{ text: string; duration: number }> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const data = await response.json();

    return {
      text: data.text,
      duration: audioBlob.size, // Approximation
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

/**
 * Analyze transcription for AI Readiness Score
 */
export async function analyzeReadinessScore(
  transcription: string,
  audioBlob?: Blob
): Promise<AIReadinessScore> {
  try {
    // Extract key metrics from transcription
    const clarity = calculateClarity(transcription);
    const confidence = calculateConfidence(transcription);
    const articulation = calculateArticulation(transcription);
    const pacing = calculatePacing(transcription);
    const keywordRelevance = calculateKeywordRelevance(transcription);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      clarity * 0.2 +
        confidence * 0.25 +
        articulation * 0.2 +
        pacing * 0.15 +
        keywordRelevance * 0.2
    );

    // Extract keywords
    const keywords = extractKeywords(transcription);

    // Generate insights
    const insights = generateInsights({
      clarity,
      confidence,
      articulation,
      pacing,
      keywordRelevance,
    });

    // Generate recommendations
    const recommendations = generateRecommendations({
      clarity,
      confidence,
      articulation,
      pacing,
      keywordRelevance,
    });

    return {
      overallScore,
      categories: {
        clarity,
        confidence,
        articulation,
        pacing,
        keywordRelevance,
      },
      transcription,
      keywords,
      insights,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to analyze readiness score:', error);
    throw error;
  }
}

/**
 * Calculate clarity score based on word confidence and repetition
 */
function calculateClarity(text: string): number {
  const words = text.split(/\s+/);
  const uniqueWords = new Set(words.toLowerCase());

  // Higher unique word count = better clarity
  const uniquenessRatio = uniqueWords.size / words.length;
  const clarityScore = Math.min(uniquenessRatio * 100, 100);

  return Math.round(clarityScore);
}

/**
 * Calculate confidence score from language patterns
 */
function calculateConfidence(text: string): number {
  const lowConfidenceIndicators = [
    'um',
    'uh',
    'like',
    'you know',
    'sort of',
    'kind of',
    "i'm not sure",
    'maybe',
    'i think',
  ];

  const highConfidenceIndicators = [
    'i am',
    'i believe',
    'i know',
    'absolutely',
    'definitely',
    'clearly',
    'obviously',
  ];

  const lowerText = text.toLowerCase();
  const lowCount = lowConfidenceIndicators.filter((word) =>
    lowerText.includes(word)
  ).length;

  const highCount = highConfidenceIndicators.filter((word) =>
    lowerText.includes(word)
  ).length;

  // Calculate confidence score
  const confidenceScore = Math.max(50 + highCount * 5 - lowCount * 3, 0);

  return Math.min(Math.round(confidenceScore), 100);
}

/**
 * Calculate articulation score based on sentence structure
 */
function calculateArticulation(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length === 0) return 0;

  // Measure average sentence length and complexity
  const avgSentenceLength = text.split(/\s+/).length / sentences.length;

  // Well-articulated speech has sentences 10-20 words long
  let articulationScore = 50;

  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
    articulationScore = 80 + (20 - Math.abs(avgSentenceLength - 15)) * 2;
  } else if (avgSentenceLength < 5) {
    articulationScore = 30 + avgSentenceLength * 10;
  } else if (avgSentenceLength > 30) {
    articulationScore = Math.max(50 - (avgSentenceLength - 30) * 2, 20);
  }

  return Math.min(Math.round(articulationScore), 100);
}

/**
 * Calculate pacing score (simulated - would need duration data)
 */
function calculatePacing(text: string): number {
  const words = text.split(/\s+/).length;

  // Assume 150 words per minute is optimal
  // Without actual duration, use word count heuristic
  const reasonableLength = words >= 50 && words <= 300;

  return reasonableLength ? 75 : 50;
}

/**
 * Calculate keyword relevance for AI/Leadership topics
 */
function calculateKeywordRelevance(text: string): number {
  const aiKeywords = [
    'artificial intelligence',
    'machine learning',
    'data',
    'innovation',
    'technology',
    'digital',
    'ai',
    'algorithm',
    'automation',
    'learning',
    'adaptive',
    'intelligence',
  ];

  const leadershipKeywords = [
    'lead',
    'inspire',
    'team',
    'vision',
    'strategy',
    'decision',
    'responsibility',
    'influence',
    'empower',
    'develop',
    'mentor',
    'growth',
  ];

  const lowerText = text.toLowerCase();
  const aiCount = aiKeywords.filter((kw) => lowerText.includes(kw)).length;
  const leadershipCount = leadershipKeywords.filter((kw) =>
    lowerText.includes(kw)
  ).length;

  const relevanceScore = (aiCount + leadershipCount) * 5;

  return Math.min(Math.round(relevanceScore), 100);
}

/**
 * Extract key topics and keywords
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'is',
    'are',
    'was',
    'were',
  ]);

  const words = text.toLowerCase().split(/\s+/);

  // Filter and deduplicate
  const keywords = [
    ...new Set(
      words
        .filter(
          (word) =>
            word.length > 4 &&
            !commonWords.has(word) &&
            !word.match(/^[^\w-]/) &&
            !word.match(/[^\w-]$/)
        )
        .slice(0, 10)
    ),
  ];

  return keywords;
}

/**
 * Generate insights based on scores
 */
function generateInsights(categories: {
  clarity: number;
  confidence: number;
  articulation: number;
  pacing: number;
  keywordRelevance: number;
}): string[] {
  const insights: string[] = [];

  if (categories.clarity > 80) {
    insights.push('✅ Your message is clear and easy to follow');
  } else if (categories.clarity < 50) {
    insights.push('⚠️ Consider being more concise to improve clarity');
  }

  if (categories.confidence > 80) {
    insights.push('✅ You sound confident and authoritative');
  } else if (categories.confidence < 50) {
    insights.push('⚠️ Try using more affirmative language to boost confidence');
  }

  if (categories.articulation > 75) {
    insights.push('✅ Excellent sentence structure and flow');
  }

  if (categories.keywordRelevance > 70) {
    insights.push('✅ Strong focus on AI and leadership themes');
  } else {
    insights.push('💡 Consider incorporating more AI/leadership relevant content');
  }

  return insights;
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(categories: {
  clarity: number;
  confidence: number;
  articulation: number;
  pacing: number;
  keywordRelevance: number;
}): string[] {
  const recommendations: string[] = [];

  if (categories.clarity < 75) {
    recommendations.push('Use shorter sentences and avoid filler words (um, uh, like)');
  }

  if (categories.confidence < 75) {
    recommendations.push('Practice speaking with more certainty - avoid hedging language');
  }

  if (categories.articulation < 75) {
    recommendations.push('Aim for 10-20 words per sentence for optimal clarity');
  }

  if (categories.pacing < 75) {
    recommendations.push('Speak at a steady pace and allow pauses for emphasis');
  }

  if (categories.keywordRelevance < 70) {
    recommendations.push(
      'Incorporate more AI/leadership terminology to strengthen your message'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('🎯 Keep up the excellent work - your declaration is AI-ready!');
  }

  return recommendations;
}

/**
 * Save readiness score to database
 */
export async function saveReadinessScore(
  userId: string,
  videoId: string,
  score: AIReadinessScore
): Promise<void> {
  try {
    const { error } = await (window as any).supabase
      .from('readiness_scores')
      .insert({
        user_id: userId,
        video_id: videoId,
        overall_score: score.overallScore,
        clarity: score.categories.clarity,
        confidence: score.categories.confidence,
        articulation: score.categories.articulation,
        pacing: score.categories.pacing,
        keyword_relevance: score.categories.keywordRelevance,
        transcription: score.transcription,
        keywords: score.keywords,
        insights: score.insights,
        recommendations: score.recommendations,
        created_at: score.generatedAt,
      });

    if (error) throw error;

    console.log('Readiness score saved');
  } catch (error) {
    console.error('Failed to save readiness score:', error);
  }
}

/**
 * Database schema
 *
 * CREATE TABLE readiness_scores (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID REFERENCES auth.users(id),
 *   video_id UUID,
 *   overall_score INT,
 *   clarity INT,
 *   confidence INT,
 *   articulation INT,
 *   pacing INT,
 *   keyword_relevance INT,
 *   transcription TEXT,
 *   keywords TEXT[],
 *   insights TEXT[],
 *   recommendations TEXT[],
 *   created_at TIMESTAMP DEFAULT NOW()
 * );
 */
