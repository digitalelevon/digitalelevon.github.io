import React from 'react';
import { Message, Sender } from '../types';
import { User, ChefHat } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-orange-600' : 'bg-green-700'}`}>
          {isUser ? <User size={16} className="text-white" /> : <ChefHat size={16} className="text-white" />}
        </div>

        {/* Bubble */}
        <div
          className={`p-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
            isUser
              ? 'bg-orange-100 text-orange-900 rounded-br-none border border-orange-200'
              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
          <span className={`text-[10px] mt-1 block opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;