
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MicIcon, History, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  disabled?: boolean;
}

const SearchBar = ({ onSearch, isSearching, disabled = false }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
    
    // Setup keyboard shortcut: Cmd/Ctrl + K to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate contextual suggestions based on query
  useEffect(() => {
    if (query.length > 2) {
      // These would ideally come from analysis of the transcript content
      // For now, we'll add some sample variations
      const exampleSuggestions = [
        `${query} and`,
        `${query} but`,
        `I think ${query}`,
        `${query} because`,
        `really ${query}`,
      ];
      setSuggestions(exampleSuggestions.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Save to search history
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={`search-container w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <form 
        onSubmit={handleSubmit} 
        className={`relative flex items-center w-full transition-all duration-200 ${
          isFocused 
            ? 'glass shadow-sm' 
            : 'bg-accent/20'
        } rounded-full px-4`}
      >
        <label htmlFor="search-input" className="sr-only">Search for a phrase</label>
        
        <div className="flex-shrink-0 text-muted-foreground">
          {isSearching ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </div>
        
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length > 2) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          placeholder="What do you want your subject to say?"
          className="w-full py-3 px-3 bg-transparent focus:outline-none"
          onFocus={() => {
            setIsFocused(true);
            if (query.length > 2) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delayed hide of suggestions to allow clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          disabled={disabled}
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="flex-shrink-0 p-1 rounded-full hover:bg-accent/30 transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        
        <div className="flex-shrink-0 ml-2">
          <kbd className="hidden sm:inline-flex items-center justify-center h-6 px-2 rounded border bg-muted text-xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </form>
      
      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg py-2">
          {suggestions.length > 0 && (
            <div className="px-3 py-1.5">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <Sparkles size={10} />
                <span>Suggestions</span>
              </h4>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}`}
                    className="block w-full text-left px-2 py-1.5 text-sm hover:bg-accent/20 rounded"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {searchHistory.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <History size={10} />
                <span>Recent searches</span>
              </h4>
              <div className="space-y-1">
                {searchHistory.map((item, index) => (
                  <button
                    key={`history-${index}`}
                    className="block w-full text-left px-2 py-1.5 text-sm hover:bg-accent/20 rounded truncate"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Help text */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-muted-foreground">
          Enter the phrase you want to make your subject say
        </div>
        
        <button 
          className="flex items-center text-xs text-primary gap-1 px-2 py-0.5 rounded-full bg-primary/5 hover:bg-primary/10"
          title="Speak to search"
        >
          <MicIcon size={12} />
          <span className="hidden sm:inline">Voice search</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
