
import { TimecodedSegment, SearchResult } from '../types';

// Enhanced string similarity using Levenshtein distance with word-level adjustments
const stringSimilarity = (a: string, b: string): number => {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  // Word-level comparison for better phrase matching
  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);
  
  // Create matrix for dynamic programming approach
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= bWords.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= aWords.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix with edit distances
  for (let i = 1; i <= bWords.length; i++) {
    for (let j = 1; j <= aWords.length; j++) {
      // Check if words are the same or similar
      const wordSimilarity = wordLevelSimilarity(aWords[j - 1], bWords[i - 1]);
      const cost = wordSimilarity > 0.8 ? 0 : 1 - wordSimilarity; // Partial credit for similar words
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution with similarity consideration
      );
    }
  }
  
  const distance = matrix[bWords.length][aWords.length];
  const maxLength = Math.max(aWords.length, bWords.length);
  const similarity = 1 - distance / maxLength;
  
  return similarity;
};

// Word-level similarity for better synonym detection
const wordLevelSimilarity = (word1: string, word2: string): number => {
  // If words are identical, return 1
  if (word1 === word2) return 1;
  
  // Simple character-based Levenshtein for similar words
  const len1 = word1.length;
  const len2 = word2.length;
  
  // Quick length check - if lengths differ too much, they're likely different words
  if (Math.abs(len1 - len2) > 3) return 0.1;
  
  // Character-level Levenshtein for similar words
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return 1 - matrix[len1][len2] / Math.max(len1, len2);
};

// Normalize text for better matching with improved handling of stopwords
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Enhanced coherence score calculation with grammatical structure analysis
const calculateCoherenceScore = (assembledText: string): number => {
  // Real implementation would use NLP for grammatical analysis
  // For now, we'll enhance our heuristics
  
  // Basic checks for sentence structure
  const hasProperCapitalization = /^[A-Z]/.test(assembledText);
  const hasProperSpacing = !assembledText.includes("  ");
  const hasProperEnding = /[.!?]$/.test(assembledText);
  const hasSentenceStructure = /\b(I|you|he|she|it|we|they)\b.*\b(is|am|are|was|were|will|have|has|had)\b/i.test(assembledText);
  
  let score = 0.6; // Base score - lower base for more discrimination
  if (hasProperCapitalization) score += 0.1;
  if (hasProperSpacing) score += 0.1;
  if (hasProperEnding) score += 0.1;
  if (hasSentenceStructure) score += 0.1;
  
  // More advanced: check for abrupt transitions in multi-segment frankenbites
  const hasAbruptTransitions = assembledText.includes("... ");
  if (hasAbruptTransitions) score -= 0.15;
  
  return Math.max(0, Math.min(1, score)); // Ensure score is between 0 and 1
};

// Enhanced search function with smarter frankenbite construction
export const searchPhrases = (
  segments: TimecodedSegment[],
  searchQuery: string,
  similarityThreshold: number = 0.6,
  maxResults: number = 8 // Increased from 5 to provide more options
): SearchResult[] => {
  const results: SearchResult[] = [];
  const normalizedQuery = normalizeText(searchQuery);
  const words = normalizedQuery.split(' ');
  
  if (!normalizedQuery.length || !segments.length) return results;

  // Try to find exact matches first
  segments.forEach(segment => {
    const normalizedSegment = normalizeText(segment.text);
    
    // Exact match (case insensitive)
    if (normalizedSegment.includes(normalizedQuery)) {
      // Found exact match
      const coherence = calculateCoherenceScore(segment.text);
      results.push({
        id: `result-${results.length}`,
        matchText: segment.text,
        segments: [segment],
        matchScore: 100,
        matchQuality: 'perfect',
        coherenceScore: coherence,
        grammarScore: 0.95,
        contextPreservation: 1.0,
        source: 'exact'
      });
    }
  });

  // Find partial matches with similarity scoring
  const partialMatches: { 
    segments: TimecodedSegment[], 
    score: number, 
    coherence: number,
    contextScore: number
  }[] = [];
  
  // Enhanced search for similar phrases
  segments.forEach(segment => {
    const normalizedSegment = normalizeText(segment.text);
    const similarity = stringSimilarity(normalizedQuery, normalizedSegment);
    
    if (similarity >= similarityThreshold) {
      const coherence = calculateCoherenceScore(segment.text);
      const contextScore = calculateContextPreservation(normalizedQuery, normalizedSegment);
      
      partialMatches.push({
        segments: [segment],
        score: similarity * 100,
        coherence,
        contextScore
      });
    }
  });
  
  // More sophisticated frankenbite construction
  if (words.length > 1) {
    // Create an index for all segments by contained words
    const segmentsByWord = new Map<string, TimecodedSegment[]>();
    
    // Include key phrases, not just individual words
    const keyPhrases = extractKeyPhrases(normalizedQuery);
    
    // Index segments by words
    words.forEach(word => {
      if (word.length < 3) return; // Skip very short words
      
      segmentsByWord.set(word, segments.filter(seg => 
        normalizeText(seg.text).includes(word)
      ));
    });
    
    // Index segments by key phrases too
    keyPhrases.forEach(phrase => {
      segmentsByWord.set(phrase, segments.filter(seg => 
        normalizeText(seg.text).includes(phrase)
      ));
    });
    
    // Find combinations of segments that cover the query
    // Enhanced to prioritize segments that preserve key phrases
    const findSegmentCombinations = (
      maxSegments: number = 3, 
      minCoverage: number = 0.7
    ): TimecodedSegment[][] => {
      const combinations: TimecodedSegment[][] = [];
      const seenCombinations = new Set<string>();
      
      // Recursive helper to build combinations
      const buildCombination = (
        currentSegments: TimecodedSegment[], 
        remainingWords: Set<string>, 
        depth: number
      ) => {
        // Stop if we've reached our max depth or covered all words
        if (depth >= maxSegments || remainingWords.size === 0) {
          // Calculate coverage score
          const combined = currentSegments.map(s => normalizeText(s.text)).join(" ");
          const coverage = words.filter(w => combined.includes(w)).length / words.length;
          
          // Only add combinations with good coverage
          if (coverage >= minCoverage) {
            // Check if we've seen this exact combination before
            const comboKey = currentSegments.map(s => s.startTimecode).join('|');
            if (!seenCombinations.has(comboKey)) {
              combinations.push([...currentSegments]);
              seenCombinations.add(comboKey);
            }
          }
          return;
        }
        
        // Try adding segments that cover remaining words
        const coveredWords = new Set<string>();
        currentSegments.forEach(seg => {
          const segText = normalizeText(seg.text);
          words.forEach(word => {
            if (segText.includes(word)) coveredWords.add(word);
          });
        });
        
        // Try to find segments that cover our remaining words
        const candidateSegments = new Set<TimecodedSegment>();
        remainingWords.forEach(word => {
          const segments = segmentsByWord.get(word) || [];
          segments.forEach(seg => {
            // Don't add segments we already have
            if (!currentSegments.includes(seg)) {
              candidateSegments.add(seg);
            }
          });
        });
        
        // Sort candidates by how many new words they cover
        const sortedCandidates = Array.from(candidateSegments)
          .map(seg => {
            const segText = normalizeText(seg.text);
            let newWordsCovered = 0;
            remainingWords.forEach(word => {
              if (segText.includes(word)) newWordsCovered++;
            });
            return { segment: seg, newWordsCovered };
          })
          .sort((a, b) => b.newWordsCovered - a.newWordsCovered);
        
        // Try each candidate
        for (const { segment } of sortedCandidates) {
          const segText = normalizeText(segment.text);
          const newRemaining = new Set(remainingWords);
          
          // Remove words that this segment covers
          words.forEach(word => {
            if (segText.includes(word)) newRemaining.delete(word);
          });
          
          buildCombination([...currentSegments, segment], newRemaining, depth + 1);
        }
      };
      
      // Start with empty combination and all words
      buildCombination([], new Set(words), 0);
      
      return combinations;
    };
    
    // Get 2 and 3-segment combinations
    const twoCombinations = findSegmentCombinations(2, 0.7);
    const threeCombinations = words.length >= 4 ? findSegmentCombinations(3, 0.8) : [];
    
    // Score and add all combinations
    [...twoCombinations, ...threeCombinations].forEach(combination => {
      const combinedText = combination.map(seg => seg.text).join(" ... ");
      const normalizedCombined = normalizeText(combinedText);
      
      // Calculate coverage of query words
      const coverageScore = words.filter(word => 
        normalizedCombined.includes(word)
      ).length / words.length;
      
      // Calculate phrase coherence (how natural it sounds)
      const coherence = calculateCoherenceScore(combinedText) * (combination.length === 1 ? 1 : 0.8);
      
      // Calculate context preservation (how much meaning is preserved)
      const contextScore = calculateContextPreservation(normalizedQuery, normalizedCombined) * (combination.length === 1 ? 1 : 0.75);
      
      // Calculate semantic similarity
      const similarity = stringSimilarity(normalizedQuery, normalizedCombined);
      
      // Combined score with weighting factors
      const finalScore = (
        similarity * 0.4 + 
        coverageScore * 0.4 + 
        coherence * 0.1 + 
        contextScore * 0.1
      ) * 100;
      
      if (finalScore >= similarityThreshold * 95) { // Slightly lower threshold for combinations
        partialMatches.push({
          segments: combination,
          score: finalScore,
          coherence,
          contextScore
        });
      }
    });
  }
  
  // Sort by score and add to results
  partialMatches
    .sort((a, b) => {
      // Primary sort by match score
      if (Math.abs(b.score - a.score) > 5) return b.score - a.score;
      // Secondary sort by coherence for similar scores
      if (Math.abs(b.coherence - a.coherence) > 0.1) return b.coherence - a.coherence;
      // Tertiary sort by segment count (prefer fewer segments)
      return a.segments.length - b.segments.length;
    })
    .slice(0, maxResults) // Limit to top results
    .forEach(match => {
      // Determine match quality
      const quality = 
        match.score >= 90 ? 'high' : 
        match.score >= 75 ? 'medium' : 'low';
      
      results.push({
        id: `result-${results.length}`,
        matchText: match.segments.map(s => s.text).join(' [...] '),
        segments: match.segments,
        matchScore: Math.round(match.score),
        matchQuality: quality,
        coherenceScore: match.coherence,
        grammarScore: match.coherence * 0.9,
        contextPreservation: match.contextScore,
        source: match.segments.length > 1 ? 'frankenbite' : 'exact'
      });
    });
  
  // Return unique results, sorted by score
  return results
    .filter((result, index, self) => 
      index === self.findIndex(r => r.matchText === result.matchText)
    )
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, maxResults);
};

// Helper function to calculate context preservation score
const calculateContextPreservation = (query: string, text: string): number => {
  // In a real system, this would use semantic analysis
  // For now, use a simple heuristic based on word coverage and order
  
  const queryWords = query.split(/\s+/);
  const textWords = text.split(/\s+/);
  
  // Count words from query that appear in the text
  let matchedWords = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  
  queryWords.forEach(qWord => {
    if (textWords.some(tWord => tWord === qWord)) {
      matchedWords++;
    }
  });
  
  // Check for word sequence preservation
  for (let i = 0; i < queryWords.length - 1; i++) {
    const currentWord = queryWords[i];
    const nextWord = queryWords[i + 1];
    
    // Find positions in text
    const currentWordIndex = textWords.findIndex(w => w === currentWord);
    const nextWordIndex = textWords.findIndex(w => w === nextWord);
    
    // Check if they appear in sequence
    if (currentWordIndex !== -1 && nextWordIndex !== -1 && nextWordIndex === currentWordIndex + 1) {
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }
  
  // Calculate scores
  const coverageScore = matchedWords / queryWords.length;
  const sequenceScore = queryWords.length > 1 ? maxConsecutive / (queryWords.length - 1) : 1;
  
  // Weight coverage more heavily than sequence
  return coverageScore * 0.7 + sequenceScore * 0.3;
};

// Extract key phrases from query (for better matching)
const extractKeyPhrases = (query: string): string[] => {
  const words = query.split(/\s+/);
  const phrases: string[] = [];
  
  // Create 2 and 3-word phrases
  for (let i = 0; i < words.length; i++) {
    if (i < words.length - 1) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  return phrases;
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
      const coherence = calculateCoherenceScore(segment.text);
      results.push({
        id: `word-${results.length}`,
        matchText: segment.text,
        segments: [segment],
        matchScore: 100,
        matchQuality: 'perfect',
        coherenceScore: coherence,
        grammarScore: 0.95,
        source: 'exact'
      });
    }
  });
  
  return results;
};

// Generate creative "not found" messages
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
    "Nice try! Finding alternative phrases instead...",
    "We've scoured every word, but couldn't assemble this phrase.",
    "Your subject wasn't quite so eloquent, try something simpler?",
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// Save search history
export const saveSearchHistory = (query: string): void => {
  try {
    const history = localStorage.getItem('searchHistory');
    let searches = history ? JSON.parse(history) : [];
    
    // Add to beginning, remove duplicates, limit to 10
    searches = [query, ...searches.filter(q => q !== query)].slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(searches));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
};

// Get search history
export const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving search history:', error);
    return [];
  }
};
