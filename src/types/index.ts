
export interface Transcript {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  lastModified: Date;
}

export interface TimecodedWord {
  word: string;
  timecode: string;
  startTime: number; // Time in seconds for easier calculations
}

export interface TimecodedSegment {
  text: string;
  words: TimecodedWord[];
  startTimecode: string;
  endTimecode: string;
  startTime: number; // Time in seconds
  endTime: number; // Time in seconds
}

export interface SearchResult {
  id: string;
  matchText: string;
  segments: TimecodedSegment[];
  matchScore: number; // 0-100 score
  matchQuality: 'perfect' | 'high' | 'medium' | 'low';
  // Enhanced properties to provide more context
  coherenceScore?: number; // How natural the assembled bite sounds
  grammarScore?: number; // How grammatically correct the assembled bite is
  contextPreservation?: number; // How well the original context is preserved
  source?: 'exact' | 'frankenbite'; // Whether this is an exact match or assembled
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
}

// New interfaces for enhanced functionality

export interface SearchFilter {
  matchQuality?: 'perfect' | 'high' | 'medium' | 'low' | 'all';
  minScore?: number;
  maxSegments?: number;
  speakerIds?: string[]; // For future speaker identification
}

export interface SavedFrankenbite {
  id: string;
  query: string;
  result: SearchResult;
  notes?: string;
  createdAt: Date;
  tags?: string[];
}

export interface ProjectCollection {
  id: string;
  name: string;
  description?: string;
  savedBites: SavedFrankenbite[];
  createdAt: Date;
  lastModified: Date;
}
