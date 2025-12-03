import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender } from '../types';
import { initializeChat, sendMessageToGemini, speakText } from '../services/geminiService';
import { INITIAL_GREETING, APP_NAME } from '../constants';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import CallOverlay from './CallOverlay';
import { UtensilsCrossed, Volume2, VolumeX, Phone } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Initialize chat and set greeting
  useEffect(() => {
    const init = async () => {
      await initializeChat();
      setMessages([
        {
          id: 'init-1',
          sender: Sender.MODEL,
          text: INITIAL_GREETING,
          timestamp: new Date(),
        },
      ]);
      setIsInitialized(true);
    };
    init();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: Sender.MODEL,
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);

      if (isVoiceEnabled) {
        // Trigger TTS
        speakText(responseText);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const startCall = () => {
    setIsCallActive(true);
    // When switching to live call, we might want to disable the standard TTS to avoid conflict
    setIsVoiceEnabled(false);
  };

  const endCall = () => {
    setIsCallActive(false);
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-50 text-orange-800">
        <UtensilsCrossed className="animate-spin mb-4" size={48} />
        <p className="text-lg font-medium">Loading Cochin Spices...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {isCallActive && <CallOverlay onEndCall={endCall} />}

      {/* Header */}
      <header className="bg-gradient-to-r from-orange-700 to-red-800 text-white p-4 shadow-md z-10 sticky top-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <UtensilsCrossed size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{APP_NAME}</h1>
              <p className="text-xs text-orange-100 opacity-90">Meenakshi - Manager</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={startCall}
              className="p-2 rounded-full bg-green-600 text-white hover:bg-green-500 transition-colors shadow-lg animate-pulse"
              title="Start Live Call"
            >
              <Phone size={20} fill="currentColor" />
            </button>
            <button 
              onClick={toggleVoice}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title={isVoiceEnabled ? "Mute Voice Assistant" : "Enable Male Voice Assistant"}
            >
              {isVoiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} className="opacity-70" />}
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-3xl mx-auto">
           {/* Date Divider for aesthetics */}
           <div className="flex justify-center mb-6">
            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full uppercase tracking-wide font-medium">
              Today
            </span>
          </div>
          
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatInterface;
