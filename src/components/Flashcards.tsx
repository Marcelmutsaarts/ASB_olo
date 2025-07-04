'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiHelpCircle, FiAward, FiBookOpen } from 'react-icons/fi';

// Originele data structuur
interface Flashcard {
  question: string;
  answer: string;
}

// Uitgebreide data structuur voor de "Overhoren" modus met SM-2 parameters
interface Sm2Flashcard extends Flashcard {
  id: number;
  interval: number; // Tijd in dagen tot volgende herhaling
  repetitions: number; // Aantal correcte herhalingen op rij
  easinessFactor: number; // Hoe makkelijk de kaart is (start op 2.5)
}

interface FlashcardsProps {
  data: Flashcard[];
}

// De Flashcards component wordt nu een 'wrapper' die de modus beheert
const Flashcards: React.FC<FlashcardsProps> = ({ data }) => {
  const [mode, setMode] = useState<'choice' | 'study' | 'test'>('choice');
  const [testDeck, setTestDeck] = useState<Sm2Flashcard[]>([]);

  // Initialiseer het "test deck" als de data prop beschikbaar is
  useEffect(() => {
    if (data && data.length > 0) {
      const initialDeck = data.map((card, index) => ({
        ...card,
        id: index,
        interval: 0,
        repetitions: 0,
        easinessFactor: 2.5,
      }));
      setTestDeck(initialDeck);
    }
  }, [data]);

  if (!data || data.length === 0) {
     return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-inner border border-gray-200">
        <div className="text-6xl mb-6 opacity-60">📭</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">Geen flashcards</h3>
        <p className="text-gray-500">Er is geen data voor flashcards beschikbaar of de data kon niet worden geladen.</p>
      </div>
    );
  }

  // Render het keuzescherm
  if (mode === 'choice') {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Kies je leermethode</h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">Hoe wil je de flashcards gebruiken? Vrij oefenen of jezelf slim overhoren?</p>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <button 
            onClick={() => setMode('study')} 
            className="group flex-1 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-transparent hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1"
          >
            <FiBookOpen className="text-5xl text-indigo-500 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Studiemodus</h3>
            <p className="text-gray-600">Blader vrij door de kaarten en bekijk de antwoorden in je eigen tempo. Ideaal voor een eerste kennismaking.</p>
          </button>
          <button 
            onClick={() => setMode('test')}
            className="group flex-1 p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-transparent hover:purple-500 transition-all duration-300 transform hover:-translate-y-1"
          >
            <FiAward className="text-5xl text-purple-500 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Overhoren</h3>
            <p className="text-gray-600">Test jezelf actief. Het slimme algoritme helpt je focussen op wat je nog moeilijk vindt. Maximaal leereffect.</p>
          </button>
        </div>
      </div>
    );
  }

  // Render de "Studiemodus" (de originele component)
  if (mode === 'study') {
    return <StudyMode data={data} onBack={() => setMode('choice')} />;
  }

  // Render de "Overhoren" modus
  if (mode === 'test') {
    // Hier komt de nieuwe component voor de "Overhoren" modus
    // Voor nu een placeholder:
    return <TestMode deck={testDeck} setDeck={setTestDeck} onBack={() => setMode('choice')} />;
  }
  
  return null;
};

// De originele component is nu "StudyMode"
const StudyMode: React.FC<{ data: Flashcard[], onBack: () => void }> = ({ data, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
  
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
      <div className="w-full text-left mb-4">
        <button onClick={onBack} className="text-sm text-indigo-600 hover:underline">
          &larr; Wissel modus
        </button>
      </div>
      <div className="text-center mb-8">
         <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          Studiemodus
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

// Placeholder voor de "Overhoren" modus component
const TestMode: React.FC<{ deck: Sm2Flashcard[], setDeck: React.Dispatch<React.SetStateAction<Sm2Flashcard[]>>, onBack: () => void }> = ({ deck, setDeck, onBack }) => {
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0); // Houdt het aantal 'beurten' bij

  if (!deck || deck.length === 0) {
    return <p>Geen kaarten om te overhoren.</p>;
  }

  // Bepaal welke kaarten nu aan de beurt zijn
  const dueCards = deck.filter(card => card.interval <= sessionCount && card.repetitions === 0);
  const newCards = deck.filter(card => card.repetitions === 0 && card.interval === 0);
  
  // Prioriteer kaarten die 'due' zijn, anders een nieuwe kaart
  const cardsToShow = dueCards.length > 0 ? dueCards : newCards;
  const currentCard = cardsToShow[0];
  const currentCardIndexInDeck = deck.findIndex(card => card.id === currentCard?.id);

  const handleCheckAnswer = async () => {
    if (!userAnswer.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentCard.question,
          correctAnswer: currentCard.answer,
          userAnswer: userAnswer,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsCorrect(data.isCorrect);
        setFeedback(data.feedback);
      } else {
        throw new Error(data.error || 'Er is een fout opgetreden bij het controleren van het antwoord.');
      }
    } catch (error) {
      console.error(error);
      // Fallback naar simpele controle bij API-fout
      const normalizedUserAnswer = userAnswer.trim().toLowerCase();
      const normalizedCorrectAnswer = currentCard.answer.trim().toLowerCase();
      setIsCorrect(normalizedUserAnswer === normalizedCorrectAnswer);
      setFeedback('Er was een probleem met de AI-feedback, we gebruiken de standaard controle.');
    } finally {
      setIsLoading(false);
      setIsAnswered(true);
    }
  };

  const handleNextCard = (quality: number) => {
    // SM-2 Algoritme implementatie
    const cardToUpdate = deck[currentCardIndexInDeck];

    let { easinessFactor, repetitions, interval } = cardToUpdate;

    if (quality >= 3) { // Correct antwoord
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easinessFactor);
      }
      repetitions += 1;
    } else { // Incorrect antwoord
      repetitions = 0;
      interval = 1;
    }

    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easinessFactor < 1.3) easinessFactor = 1.3;

    const updatedCard = { ...cardToUpdate, easinessFactor, repetitions, interval };
    
    // Update de state van het deck
    const newDeck = [...deck];
    newDeck[currentCardIndexInDeck] = updatedCard;
    setDeck(newDeck);
    
    // Reset state voor de volgende kaart
    setIsAnswered(false);
    setUserAnswer('');
    setIsCorrect(false);
    setFeedback('');
    
    // Verhoog de sessie teller om de 'tijd' te simuleren
    setSessionCount(prev => prev + 1);

    // De logica om de volgende kaart te kiezen wordt nu aan het begin van de component afgehandeld.
  };

  if (!currentCard) {
    return (
      <div className="text-center p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Goed gedaan!</h3>
        <p className="text-gray-600">Je hebt alle kaarten voor deze sessie gehad.</p>
        {/* Hier kan een knop komen om opnieuw te beginnen of de stats te zien */}
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 flex flex-col items-center">
       <div className="w-full text-left mb-4">
        <button onClick={onBack} className="text-sm text-indigo-600 hover:underline">
          &larr; Wissel modus
        </button>
      </div>
       <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg mb-4">
          <FiAward className="text-white text-3xl" />
        </div>
        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          Overhoren
        </h3>
        <p className="text-lg text-gray-500">
          Typ het antwoord en beoordeel hoe goed je het wist.
        </p>
      </div>

      {/* Kaart-weergave */}
      <div className="w-full bg-white rounded-2xl shadow-xl border p-8 mb-6">
        <p className="text-sm font-semibold text-indigo-600 mb-2">VRAAG</p>
        <p className="text-xl text-gray-800 leading-relaxed">{currentCard.question}</p>
      </div>

      {/* Antwoord sectie */}
      {!isAnswered ? (
        <div className="w-full mb-6">
          <input 
            type="text" 
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCheckAnswer()}
            placeholder="Typ hier je antwoord..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button 
            onClick={handleCheckAnswer}
            disabled={isLoading}
            className="w-full mt-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-wait"
          >
            {isLoading ? 'AI denkt na...' : 'Controleer Antwoord'}
          </button>
        </div>
      ) : (
        <div className="w-full mb-6 p-6 rounded-2xl animate-fadeIn" style={{backgroundColor: isCorrect ? '#f0fff4' : '#fff5f5'}}>
          <h4 className={`text-lg font-bold mb-3 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect ? '🎉 Correct!' : '🤔 Nog niet helemaal...'}
          </h4>
          <div className="space-y-3 text-gray-800">
             <p><strong className="font-semibold">Jouw antwoord:</strong> {userAnswer}</p>
            <div className="p-3 bg-white/60 rounded-lg">
              <p className="font-semibold text-indigo-700">Feedback van de AI Tutor:</p>
              <p>{feedback}</p>
            </div>
            {!isCorrect && <p><strong className="font-semibold">Beste antwoord:</strong> {currentCard.answer}</p>}
          </div>
          
          <div className="mt-6">
            <p className="text-center font-semibold text-gray-600 mb-3">Hoe goed wist je dit?</p>
            <div className="flex justify-around gap-2">
              <button onClick={() => handleNextCard(0)} className="flex-1 py-2 px-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors">Fout</button>
              <button onClick={() => handleNextCard(3)} className="flex-1 py-2 px-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors">Twijfel</button>
              <button onClick={() => handleNextCard(5)} className="flex-1 py-2 px-3 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors">Goed</button>
            </div>
          </div>
        </div>
      )}

       <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">
            Nog te gaan: {cardsToShow.length}
          </p>
        </div>
    </div>
  );
};


export default Flashcards; 