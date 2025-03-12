import React, { useState } from 'react';
import { SearchResult, TimecodedWord } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimecode } from '@/utils/timeCodeUtils';
import { Clock, Zap } from 'lucide-react';

interface AssembledBiteProps {
  result: SearchResult;
}

const AssembledBite: React.FC<AssembledBiteProps> = ({ result }) => {
  const [hoveredWord, setHoveredWord] = useState<TimecodedWord | null>(null);

  // Function to flatten all words from all segments
  const getAllWords = () => {
    const allWords: (TimecodedWord & { segmentIndex: number })[] = [];
    
    result.segments.forEach((segment, segmentIndex) => {
      segment.words.forEach(word => {
        allWords.push({ ...word, segmentIndex });
      });
    });
    
    return allWords;
  };

  // Get words array with segment indicators
  const wordsWithSegments = getAllWords();

  // Function to determine word style based on match
  const getWordStyle = (word: string, segmentIndex: number) => {
    // Determine if this is a primary match word or a filler word
    const isPrimaryMatch = result.matchText.toLowerCase().includes(word.toLowerCase());
    
    if (isPrimaryMatch) {
      // Different highlight color based on match quality
      switch (result.matchQuality) {
        case 'perfect':
          return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        case 'high':
          return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
        case 'medium':
          return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
        case 'low':
          return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
        default:
          return 'bg-primary/10 text-primary';
      }
    } else {
      // Filler word styling
      return 'text-muted-foreground dark:text-muted-foreground/70 italic';
    }
  };

  // Different segment markers colors
  const segmentColors = [
    'bg-blue-200 dark:bg-blue-800/50',
    'bg-purple-200 dark:bg-purple-800/50',
    'bg-pink-200 dark:bg-pink-800/50',
    'bg-teal-200 dark:bg-teal-800/50',
    'bg-amber-200 dark:bg-amber-800/50',
  ];

  return (
    <div className="assembled-bite p-4 bg-accent/20 backdrop-blur-sm rounded-xl border border-accent/30 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Zap size={14} className="text-primary" />
          Assembled Frankenbite
        </h3>
        {hoveredWord && (
          <div className="text-xs font-mono bg-background/80 px-2 py-1 rounded-md border border-border">
            {formatTimecode(hoveredWord.timecode)}
          </div>
        )}
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="text-base leading-relaxed space-y-1">
          {/* Word-by-word display with tooltips */}
          <div className="flex flex-wrap gap-1 items-center">
            {wordsWithSegments.map((word, index) => {
              const style = getWordStyle(word.word, word.segmentIndex);
              // Strip punctuation for display purposes but keep for matching
              const displayWord = word.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
              const punctuation = word.word.replace(/[^.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
              
              // Only show tooltip for meaningful words, not punctuation alone
              if (displayWord) {
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <span 
                        className={`word-item px-1.5 py-0.5 rounded-md ${style} transition-colors cursor-pointer 
                                  ${segmentColors[word.segmentIndex % segmentColors.length]} border border-background/10`}
                        onMouseEnter={() => setHoveredWord(word)}
                        onMouseLeave={() => setHoveredWord(null)}
                      >
                        {displayWord}{punctuation}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="flex items-center space-x-2">
                      <Clock size={12} />
                      <span>{formatTimecode(word.timecode)}</span>
                    </TooltipContent>
                  </Tooltip>
                );
              } else if (punctuation) {
                // Just show punctuation without tooltip
                return <span key={index} className="text-muted-foreground">{punctuation}</span>;
              }
              return null;
            })}
          </div>
        </div>
      </TooltipProvider>

      {/* Legend for word colors */}
      <div className="flex flex-wrap gap-2 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
          <span>Perfect match</span>
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
          <span>Partial match</span>
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-muted mr-1.5"></span>
          <span>Filler words</span>
        </div>
      </div>
    </div>
  );
};

export default AssembledBite;
