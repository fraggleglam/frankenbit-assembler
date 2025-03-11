
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
      const words = segmentText.split(/\s+/);
      const startTime = timecodeToSeconds(timecodes[i].timecode);
      const endTime = timecodeToSeconds(timecodes[i + 1].timecode);
      const duration = endTime - startTime;
      
      const timecodedWords: TimecodedWord[] = words.map((word, idx) => {
        // Estimate timecode for each word based on position in segment
        const progress = idx / words.length;
        const estimatedTime = startTime + (progress * duration);
        
        return {
          word: word,
          timecode: secondsToTimecode(estimatedTime),
          startTime: estimatedTime
        };
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
