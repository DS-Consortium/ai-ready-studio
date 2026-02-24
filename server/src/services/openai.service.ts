/**
 * OpenAI Service (Whisper & GPT)
 * Handles transcription and AI analysis
 */
import { OpenAI } from 'openai';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';
import * as fs from 'fs';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

/**
 * Transcribe audio using Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Convert buffer to File
    const audioFile = new File([audioBuffer], 'audio.mp4', { type: 'audio/mp4' });

    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    return transcript.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Analyze readiness score
 */
export async function analyzeReadinessScore(
  transcription: string
): Promise<{
  score: number;
  clarity: number;
  confidence: number;
  articulation: number;
  pacing: number;
  keywordRelevance: number;
  insights: string[];
  recommendations: string[];
}> {
  try {
    const prompt = `Analyze this AI-ready declaration and provide a readiness score (0-100) based on:
1. Clarity (word choice, uniqueness): 0-100
2. Confidence (language patterns, certainty): 0-100
3. Articulation (sentence structure): 0-100
4. Pacing (flow): 0-100
5. Keyword Relevance (AI/Leadership focus): 0-100

Declaration: "${transcription}"

Return JSON:
{
  "clarity": NUMBER,
  "confidence": NUMBER,
  "articulation": NUMBER,
  "pacing": NUMBER,
  "keywordRelevance": NUMBER,
  "insights": [STRING, STRING, STRING],
  "recommendations": [STRING, STRING, STRING]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    const analysis = JSON.parse(content);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      analysis.clarity * 0.2 +
        analysis.confidence * 0.25 +
        analysis.articulation * 0.2 +
        analysis.pacing * 0.15 +
        analysis.keywordRelevance * 0.2
    );

    return {
      score: overallScore,
      ...analysis,
    };
  } catch (error) {
    console.error('Error analyzing readiness score:', error);
    throw error;
  }
}

/**
 * Generate personalized insights
 */
export async function generateInsights(
  transcription: string,
  topic: string
): Promise<string[]> {
  try {
    const prompt = `Generate 3-5 personalized, actionable insights for this AI Ready declaration on "${topic}":

"${transcription}"

Provide insights that:
- Are specific to the content
- Are motivational and constructive
- Focus on AI/Leadership readiness
- Are concise (one sentence each)

Return as JSON array of strings.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    // Parse array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) {
      return [
        '✅ Your declaration shows strong AI readiness',
        '💡 Consider incorporating more specific AI/Leadership examples',
      ];
    }

    return JSON.parse(match[0]);
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
}

/**
 * Generate video title suggestion
 */
export async function generateVideoTitle(
  transcription: string,
  theme: string
): Promise<string> {
  try {
    const prompt = `Generate a catchy, professional 5-8 word title for this AI Ready declaration with theme "${theme}":

"${transcription}"

Title should be:
- Engaging and memorable
- Related to AI/Leadership
- Under 60 characters

Return only the title, no quotes or explanation.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 30,
    });

    return response.choices[0].message.content?.trim() || 'My AI Ready Declaration';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'My AI Ready Declaration';
  }
}

/**
 * Save readiness score to database
 */
export async function saveReadinessScore(
  userId: string,
  videoId: string,
  transcription: string,
  analysis: any
): Promise<void> {
  try {
    await supabase.from('readiness_scores').insert({
      user_id: userId,
      video_id: videoId,
      overall_score: analysis.score,
      clarity: analysis.clarity,
      confidence: analysis.confidence,
      articulation: analysis.articulation,
      pacing: analysis.pacing,
      keyword_relevance: analysis.keywordRelevance,
      transcription,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Readiness score saved for video ${videoId}`);
  } catch (error) {
    console.error('Error saving readiness score:', error);
  }
}

export { openai };
