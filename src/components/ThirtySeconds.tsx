'use client';

import React, { useState, useEffect } from 'react';
import { FiPlay, FiCheck, FiX, FiRefreshCw, FiAward } from 'react-icons/fi';
import { useStudent } from '@/contexts/StudentContext';
import { StudentProgress } from '@/utils/studentStorage';
import StudentStorage from '@/utils/studentStorage';

interface Card {
  id: number;
  terms: string[];
}

interface ThirtySecondsData {
  title: string;
  cards: Card[];
}

interface ThirtySecondsProps {
  data: ThirtySecondsData | null;
}

const ThirtySeconds: React.FC<ThirtySecondsProps> = ({ data }) => {
  const { currentStudent } = useStudent();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'round_finished' | 'all_cards_finished'>('idle');
  const [shuffledDeck, setShuffledDeck] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [termStatus, setTermStatus] = useState<('unanswered' | 'correct' | 'pass')[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  // Load student progress when component mounts or student changes
  useEffect(() => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(data.title);
      const savedProgress = StudentProgress.load(currentStudent.id, presentationId);
      
      if (savedProgress?.thirtySecondsProgress) {
        setCurrentCardIndex(savedProgress.thirtySecondsProgress.currentCard || 0);
        setTotalScore(savedProgress.thirtySecondsProgress.totalScore || 0);
        setRoundsPlayed(savedProgress.thirtySecondsProgress.roundsPlayed || 0);
        setGameState(savedProgress.thirtySecondsProgress.gameState || 'idle');
        
        // Restore shuffled deck if available
        if (savedProgress.thirtySecondsProgress.shuffledDeck) {
          setShuffledDeck(savedProgress.thirtySecondsProgress.shuffledDeck);
        }
      }
    }
  }, [currentStudent, data]);

  const saveProgress = () => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(data.title);
      const progress = {
        thirtySecondsProgress: {
          currentCard: currentCardIndex,
          totalScore,
          roundsPlayed,
          gameState,
          shuffledDeck,
          lastPlayed: new Date().toISOString()
        }
      };
      StudentProgress.save(currentStudent.id, presentationId, progress);
    }
  };

  const shuffleDeck = (deck: Card[]) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledDeck(shuffled);
    saveProgress();
  };

  useEffect(() => {
    if (data && data.cards && shuffledDeck.length === 0) {
      shuffleDeck(data.cards);
      setCurrentCardIndex(0);
    }
  }, [data, shuffledDeck.length]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('round_finished');
      setTotalScore(prev => prev + score);
      setRoundsPlayed(prev => prev + 1);
      saveProgress();
    }
  }, [gameState, timeLeft, score]);

  const startRound = () => {
    setTimeLeft(30);
    setScore(0);
    setGameState('playing');
    setTermStatus(new Array(shuffledDeck[currentCardIndex].terms.length).fill('unanswered'));
    saveProgress();
  };
  
  const handleNextCard = () => {
    const nextIndex = currentCardIndex + 1;
    if (nextIndex >= shuffledDeck.length) {
      setGameState('all_cards_finished');
    } else {
      setCurrentCardIndex(nextIndex);
      setGameState('idle');
    }
    saveProgress();
  }

  const restartGame = () => {
    if (data?.cards) {
      shuffleDeck(data.cards);
    }
    setCurrentCardIndex(0);
    setGameState('idle');
    setTotalScore(0);
    setRoundsPlayed(0);
    saveProgress();
  };

  const handleTermClick = (index: number, newStatus: 'correct' | 'pass') => {
    if (termStatus[index] !== 'unanswered') return;

    const newTermStatus = [...termStatus];
    newTermStatus[index] = newStatus;
    setTermStatus(newTermStatus);

    if (newStatus === 'correct') {
      setScore(score + 1);
    }
  };

  if (!data || !shuffledDeck || shuffledDeck.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center">
        <h3 className="text-2xl font-semibold">30 Seconds wordt voorbereid...</h3>
      </div>
    );
  }

  const currentCard = shuffledDeck[currentCardIndex];

  if (gameState === 'idle') {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{data.title}</h2>
        <p className="text-lg text-gray-600 mb-2">Kaart {currentCardIndex + 1} van {shuffledDeck.length}</p>
        {roundsPlayed > 0 && (
          <p className="text-lg text-blue-600 mb-2">Totaalscore: {totalScore} ({roundsPlayed} rondes)</p>
        )}
        <p className="text-lg text-gray-600 mb-8">Klaar voor de volgende ronde?</p>
        <button
          onClick={startRound}
          className="px-10 py-5 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-2xl hover:scale-105 transition-transform text-2xl flex items-center justify-center mx-auto"
        >
          <FiPlay className="mr-3" /> Start
        </button>
      </div>
    );
  }

  if (gameState === 'all_cards_finished') {
    return (
     <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl shadow-xl">
       <FiAward className="text-6xl text-yellow-500 mx-auto mb-4" />
       <h2 className="text-3xl font-bold text-gray-800 mb-2">Alle kaarten gespeeld!</h2>
       <p className="text-lg text-gray-600 mb-4">Goed gedaan! Je hebt de hele set voltooid.</p>
       <p className="text-2xl text-blue-600 mb-8">Eindscore: {totalScore} punten</p>
       <button
         onClick={restartGame}
         className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
       >
         <FiRefreshCw className="mr-2" /> Opnieuw Spelen
       </button>
     </div>
   );
  }
  
  if (gameState === 'round_finished') {
     return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl shadow-xl">
        <FiAward className="text-6xl text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Tijd is om!</h2>
        <p className="text-3xl text-gray-600 mb-4">
          Ronde score: <span className="font-bold text-green-600">{score}</span>
        </p>
        <p className="text-xl text-blue-600 mb-8">
          Totaalscore: <span className="font-bold">{totalScore + score}</span>
        </p>
        <button
          onClick={handleNextCard}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          <FiRefreshCw className="mr-2" /> Volgende Kaart
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kaart {currentCardIndex + 1} / {shuffledDeck.length}</h2>
        <div className={`text-5xl font-mono px-4 py-2 rounded-lg shadow-lg ${timeLeft < 10 ? 'bg-red-500/80 text-white animate-pulse' : 'bg-gray-800 text-white'}`}>
          {timeLeft}
        </div>
      </div>
      
      <div className="space-y-3">
        {currentCard.terms.map((term, index) => (
          <div key={index} className={`p-4 rounded-lg flex justify-between items-center transition-all ${
            termStatus[index] === 'correct' ? 'bg-green-100' :
            termStatus[index] === 'pass' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            <span className={`text-lg font-medium ${
              termStatus[index] !== 'unanswered' ? 'line-through text-gray-400' : 'text-gray-800'
            }`}>
              {term}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleTermClick(index, 'correct')}
                disabled={termStatus[index] !== 'unanswered'}
                className="p-2 rounded-full bg-green-500 text-white disabled:bg-gray-300"
              >
                <FiCheck />
              </button>
              <button
                onClick={() => handleTermClick(index, 'pass')}
                disabled={termStatus[index] !== 'unanswered'}
                className="p-2 rounded-full bg-red-500 text-white disabled:bg-gray-300"
              >
                <FiX />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThirtySeconds; 