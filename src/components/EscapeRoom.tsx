'use client';

import React, { useState, useEffect } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { StudentProgress, StudentChat } from '@/utils/studentStorage';
import StudentStorage from '@/utils/studentStorage';

// Interfaces voor de data structuur
interface Puzzle {
  id: number;
  question: string;
  answer: string;
  hints: string[];
  successFeedback: string;
}

interface EscapeRoomData {
  title: string;
  story: string;
  puzzles: Puzzle[];
  successMessage: string;
  failureMessage: string;
  durationInMinutes?: number; // Optioneel, voor backwards compatibility
}

interface EscapeRoomProps {
  data: EscapeRoomData | null;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const EscapeRoom: React.FC<EscapeRoomProps> = ({ data }) => {
  const { currentStudent } = useStudent();
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState((data?.durationInMinutes || 10) * 60);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load student progress when component mounts or student changes
  useEffect(() => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(data.title);
      const savedProgress = StudentProgress.load(currentStudent.id, presentationId);
      
      if (savedProgress?.escapeRoomProgress) {
        setCurrentPuzzleIndex(savedProgress.escapeRoomProgress.currentPuzzle || 0);
        setGameState(savedProgress.escapeRoomProgress.gameState || 'playing');
        setIsStarted(savedProgress.escapeRoomProgress.isStarted || false);
        setStartTime(savedProgress.escapeRoomProgress.startTime || null);
        
        // Calculate remaining time based on when the game was started
        if (savedProgress.escapeRoomProgress.startTime && savedProgress.escapeRoomProgress.isStarted) {
          const elapsedSeconds = Math.floor((Date.now() - savedProgress.escapeRoomProgress.startTime) / 1000);
          const totalTime = (data.durationInMinutes || 10) * 60;
          const remaining = Math.max(0, totalTime - elapsedSeconds);
          setTimeLeft(remaining);
          
          if (remaining <= 0 && savedProgress.escapeRoomProgress.gameState === 'playing') {
            setGameState('lost');
          }
        }
        
        // Load chat history for current puzzle
        loadChatHistory(savedProgress.escapeRoomProgress.currentPuzzle || 0);
      }
    }
  }, [currentStudent, data]);

  const loadChatHistory = (puzzleIndex: number) => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(data.title);
      const chatData = StudentChat.load(currentStudent.id, presentationId, `puzzle_${puzzleIndex}`);
      setMessages(chatData.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        text: msg.content || msg.text
      })));
    }
  };

  const saveProgress = () => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(data.title);
      const progress = {
        escapeRoomProgress: {
          currentPuzzle: currentPuzzleIndex,
          gameState,
          isStarted,
          startTime,
          lastPlayed: new Date().toISOString()
        }
      };
      StudentProgress.save(currentStudent.id, presentationId, progress);
    }
  };

  const saveChatHistory = (history: { role: 'user' | 'model', text: string }[]) => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(data.title);
      const chatData = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text
      }));
      StudentChat.save(currentStudent.id, presentationId, chatData, `puzzle_${currentPuzzleIndex}`);
    }
  };

  useEffect(() => {
    if (!data) return;
    // Only reset time if no saved progress exists
    if (!currentStudent || !startTime) {
      setTimeLeft((data.durationInMinutes || 10) * 60);
    }
  }, [data, currentStudent, startTime]);

  useEffect(() => {
    if (!isStarted || gameState !== 'playing') return;

    if (timeLeft <= 0) {
      setGameState('lost');
      saveProgress();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          setGameState('lost');
          saveProgress();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, timeLeft, gameState]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = { role: 'user' as const, text: userInput };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/escaperoom-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzle: data!.puzzles[currentPuzzleIndex],
          userAnswer: userInput,
          chatHistory: newMessages.map(m => ({ role: m.role, parts: [{ text: m.text }]})),
        }),
      });
      const { response } = await res.json();
      
      if (response.startsWith('CORRECT:')) {
        const feedback = response.replace('CORRECT:', '').trim();
        setMessages(prev => [...prev, { role: 'model', text: feedback }]);
        
        if (currentPuzzleIndex === data!.puzzles.length - 1) {
          setGameState('won');
          saveProgress();
        } else {
          const nextPuzzleIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextPuzzleIndex);
          setMessages([]); // Reset chat for next puzzle
          saveProgress();
          
          // Load chat history for next puzzle
          loadChatHistory(nextPuzzleIndex);
        }
      } else {
        const updatedHistory = [...newMessages, { role: 'model' as const, text: response }];
        setMessages(updatedHistory);
        saveChatHistory(updatedHistory);
      }

    } catch (error) {
      console.error(error);
      const errorHistory = [...newMessages, { role: 'model' as const, text: 'Sorry, de Game Master heeft technische problemen.' }];
      setMessages(errorHistory);
      saveChatHistory(errorHistory);
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center bg-gray-50 rounded-lg shadow-inner">
        <div className="text-4xl mb-4">⏳</div>
        <h3 className="text-2xl font-semibold">Escape Room wordt voorbereid...</h3>
        <p className="text-gray-600">Geen data geladen. Probeer de leeromgeving opnieuw te genereren.</p>
      </div>
    );
  }
  
  const currentPuzzle = data.puzzles[currentPuzzleIndex];

  if (!isStarted) {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">{data.title}</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">{data.story}</p>
        <button 
          onClick={() => {
            setIsStarted(true);
            const now = Date.now();
            setStartTime(now);
            saveProgress();
          }}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
        >
          {currentStudent && startTime ? 'Hervat Escape Room' : 'Start de Escape Room'}
        </button>
      </div>
    )
  }

  if (gameState === 'won') {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">Ontsnapt!</h2>
        <p className="text-lg text-gray-100 mb-8">{data!.successMessage}</p>
      </div>
    )
  }

  if (gameState === 'lost') {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">Ontploft!</h2>
        <p className="text-lg text-gray-100 mb-8">{data!.failureMessage}</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-indigo-500/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-indigo-500/20">
        <h2 className="text-3xl font-bold text-white tracking-wider">{data.title}</h2>
        <div className={`text-4xl font-mono px-4 py-2 rounded-lg shadow-lg ${timeLeft < 60 ? 'bg-red-500/80 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-300'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Game Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Puzzel & Story */}
        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="font-bold text-xl text-indigo-300 mb-3">Puzzel {currentPuzzle.id} van {data.puzzles.length}</h3>
          <p className="text-lg text-gray-200 leading-relaxed">{currentPuzzle.question}</p>
        </div>

        {/* Interactie (Chat) */}
        <div className="bg-white/5 p-6 rounded-lg flex flex-col h-[400px]">
          <h3 className="font-bold text-xl text-green-300 mb-3">Interactie</h3>
          <div className="flex-grow overflow-y-auto space-y-3 pr-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <p className="text-gray-400">Game Master denkt na...</p>}
          </div>
          <div className="mt-4 flex">
            <input 
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Geef je antwoord..."
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-gray-500">
              Verstuur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscapeRoom; 