
import { useState } from 'react';
import { SearchResult } from '@/types';
import { Clipboard, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
    perfect: 'bg-match-perfect text-white',
    high: 'bg-match-high text-white',
    medium: 'bg-match-medium text-foreground',
    low: 'bg-match-low text-foreground',
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
        className="p-4 cursor-pointer"
        onClick={() => onSelect(result)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${matchColors[result.matchQuality]}`}>
              {result.matchScore}% match
            </div>
            {result.segments.length > 1 && (
              <span className="text-xs px-2 py-1 bg-secondary rounded">
                Frankenbite
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
        
        <div className="flex flex-wrap gap-2 mt-3">
          {result.segments.map((segment, index) => (
            <div 
              key={`${segment.startTimecode}-${index}`}
              className="flex items-center text-xs text-muted-foreground"
            >
              <span className="timecode bg-muted/50 px-1.5 py-0.5 rounded">
                {formatTimecode(segment.startTimecode)}
              </span>
              {index < result.segments.length - 1 && (
                <span className="mx-1">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 text-sm border-t border-border/50 mt-2">
          <h4 className="font-medium mb-2 text-xs text-muted-foreground">Source Segments:</h4>
          <div className="space-y-3">
            {result.segments.map((segment, index) => (
              <div key={`detail-${segment.startTimecode}-${index}`} className="segment-detail">
                <div className="flex items-center mb-1 text-xs">
                  <span className="timecode font-mono bg-muted/70 px-1.5 py-0.5 rounded">
                    {formatTimecode(segment.startTimecode)}
                  </span>
                  <span className="mx-1">→</span>
                  <span className="timecode font-mono bg-muted/70 px-1.5 py-0.5 rounded">
                    {formatTimecode(segment.endTimecode)}
                  </span>
                </div>
                <p className="text-xs">{segment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultItem;
