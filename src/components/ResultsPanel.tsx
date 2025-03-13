
import { useState } from 'react';
import { SearchResult } from '@/types';
import ResultItem from './ResultItem';
import AssembledBite from './AssembledBite';
import { getNotFoundMessage } from '@/utils/searchUtils';
import { Sparkles, Search, Zap, BarChart3, SlidersHorizontal, Clock, Users, Filter } from 'lucide-react';

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
  // New state for filtering and sorting
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'segments' | 'length'>('score');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and sort results based on user preferences
  const filteredResults = results.filter(result => {
    if (filterQuality === 'all') return true;
    return result.matchQuality === filterQuality;
  });
  
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'score') return b.matchScore - a.matchScore;
    if (sortBy === 'segments') return b.segments.length - a.segments.length;
    if (sortBy === 'length') {
      return b.matchText.length - a.matchText.length;
    }
    return 0;
  });
  
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
          <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-sm">
            <p className="mb-2 font-medium">Pro Tips:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Use specific phrases for better matching</li>
              <li>• Try variations if you don't find exact matches</li>
              <li>• Simpler phrases often yield better frankenbites</li>
              <li>• Click on matches to see detailed breakdowns</li>
            </ul>
          </div>
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
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-sm font-medium hover:bg-secondary/70 transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span>Filter & Sort</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="p-3 bg-secondary/20 rounded-lg mt-2 mb-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Match Quality</label>
              <select 
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                className="w-full text-sm p-1.5 rounded bg-background border border-border"
              >
                <option value="all">All Results</option>
                <option value="perfect">Perfect Matches</option>
                <option value="high">High Quality</option>
                <option value="medium">Medium Quality</option>
                <option value="low">Low Quality</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'segments' | 'length')}
                className="w-full text-sm p-1.5 rounded bg-background border border-border"
              >
                <option value="score">Match Score</option>
                <option value="segments">Number of Segments</option>
                <option value="length">Length of Phrase</option>
              </select>
            </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground">
          {results.length > 0
            ? `Found ${results.length} potential ways to construct "${query}"`
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
          {sortedResults.map((result, index) => (
            <ResultItem 
              key={result.id} 
              result={result} 
              onSelect={onSelectResult}
              isSelected={selectedResult?.id === result.id}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
