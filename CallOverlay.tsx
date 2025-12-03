import React, { useEffect, useState, useRef } from 'react';
import { PhoneOff, Mic, MicOff, ChefHat, Info } from 'lucide-react';
import { GeminiLiveSession } from '../services/geminiService';

interface CallOverlayProps {
  onEndCall: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ onEndCall }) => {
  const [status, setStatus] = useState("Connecting...");
  const [isMuted, setIsMuted] = useState(false); // UI state only, real muting involves audio track disabling
  const sessionRef = useRef<GeminiLiveSession | null>(null);

  useEffect(() => {
    // Start session on mount
    const session = new GeminiLiveSession((newStatus) => {
      setStatus(newStatus);
      // Auto-close if disconnected
      if (newStatus === "Disconnected" || newStatus === "Connection Failed") {
        setTimeout(onEndCall, 1000);
      }
    });
    sessionRef.current = session;
    session.start();

    return () => {
      session.stop();
    };
  }, [onEndCall]);

  const toggleMute = () => {
    // In a real production app, we would toggle the MediaStreamTrack enabled state
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-between py-12 px-6 text-white animate-fade-in">
      
      {/* Header Info */}
      <div className="flex flex-col items-center gap-2 mt-8">
        <div className="bg-orange-600/20 p-2 rounded-full border border-orange-500/30">
          <Info size={16} className="text-orange-400" />
        </div>
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Cochin Spices Support</p>
      </div>

      {/* Main Visual */}
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Avatar Ring */}
        <div className="relative">
          {/* Pulsing rings */}
          <div className={`absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-20 ${status === 'Connected' ? 'animate-pulse' : ''}`}></div>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-t from-gray-800 to-gray-700 border-4 border-gray-600 flex items-center justify-center relative z-10 shadow-2xl">
            <ChefHat size={64} className="text-orange-500" />
          </div>
          {/* Live Indicator */}
          <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-gray-800 z-20"></div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Meenakshi</h2>
          <p className={`text-lg font-medium transition-colors duration-300 ${
            status === 'Connected' ? 'text-green-400' : 
            status === 'Connecting...' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {status}
          </p>
          <p className="text-sm text-gray-500 mt-1">Manager (Male Voice Assistant)</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs flex items-center justify-around mb-8">
        {/* Mute Button (Visual placeholder for this demo) */}
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all duration-200 ${
            isMuted ? 'bg-white text-gray-900' : 'bg-gray-700/50 text-white hover:bg-gray-700'
          }`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        {/* End Call Button */}
        <button 
          onClick={onEndCall}
          className="p-5 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all"
        >
          <PhoneOff size={32} />
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CallOverlay;
