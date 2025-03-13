
import { useState } from 'react';
import { SearchResult } from '@/types';
import { Clipboard, Check, ChevronDown, ChevronUp, Clock, FileCopy, BarChart3, Scissors } from 'lucide-react';
import { formatTimecode } from '@/utils/timeCodeUtils';
import { toast } from '@/components/ui/use-toast';

interface ResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  isSelected: boolean;
}

const ResultItem = ({ result, onSelect, isSelected }: ResultItemProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Colors based on match quality
  const matchColors = {
    perfect: 'bg-green-500 text-white',
    high: 'bg-emerald-500 text-white',
    medium: 'bg-amber-500 text-foreground',
    low: 'bg-orange-500 text-foreground',
  };

  const handleCopy = () => {
    // Format the text with timecodes for clipboard
    const formattedText = result.segments
      .map(seg => `${formatTimecode(seg.startTimecode)} "${seg.text}"`)
      .join('\n');
    
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Timecodes and text copied for editing",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Highlight the main matched text
  const highlightMatchedText = (text: string) => {
    const words = text.split(' ');
    
    // Simplified approach - just highlight the text based on match quality
    const highlightClass = {
      perfect: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      high: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
      low: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    }[result.matchQuality];

    return (
      <span className={`px-1 py-0.5 rounded ${highlightClass}`}>
        {text}
      </span>
    );
  };

  return (
    <div 
      className={`result-item rounded-xl transition-all duration-200 overflow-hidden ${
        isSelected 
          ? 'glass-card shadow-md border-2 border-primary/40' 
          : 'bg-card hover:glass-card border border-border'
      }`}
    >
      <div 
        className="px-4 pt-4 pb-3 cursor-pointer"
        onClick={() => onSelect(result)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${matchColors[result.matchQuality]}`}>
              <BarChart3 size={14} />
              <span>{result.matchScore}% match</span>
            </div>
            {result.segments.length > 1 && (
              <span className="text-xs px-2 py-1 bg-secondary rounded-md flex items-center gap-1">
                <Scissors size={12} />
                <span>Frankenbite</span>
                <span className="text-muted-foreground ml-0.5">({result.segments.length} segments)</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-1.5 rounded-full hover:bg-accent/30 transition-colors"
              aria-label="Copy to clipboard"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className="p-1.5 rounded-full hover:bg-accent/30 transition-colors"
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        
        <p className="text-sm font-medium leading-relaxed">
          {highlightMatchedText(result.matchText)}
        </p>
        
        {/* Simple timeline visualization */}
        {result.segments.length > 0 && (
          <div className="mt-3 mb-1">
            <div className="flex items-center h-6 relative bg-secondary/30 rounded-md overflow-hidden">
              {result.segments.map((segment, index) => {
                const width = `${100 / result.segments.length}%`;
                const left = `${(index * 100) / result.segments.length}%`;
                
                return (
                  <div 
                    key={`timeline-mini-${index}`}
                    className={`absolute h-full ${
                      index % 2 === 0 ? 'bg-primary/20' : 'bg-primary/30'
                    }`}
                    style={{ width, left }}
                  >
                    <div className="px-1 py-0.5 text-xs font-mono whitespace-nowrap overflow-hidden">
                      {formatTimecode(segment.startTimecode)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 text-sm border-t border-border/50 mt-2">
          <h4 className="font-medium mb-2 text-xs text-muted-foreground">Source Segments:</h4>
          <div className="space-y-3">
            {result.segments.map((segment, index) => (
              <div key={`detail-${segment.startTimecode}-${index}`} className="segment-detail p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-background/50">Segment {index + 1}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="font-mono bg-background/70 px-1.5 py-0.5 rounded">
                      {formatTimecode(segment.startTimecode)} → {formatTimecode(segment.endTimecode)}
                    </span>
                  </div>
                </div>
                <p className="text-xs mt-2">{segment.text}</p>
                
                <div className="flex justify-end mt-2">
                  <button 
                    className="flex items-center gap-1 text-xs py-1 px-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${formatTimecode(segment.startTimecode)} "${segment.text}"`);
                      toast({
                        title: "Copied segment",
                        description: "Timecode and text copied to clipboard",
                      });
                    }}
                  >
                    <FileCopy size={12} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultItem;
