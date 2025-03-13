
import React, { useState } from 'react';
import { SearchResult, TimecodedWord } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimecode } from '@/utils/timeCodeUtils';
import { Clock, Zap, BarChart3, Scissors } from 'lucide-react';

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

  // Calculate a visual representation of cuts between segments
  const getCutPoints = () => {
    const cuts: number[] = [];
    if (result.segments.length <= 1) return cuts;
    
    let wordCount = 0;
    result.segments.forEach((segment, index) => {
      if (index < result.segments.length - 1) {
        wordCount += segment.words.length;
        cuts.push(wordCount);
      }
    });
    
    return cuts;
  };

  const cutPoints = getCutPoints();

  return (
    <div className="assembled-bite p-4 bg-accent/20 backdrop-blur-sm border border-accent/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Zap size={14} className="text-primary" />
          Assembled Frankenbite
        </h3>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
            result.matchQuality === 'perfect' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
            result.matchQuality === 'high' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
            result.matchQuality === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
            'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
          }`}>
            <BarChart3 size={12} />
            <span>{result.matchScore}% match</span>
          </div>
          
          {hoveredWord && (
            <div className="text-xs font-mono bg-background/80 px-2 py-1 rounded-md border border-border">
              {formatTimecode(hoveredWord.timecode)}
            </div>
          )}
        </div>
      </div>

      {/* Timeline visualization for frankenbite segments */}
      {result.segments.length > 1 && (
        <div className="relative h-6 mb-3 bg-background/50 rounded-md overflow-hidden">
          {result.segments.map((segment, index) => {
            const width = `${100 / result.segments.length}%`;
            const left = `${(index * 100) / result.segments.length}%`;
            
            return (
              <React.Fragment key={`timeline-${index}`}>
                <div 
                  className={`absolute top-0 h-full ${segmentColors[index % segmentColors.length]}`}
                  style={{ width, left }}
                >
                  <div className="px-2 text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatTimecode(segment.startTimecode)}
                  </div>
                </div>
                
                {index < result.segments.length - 1 && (
                  <div 
                    className="absolute top-0 h-full flex items-center z-10"
                    style={{ left: `${((index + 1) * 100) / result.segments.length}%` }}
                  >
                    <div className="h-6 border-l-2 border-background flex items-center justify-center">
                      <div className="bg-background rounded-full p-0.5 -ml-1.5">
                        <Scissors size={10} className="text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <TooltipProvider delayDuration={100}>
        <div className="text-base leading-relaxed space-y-1">
          {/* Word-by-word display with tooltips */}
          <div className="flex flex-wrap gap-1 items-center">
            {wordsWithSegments.map((word, index) => {
              const style = getWordStyle(word.word, word.segmentIndex);
              // Strip punctuation for display purposes but keep for matching
              const displayWord = word.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
              const punctuation = word.word.replace(/[^.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
              
              // Is this a cut point between segments?
              const isCutPoint = cutPoints.includes(index);
              
              // Only show tooltip for meaningful words, not punctuation alone
              return (
                <React.Fragment key={index}>
                  {isCutPoint && (
                    <div className="h-6 border-l-2 border-dashed border-muted-foreground/30 mx-1" />
                  )}
                  
                  {displayWord ? (
                    <Tooltip>
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
                  ) : punctuation ? (
                    // Just show punctuation without tooltip
                    <span className="text-muted-foreground">{punctuation}</span>
                  ) : null}
                </React.Fragment>
              );
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
        {result.segments.length > 1 && (
          <div className="flex items-center">
            <Scissors size={12} className="mr-1.5 text-muted-foreground" />
            <span>Edit point</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssembledBite;
