
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

// Calculate a grammatical coherence score (simplified version)
const calculateCoherenceScore = (assembledText: string): number => {
  // This is a simplified placeholder implementation
  // In a real system, you would use NLP to analyze grammatical correctness
  
  // For now, just check if the assembled text has standard sentence structure
  // Simple heuristics: does it start with capital, have proper spacing, end with punctuation
  const hasProperSpacing = !assembledText.includes("  "); // No double spaces
  const hasProperEnding = /[.!?]$/.test(assembledText);
  
  let score = 0.7; // Base score
  if (hasProperSpacing) score += 0.15;
  if (hasProperEnding) score += 0.15;
  
  return score;
};

// Enhanced search function to find exact and similar phrases in transcript segments
export const searchPhrases = (
  segments: TimecodedSegment[],
  searchQuery: string,
  similarityThreshold: number = 0.6,
  maxResults: number = 5
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

  // If we found exact matches, add them but continue searching for alternatives
  
  // Find partial matches with similarity scoring
  const partialMatches: { segments: TimecodedSegment[], score: number, coherence: number }[] = [];
  
  // Search for similar phrases
  segments.forEach(segment => {
    const normalizedSegment = normalizeText(segment.text);
    const similarity = stringSimilarity(normalizedQuery, normalizedSegment);
    
    if (similarity >= similarityThreshold) {
      const coherence = calculateCoherenceScore(segment.text);
      partialMatches.push({
        segments: [segment],
        score: similarity * 100,
        coherence
      });
    }
  });
  
  // Advanced search for frankenbites (combinations of segments)
  // This tries to construct frankenbites by combining segments that contain different parts of the query
  if (words.length > 1) {
    // Index all segments by which words they contain
    const segmentsByWord = new Map<string, TimecodedSegment[]>();
    
    words.forEach(word => {
      if (word.length < 3) return; // Skip very short words
      
      segmentsByWord.set(word, segments.filter(seg => 
        normalizeText(seg.text).includes(word)
      ));
    });
    
    // Find combinations of up to 3 segments that together contain most/all query words
    // This is a simplified approach - a real implementation would be more sophisticated
    const candidateCombinations: TimecodedSegment[][] = [];
    
    // Try 2-segment combinations first (more natural sounding)
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];
        
        const combined = normalizeText(seg1.text + " " + seg2.text);
        const coverageScore = words.filter(word => 
          combined.includes(word)
        ).length / words.length;
        
        if (coverageScore > 0.7) { // If it covers at least 70% of words
          candidateCombinations.push([seg1, seg2]);
        }
      }
    }
    
    // Try 3-segment combinations if needed
    if (candidateCombinations.length < 3 && words.length > 3) {
      for (let i = 0; i < segments.length; i++) {
        for (let j = i + 1; j < segments.length; j++) {
          for (let k = j + 1; k < segments.length; k++) {
            const seg1 = segments[i];
            const seg2 = segments[j];
            const seg3 = segments[k];
            
            const combined = normalizeText(seg1.text + " " + seg2.text + " " + seg3.text);
            const coverageScore = words.filter(word => 
              combined.includes(word)
            ).length / words.length;
            
            if (coverageScore > 0.8) { // Higher threshold for 3 segments
              candidateCombinations.push([seg1, seg2, seg3]);
            }
          }
        }
      }
    }
    
    // Score and add the combinations
    candidateCombinations.forEach(combination => {
      const combinedText = combination.map(seg => seg.text).join(" ... ");
      const normalizedCombined = normalizeText(combinedText);
      
      const coverageScore = words.filter(word => 
        normalizedCombined.includes(word)
      ).length / words.length;
      
      const similarity = stringSimilarity(normalizedQuery, normalizedCombined);
      const coherence = calculateCoherenceScore(combinedText) * 0.8; // Frankenbites are less coherent
      
      // Combine the scores - frankenbites need good word coverage
      const finalScore = (similarity * 0.5 + coverageScore * 0.5) * 100;
      
      if (finalScore >= similarityThreshold * 100) {
        partialMatches.push({
          segments: combination,
          score: finalScore,
          coherence
        });
      }
    });
  }
  
  // Sort by score (highest first) and add to results
  partialMatches
    .sort((a, b) => {
      // Primary sort by match score
      if (b.score !== a.score) return b.score - a.score;
      // Secondary sort by coherence for items with similar scores
      return b.coherence - a.coherence;
    })
    .slice(0, maxResults) // Limit to top results
    .forEach(match => {
      const quality = 
        match.score >= 90 ? 'high' : 
        match.score >= 75 ? 'medium' : 'low';
      
      results.push({
        id: `result-${results.length}`,
        matchText: match.segments.map(s => s.text).join(' [...] '),
        segments: match.segments,
        matchScore: Math.round(match.score),
        matchQuality: quality
      });
    });
  
  // Return top unique results, sorted by score
  return results
    .filter((result, index, self) => 
      index === self.findIndex(r => r.matchText === result.matchText)
    )
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxResults);
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
