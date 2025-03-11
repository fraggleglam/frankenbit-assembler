
import { useState, useEffect } from 'react';
import { Search, FileText, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavBarProps {
  onNewTranscript: () => void;
}

const NavBar = ({ onNewTranscript }: NavBarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 panel-transition
        ${scrolled ? 'glass shadow-sm py-3' : 'py-4 bg-transparent'}`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-semibold">Frankenbiter</span>
          <div className="h-6 w-px bg-border mx-2"></div>
          <span className="text-muted-foreground text-sm hidden sm:inline-block">Assemble the perfect quote</span>
        </div>

        {isMobile ? (
          <button 
            className="p-2 rounded-full hover:bg-accent/10 transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <button 
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={onNewTranscript}
            >
              <FileText size={18} />
              <span>New Transcript</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background glass shadow-md py-4 animate-slide-in-up">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <button 
              className="flex items-center space-x-2 px-4 py-3 rounded-md hover:bg-accent/10 transition-colors w-full"
              onClick={onNewTranscript}
            >
              <FileText size={18} />
              <span>New Transcript</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
