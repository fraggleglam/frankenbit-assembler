
import { useState, useRef, useEffect } from 'react';
import { FileUp, Clipboard, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface TranscriptInputProps {
  onTranscriptSubmit: (transcript: string, name: string) => void;
  onCancel: () => void;
}

const TranscriptInput = ({ onTranscriptSubmit, onCancel }: TranscriptInputProps) => {
  const [transcript, setTranscript] = useState('');
  const [name, setName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setTranscript(clipboardText);
      if (!name && clipboardText.length > 0) {
        // Create a default name from the first few words
        const defaultName = clipboardText.split(' ').slice(0, 3).join(' ') + '...';
        setName(defaultName);
      }
      
      toast({
        title: "Clipboard content pasted",
        description: "Text has been added to the transcript field.",
      });
    } catch (err) {
      toast({
        title: "Unable to access clipboard",
        description: "Please paste the text manually or check browser permissions.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTranscript(content);
      // Use filename as transcript name if none set
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) {
      toast({
        title: "Empty transcript",
        description: "Please paste or upload a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Use a default name if none provided
    const transcriptName = name.trim() ? name : `Transcript ${new Date().toLocaleString()}`;
    
    // Simulate a short processing delay for better UX
    setTimeout(() => {
      onTranscriptSubmit(transcript, transcriptName);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-4xl mx-auto animation-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">New Transcript</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-accent/10 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="transcript-name" className="block text-sm font-medium mb-1">
          Transcript Name
        </label>
        <input
          id="transcript-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for this transcript"
          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-background"
        />
      </div>

      <div
        className={`relative mb-4 ${
          isDragging
            ? 'border-2 border-dashed border-primary bg-primary/5'
            : 'border border-input bg-transparent'
        } rounded-lg transition-all`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste or drop your transcript here..."
          className="w-full h-64 p-4 rounded-lg bg-transparent focus:outline-none focus:ring-0 resize-none"
        />
        
        {!transcript && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-center mb-2">
              {isDragging ? 'Drop to upload' : 'Drag & drop transcript file or paste content'}
            </p>
            <div className="flex space-x-4 pointer-events-auto">
              <button
                onClick={handlePaste}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors text-sm"
              >
                <Clipboard size={16} />
                <span>Paste from clipboard</span>
              </button>
              <label className="flex items-center space-x-2 px-4 py-2 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer text-sm">
                <FileUp size={16} />
                <span>Upload file</span>
                <input
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border hover:bg-accent/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-5 py-2 rounded-lg bg-primary text-primary-foreground transition-colors ${
            isSubmitting 
              ? 'opacity-70 cursor-not-allowed' 
              : 'hover:bg-primary/90'
          }`}
        >
          {isSubmitting ? 'Processing...' : 'Create Transcript'}
        </button>
      </div>
    </div>
  );
};

export default TranscriptInput;
