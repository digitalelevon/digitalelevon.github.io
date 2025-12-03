import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Mic, MicOff } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'ml-IN'; // Malayalam
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      // Auto-submit could be enabled here, but let's let the user verify first
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  return (
    <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 w-full pb-8 md:pb-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto relative flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all shadow-sm"
      >
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading}
          className={`mb-2 p-2 rounded-full flex-shrink-0 transition-colors ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
          title="Speak (Malayalam)"
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ഇവിടെ ടൈപ്പ് ചെയ്യുക... (Type here...)"
          rows={1}
          className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 text-gray-800 placeholder-gray-500 max-h-32"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`mb-2 p-2 rounded-full flex-shrink-0 transition-colors ${
            inputText.trim() && !isLoading
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
};

export default InputArea;
