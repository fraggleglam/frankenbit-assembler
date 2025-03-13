
import { SearchResult } from '@/types';
import ResultItem from './ResultItem';
import AssembledBite from './AssembledBite';
import { getNotFoundMessage } from '@/utils/searchUtils';
import { Sparkles, Search, Zap, BarChart3 } from 'lucide-react';

interface ResultsPanelProps {
  results: SearchResult[];
  query: string;
  isSearching: boolean;
  onSelectResult: (result: SearchResult) => void;
  selectedResult: SearchResult | null;
}

const ResultsPanel = ({ 
  results, 
  query, 
  isSearching, 
  onSelectResult,
  selectedResult
}: ResultsPanelProps) => {
  
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="glass-card rounded-xl p-6 text-center animate-pulse-soft">
          <div className="flex justify-center mb-4">
            <Search size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Searching for frankenbites...</h3>
          <p className="text-muted-foreground text-sm">Finding the perfect words</p>
        </div>
      </div>
    );
  }
  
  if (query && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="glass-card rounded-xl p-6 text-center max-w-md">
          <h3 className="text-lg font-medium mb-2">{getNotFoundMessage()}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Try searching for a different phrase or simplify your search.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="glass-card rounded-xl p-6 text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Sparkles size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Ready to create frankenbites</h3>
          <p className="text-muted-foreground text-sm">
            Enter a phrase in the search box to find matches or construct a frankenbite
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="results-container flex flex-col h-full overflow-hidden">
      {/* Header section with result stats */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <span>{results.length} Results</span>
          </h3>
          <div className="text-sm px-2 py-1 rounded-md bg-secondary/50 font-medium">
            Ranked by match quality
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {results.length > 0
            ? "Click a result to see its detailed breakdown and source locations"
            : "No matches found. Try another phrase."
          }
        </p>
      </div>
      
      {/* Display the assembled bite for the selected result */}
      {selectedResult && (
        <div className="border-b border-border/40">
          <AssembledBite result={selectedResult} />
        </div>
      )}
      
      {/* Results scrollable list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-3">
        <div className="space-y-4">
          {results.map((result) => (
            <ResultItem 
              key={result.id} 
              result={result} 
              onSelect={onSelectResult}
              isSelected={selectedResult?.id === result.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
