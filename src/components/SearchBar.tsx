
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  disabled?: boolean;
}

const SearchBar = ({ onSearch, isSearching, disabled = false }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a phrase to frankenbite..."
          className="w-full py-3 px-3 bg-transparent focus:outline-none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
      
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Type in the phrase you want to make your subject say
      </div>
    </div>
  );
};

export default SearchBar;
