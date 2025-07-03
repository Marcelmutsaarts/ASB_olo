'use client';

import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardsProps {
  data: Flashcard[];
}

const Flashcards: React.FC<FlashcardsProps> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');

  if (!data || data.length === 0) {
     return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-inner border border-gray-200">
        <div className="text-6xl mb-6 opacity-60">📭</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">Geen flashcards</h3>
        <p className="text-gray-500">Er is geen data voor flashcards beschikbaar of de data kon niet worden geladen.</p>
      </div>
    );
  }

  const handleNext = () => {
    setSlideDirection('right');
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length);
      setSlideDirection('none');
    }, 150);
  };

  const handlePrev = () => {
    setSlideDirection('left');
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + data.length) % data.length);
      setSlideDirection('none');
    }, 150);
  };
  
  const card = data[currentIndex];
  
  let slideClass = '';
  if (slideDirection === 'right') {
    slideClass = 'animate-slide-out-left';
  } else if (slideDirection === 'left') {
    slideClass = 'animate-slide-out-right';
  }


  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      <div className="text-center mb-8">
         <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          Digitale Flashcards
        </h3>
        <p className="text-lg text-gray-500">
          Klik op de kaart om het antwoord te zien.
        </p>
      </div>

      <div className="w-full h-80 perspective-1000 mb-6">
        <div
          className={`relative w-full h-full cursor-pointer transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} ${slideClass}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="card-face card-front absolute w-full h-full backface-hidden flex items-center justify-center p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-100 transition-shadow duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg">
                <FiHelpCircle className="text-white text-2xl" />
              </div>
              <p className="text-xl font-semibold text-gray-800 leading-relaxed">{card.question}</p>
            </div>
          </div>
          <div className="card-face card-back absolute w-full h-full backface-hidden flex items-center justify-center p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl text-white transform rotate-y-180">
            <div className="text-center">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 mx-auto">
                <FiCheckCircle className="text-white text-2xl" />
              </div>
              <p className="text-xl leading-relaxed font-medium">{card.answer}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-sm">
        <button 
          onClick={handlePrev} 
          className="p-4 rounded-full bg-white shadow-md hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Vorige kaart"
        >
          <FiChevronLeft className="text-gray-700 text-2xl" />
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">
            {currentIndex + 1} / {data.length}
          </p>
          <p className="text-sm text-gray-500">Kaart</p>
        </div>
        <button 
          onClick={handleNext}
          className="p-4 rounded-full bg-white shadow-md hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Volgende kaart"
        >
          <FiChevronRight className="text-gray-700 text-2xl" />
        </button>
      </div>
    </div>
  );
};

export default Flashcards; 