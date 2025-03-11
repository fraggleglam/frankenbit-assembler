
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
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
}
