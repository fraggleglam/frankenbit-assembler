
import { SearchResult } from '@/types';
import ResultItem from './ResultItem';
import { getNotFoundMessage } from '@/utils/searchUtils';
import { Sparkles, Search } from 'lucide-react';

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
    <div className="results-container p-3">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1">{results.length} Results</h3>
        <p className="text-sm text-muted-foreground">
          {results.length > 0
            ? "Click a result to highlight its source in the transcript"
            : "No matches found. Try another phrase."
          }
        </p>
      </div>
      
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
  );
};

export default ResultsPanel;
