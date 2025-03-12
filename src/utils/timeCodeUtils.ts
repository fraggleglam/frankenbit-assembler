
// Import types directly at the top of the file
import { TimecodedWord, TimecodedSegment } from '@/types';

// Convert timecode string (e.g., "00:01:23:15") to seconds
export const timecodeToSeconds = (timecode: string): number => {
  // Handle different timecode formats
  if (!timecode) return 0;
  
  const formats = [
    /(\d{2}):(\d{2}):(\d{2}):(\d{2})/, // 00:01:23:15 (HH:MM:SS:FF)
    /(\d{2}):(\d{2}):(\d{2})\.(\d{2,3})/, // 00:01:23.15 or 00:01:23.150
    /(\d{2}):(\d{2}):(\d{2})/, // 00:01:23
    /(\d{1,2}):(\d{2})/ // 1:23 or 01:23
  ];
  
  for (const format of formats) {
    const match = timecode.match(format);
    if (match) {
      if (match.length === 5) { // HH:MM:SS:FF or HH:MM:SS.MS
        const [_, hours, minutes, seconds, frames] = match;
        // Assuming 30fps for frames conversion
        const framesInSeconds = parseInt(frames) / 30;
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + framesInSeconds;
      } else if (match.length === 4) { // HH:MM:SS
        const [_, hours, minutes, seconds] = match;
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
      } else if (match.length === 3) { // MM:SS
        const [_, minutes, seconds] = match;
        return parseInt(minutes) * 60 + parseInt(seconds);
      }
    }
  }
  
  return 0;
};

// Convert seconds to timecode string (HH:MM:SS:FF)
export const secondsToTimecode = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00:00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30); // Assuming 30fps
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
};

// Extract timecodes from transcript text
export const extractTimecodes = (text: string): { timecode: string, index: number }[] => {
  const timecodeRegexes = [
    /(\d{2}):(\d{2}):(\d{2}):(\d{2})/g, // 00:01:23:15
    /(\d{2}):(\d{2}):(\d{2})\.(\d{2,3})/g, // 00:01:23.15 or 00:01:23.150
    /(\d{2}):(\d{2}):(\d{2})/g, // 00:01:23
  ];
  
  const results: { timecode: string, index: number }[] = [];
  
  timecodeRegexes.forEach(regex => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        timecode: match[0],
        index: match.index
      });
    }
  });
  
  return results.sort((a, b) => a.index - b.index);
};

// Parse transcript to add timecodes to words
export const parseTranscriptWithTimecodes = (transcript: string): TimecodedSegment[] => {
  // This is a simplified implementation - real implementation would be more sophisticated
  const segments: TimecodedSegment[] = [];
  const timecodes = extractTimecodes(transcript);
  
  // Return empty array if no timecodes found
  if (timecodes.length < 2) return segments;
  
  for (let i = 0; i < timecodes.length - 1; i++) {
    const startIndex = timecodes[i].index + timecodes[i].timecode.length;
    const endIndex = timecodes[i + 1].index;
    
    if (endIndex > startIndex) {
      const segmentText = transcript.substring(startIndex, endIndex).trim();
      // Split by words while preserving punctuation
      const wordMatches = segmentText.match(/[\w']+|[.,!?;:]/g) || [];
      
      const startTime = timecodeToSeconds(timecodes[i].timecode);
      const endTime = timecodeToSeconds(timecodes[i + 1].timecode);
      const duration = endTime - startTime;
      
      const timecodedWords: TimecodedWord[] = [];
      let currentPosition = 0;
      let currentText = '';
      
      wordMatches.forEach((wordOrPunctuation, idx) => {
        // Estimate timecode for each word based on position in segment
        // For more accurate results, this would use the word length and position
        const progress = idx / wordMatches.length;
        const estimatedTime = startTime + (progress * duration);
        
        // Handle punctuation by attaching it to the previous word if possible
        if (/^[.,!?;:]$/.test(wordOrPunctuation)) {
          if (timecodedWords.length > 0) {
            // Attach punctuation to the last word
            const lastWordIndex = timecodedWords.length - 1;
            timecodedWords[lastWordIndex].word += wordOrPunctuation;
          } else {
            // If no previous word, create a new word entry just for punctuation
            timecodedWords.push({
              word: wordOrPunctuation,
              timecode: secondsToTimecode(estimatedTime),
              startTime: estimatedTime
            });
          }
        } else {
          // Regular word
          timecodedWords.push({
            word: wordOrPunctuation,
            timecode: secondsToTimecode(estimatedTime),
            startTime: estimatedTime
          });
        }
        
        currentText += wordOrPunctuation + ' ';
        currentPosition += wordOrPunctuation.length + 1; // +1 for the space
      });
      
      segments.push({
        text: segmentText,
        words: timecodedWords,
        startTimecode: timecodes[i].timecode,
        endTimecode: timecodes[i + 1].timecode,
        startTime,
        endTime
      });
    }
  }
  
  return segments;
};

// Format timecode for display
export const formatTimecode = (timecode: string): string => {
  return timecode.replace(/\.\d+$/, ''); // Remove milliseconds if present
};

// Export types for use in other files
export type { TimecodedWord, TimecodedSegment };
