
import { useState, useEffect, useRef } from 'react';
import { Transcript, TimecodedSegment } from '@/types';
import { parseTranscriptWithTimecodes, formatTimecode } from '@/utils/timeCodeUtils';
import { Clock } from 'lucide-react';

interface TranscriptDisplayProps {
  transcript: Transcript | null;
  highlightedSegments?: TimecodedSegment[];
}

const TranscriptDisplay = ({ transcript, highlightedSegments = [] }: TranscriptDisplayProps) => {
  const [segments, setSegments] = useState<TimecodedSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) {
      setIsProcessing(true);
      
      // Process transcript to identify timecodes and segments
      // Using a timeout to prevent UI freezing for large transcripts
      const timer = setTimeout(() => {
        const parsedSegments = parseTranscriptWithTimecodes(transcript.content);
        setSegments(parsedSegments);
        setIsProcessing(false);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setSegments([]);
    }
  }, [transcript]);

  useEffect(() => {
    // Scroll to the first highlighted segment if any
    if (highlightedSegments?.length && containerRef.current) {
      const segmentId = `segment-${highlightedSegments[0].startTimecode.replace(/:/g, '-')}`;
      const element = document.getElementById(segmentId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedSegments]);

  const isSegmentHighlighted = (segment: TimecodedSegment): boolean => {
    return highlightedSegments.some(
      s => s.startTimecode === segment.startTimecode && s.endTimecode === segment.endTimecode
    );
  };

  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="glass-card rounded-xl px-8 py-10 max-w-md">
          <h3 className="text-xl font-semibold mb-4">No Transcript Loaded</h3>
          <p className="text-muted-foreground mb-6">
            Import a transcript to begin searching for frankenbites.
          </p>
          <div className="inline-flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Clock size={16} />
            <span>Your transcript should include timecodes</span>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="glass-card rounded-xl px-8 py-6 animate-pulse-soft">
          <h3 className="text-lg font-medium mb-2">Processing Transcript</h3>
          <p className="text-muted-foreground">Analyzing timecodes and segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="transcript-container px-1 py-4 h-full overflow-y-auto thin-scrollbar"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{transcript.name}</h2>
        <p className="text-sm text-muted-foreground">
          {segments.length} segments with timecodes
        </p>
      </div>

      {segments.length === 0 ? (
        <div className="glass-card rounded-xl p-4 my-4">
          <p className="text-muted-foreground mb-2">No timecodes detected in this transcript.</p>
          <p className="text-sm">
            For best results, ensure your transcript includes timecodes in a standard format (00:00:00).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {segments.map((segment, index) => {
            const isHighlighted = isSegmentHighlighted(segment);
            return (
              <div 
                key={`${segment.startTimecode}-${index}`}
                id={`segment-${segment.startTimecode.replace(/:/g, '-')}`}
                className={`segment p-4 rounded-lg transition-all duration-300 ${
                  isHighlighted 
                    ? 'bg-primary/10 border border-primary/30 shadow-md' 
                    : 'hover:bg-accent/5 border border-transparent'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="timecode text-xs px-2 py-1 rounded bg-muted font-medium">
                    {formatTimecode(segment.startTimecode)}
                  </span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="timecode text-xs px-2 py-1 rounded bg-muted font-medium">
                    {formatTimecode(segment.endTimecode)}
                  </span>
                </div>
                
                <p className="segment-text">
                  {/* If highlighted, show word-by-word with each word potentially highlightable */}
                  {isHighlighted ? (
                    <span>
                      {segment.words.map((word, wordIdx) => {
                        // Simplified - in a real implementation, you'd determine which words match the search
                        const isMatchedWord = false; // This would be determined by your search algorithm
                        return (
                          <span 
                            key={wordIdx}
                            className={`word-highlight ${isMatchedWord ? 'bg-primary/20 px-1 rounded' : ''}`}
                          >
                            {word.word}{' '}
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    // Regular rendering for non-highlighted segments
                    segment.text
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
