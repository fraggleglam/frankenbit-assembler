
import { TimecodedSegment, SearchResult } from '../types';

// Simple string similarity score (0-1) using Levenshtein distance
const stringSimilarity = (a: string, b: string): number => {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1].toLowerCase() === b[i - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLength;
  
  return similarity;
};

// Normalize text for better matching (remove punctuation, lowercase, etc.)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Find exact and similar phrases in transcript segments
export const searchPhrases = (
  segments: TimecodedSegment[],
  searchQuery: string,
  similarityThreshold: number = 0.6
): SearchResult[] => {
  const results: SearchResult[] = [];
  const normalizedQuery = normalizeText(searchQuery);
  const words = normalizedQuery.split(' ');
  
  if (!normalizedQuery.length || !segments.length) return results;

  // Try to find exact matches first
  segments.forEach(segment => {
    const normalizedSegment = normalizeText(segment.text);
    
    if (normalizedSegment.includes(normalizedQuery)) {
      // Found exact match
      results.push({
        id: `result-${results.length}`,
        matchText: segment.text,
        segments: [segment],
        matchScore: 100,
        matchQuality: 'perfect'
      });
    }
  });

  // If we found exact matches, return them
  if (results.length > 0) return results;
  
  // Find partial matches with similarity scoring
  const partialMatches: { segments: TimecodedSegment[], score: number }[] = [];
  
  // Search for similar phrases
  segments.forEach(segment => {
    const normalizedSegment = normalizeText(segment.text);
    const similarity = stringSimilarity(normalizedQuery, normalizedSegment);
    
    if (similarity >= similarityThreshold) {
      partialMatches.push({
        segments: [segment],
        score: similarity * 100
      });
    }
  });
  
  // Search for frankenbites (combinations of segments)
  // This is a simplified version - a more sophisticated implementation would analyze
  // combinations of words from different segments
  if (words.length > 1) {
    // Simple approach: look for segments containing individual words
    const wordMatches: { word: string, segments: TimecodedSegment[] }[] = words.map(word => {
      return {
        word,
        segments: segments.filter(seg => normalizeText(seg.text).includes(word))
      };
    });
    
    // If we found matches for each word, we can create a potential frankenbite
    if (wordMatches.every(match => match.segments.length > 0)) {
      // Use the first match for each word to create a frankenbite
      const frankenSegments = wordMatches.map(match => match.segments[0]);
      
      // Calculate an approximate score based on coverage and sequence
      const avgScore = 65; // Frankenbites are less ideal than natural matches
      
      partialMatches.push({
        segments: frankenSegments,
        score: avgScore
      });
    }
  }
  
  // Sort by score (highest first) and add to results
  partialMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Limit to 5 results
    .forEach(match => {
      const quality = 
        match.score >= 90 ? 'high' : 
        match.score >= 70 ? 'medium' : 'low';
      
      results.push({
        id: `result-${results.length}`,
        matchText: match.segments.map(s => s.text).join(' [...] '),
        segments: match.segments,
        matchScore: Math.round(match.score),
        matchQuality: quality
      });
    });
  
  return results;
};

// Find all occurrences of a word with context
export const searchWord = (
  segments: TimecodedSegment[],
  word: string
): SearchResult[] => {
  const results: SearchResult[] = [];
  const normalizedWord = normalizeText(word);
  
  if (!normalizedWord.length) return results;
  
  segments.forEach(segment => {
    const normalizedText = normalizeText(segment.text);
    
    if (normalizedText.includes(normalizedWord)) {
      results.push({
        id: `word-${results.length}`,
        matchText: segment.text,
        segments: [segment],
        matchScore: 100,
        matchQuality: 'perfect'
      });
    }
  });
  
  return results;
};

// Generate amusing "not found" messages
export const getNotFoundMessage = (): string => {
  const messages = [
    "Nope, they never said that!",
    "This phrase doesn't exist in the universe of this transcript.",
    "Not even with creative editing could we make them say that!",
    "Your search has gone beyond the boundaries of reality.",
    "Even frankenbiting can't make this happen.",
    "The perfect quote exists only in your imagination.",
    "We've searched high and low, but this one's not in the transcript.",
    "Maybe they said it off camera?",
    "The transcript says no, but your determination says yes!",
    "That's a great quote, but it's not in the transcript.",
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};
