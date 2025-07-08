'use client';

import React, { useState, useEffect } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { StudentChat } from '@/utils/studentStorage';
import StudentStorage from '@/utils/studentStorage';

// Definieer types voor de berichten
interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  baseContent: string; // De inhoud die door de docent is verstrekt
  didactics: string; // Nieuwe prop
  pedagogy: string;  // Nieuwe prop
  level: string; // Nieuwe prop voor HBO-niveau
}

const Chatbot: React.FC<ChatbotProps> = ({ baseContent, didactics, pedagogy, level }) => {
  const { currentStudent } = useStudent();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Load chat history when student changes
  useEffect(() => {
    if (currentStudent && baseContent) {
      const presentationId = StudentStorage.generatePresentationId(baseContent);
      const chatHistory = StudentChat.load(currentStudent.id, presentationId, 'main');
      if (chatHistory.length > 0) {
        setMessages(chatHistory.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          text: msg.content || msg.text
        })));
        setIsStarted(true);
      }
    }
  }, [currentStudent, baseContent]);

  // Functie om het gesprek te starten
  const handleStartConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          baseContent,
          didactics,
          pedagogy,
          level
        }),
      });

      if (!response.ok) throw new Error('API call failed');
      
      const data = await response.json();
      const welcomeMsg: Message = { role: 'model', text: data.welcomeMessage };
      
      setMessages([welcomeMsg]);
      setIsStarted(true);
      
      // Save welcome message for student
      if (currentStudent) {
        const presentationId = StudentStorage.generatePresentationId(baseContent);
        const chatHistory = [{
          role: 'assistant',
          content: data.welcomeMessage
        }];
        StudentChat.save(currentStudent.id, presentationId, chatHistory, 'main');
      }

    } catch (error) {
      const errorMsg: Message = { role: 'model', text: 'Sorry, ik kon de openingsboodschap niet genereren. Controleer de API-instellingen.' };
      setMessages([errorMsg]);
      setIsStarted(true); // Start toch, maar met een foutmelding
      console.error("Fout bij het genereren van welkomstboodschap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages, // Stuur volledige geschiedenis
          baseContent,
          didactics,
          pedagogy,
          level
        }),
      });

      if (!response.ok) throw new Error('API call failed');
      const data = await response.json();
      const modelMessage: Message = { role: 'model', text: data.response };
      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);
      
      // Save chat history for student
      if (currentStudent) {
        const presentationId = StudentStorage.generatePresentationId(baseContent);
        const chatHistory = finalMessages.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.text
        }));
        StudentChat.save(currentStudent.id, presentationId, chatHistory, 'main');
      }
    } catch (error) {
      const errorMessage: Message = { role: 'model', text: 'Sorry, er is iets misgegaan bij de communicatie met de AI.' };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      // Save even error messages for student
      if (currentStudent) {
        const presentationId = StudentStorage.generatePresentationId(baseContent);
        const chatHistory = finalMessages.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.text
        }));
        StudentChat.save(currentStudent.id, presentationId, chatHistory, 'main');
      }
      console.error("Fout bij het aanroepen van de chat API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 sm:p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
          <span className="text-3xl">💬</span>
        </div>
        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
          AI Tutor Chatbot
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Stel vragen over de leerstof en krijg persoonlijke begeleiding van de AI-tutor.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50/50 relative">
          {!isStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
              <button
                onClick={handleStartConversation}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Moment...' : 'Start het gesprek'}
              </button>
              <p className="text-sm text-gray-600 mt-4">De AI zal het gesprek beginnen op basis van de leerstof.</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-4' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 mr-4 border border-gray-300'
              }`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}
          
          {isLoading && isStarted && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-6 py-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 mr-4 border border-gray-300 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">AI denkt na...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder={isStarted ? "Stel een vraag..." : "Start eerst het gesprek"}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-100"
              disabled={isLoading || !isStarted}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !isStarted}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Verstuur'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-8">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>AI-tutor actief</span>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 