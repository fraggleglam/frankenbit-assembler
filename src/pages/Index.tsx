
import { useState, useEffect } from 'react';
import { Transcript, SearchResult, TimecodedSegment } from '@/types';
import { searchPhrases } from '@/utils/searchUtils';
import { parseTranscriptWithTimecodes } from '@/utils/timeCodeUtils';

import NavBar from '@/components/NavBar';
import TranscriptInput from '@/components/TranscriptInput';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import SearchBar from '@/components/SearchBar';
import ResultsPanel from '@/components/ResultsPanel';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

const Index = () => {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [segments, setSegments] = useState<TimecodedSegment[]>([]);
  const { toast } = useToast();

  // Load saved transcript from localStorage
  useEffect(() => {
    const savedTranscript = localStorage.getItem('current-transcript');
    if (savedTranscript) {
      try {
        setTranscript(JSON.parse(savedTranscript));
      } catch (e) {
        console.error('Failed to load saved transcript:', e);
      }
    }
  }, []);

  // Parse transcript into segments when it changes
  useEffect(() => {
    if (transcript) {
      const parsedSegments = parseTranscriptWithTimecodes(transcript.content);
      setSegments(parsedSegments);
      
      // Save to localStorage
      localStorage.setItem('current-transcript', JSON.stringify(transcript));
    }
  }, [transcript]);

  const handleNewTranscript = () => {
    setShowTranscriptInput(true);
  };

  const handleTranscriptSubmit = (content: string, name: string) => {
    const newTranscript: Transcript = {
      id: uuidv4(),
      name,
      content,
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    setTranscript(newTranscript);
    setShowTranscriptInput(false);
    setResults([]);
    setSelectedResult(null);
    setQuery('');
    
    toast({
      title: "Transcript loaded",
      description: `${name} is ready for searching.`,
    });
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    setSelectedResult(null);
    
    // Simulating a brief delay for UX purposes
    setTimeout(() => {
      const searchResults = searchPhrases(segments, searchQuery);
      setResults(searchResults);
      setIsSearching(false);
      
      // Notify user of results
      if (searchResults.length > 0) {
        toast({
          title: `${searchResults.length} matches found`,
          description: searchResults.length === 1 
            ? "1 potential match found for your phrase."
            : `${searchResults.length} potential matches found for your phrase.`,
        });
      }
    }, 600);
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      {/* NavBar */}
      <NavBar onNewTranscript={handleNewTranscript} />
      
      {/* Main Content */}
      <main className="flex-1 pt-20 pb-6 px-4 container mx-auto max-w-7xl">
        {showTranscriptInput ? (
          <div className="pt-12">
            <TranscriptInput 
              onTranscriptSubmit={handleTranscriptSubmit}
              onCancel={() => setShowTranscriptInput(false)}
            />
          </div>
        ) : (
          <>
            {/* Search Bar - Fixed at top */}
            <div className="glass rounded-2xl shadow-sm p-4 mb-6 mt-2">
              <SearchBar 
                onSearch={handleSearch}
                isSearching={isSearching}
                disabled={!transcript}
              />
            </div>
            
            {/* Transcript and Results Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-220px)]">
              {/* Transcript Display */}
              <div className="glass-card rounded-2xl overflow-hidden p-4 h-full flex flex-col">
                <TranscriptDisplay 
                  transcript={transcript} 
                  highlightedSegments={selectedResult?.segments}
                />
              </div>
              
              {/* Results Panel */}
              <div className="glass-card rounded-2xl overflow-hidden p-4 h-full flex flex-col">
                <ResultsPanel 
                  results={results}
                  query={query}
                  isSearching={isSearching}
                  onSelectResult={handleSelectResult}
                  selectedResult={selectedResult}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
