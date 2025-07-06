'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiHelpCircle, FiAward, FiBookOpen, FiPlus } from 'react-icons/fi';

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

// --- Componenten buiten de hoofd-component geplaatst om hoisting problemen te voorkomen ---

// De "Studiemodus" component
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
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Voeg een kaart toe om te beginnen met studeren.</p>
      </div>
    );
  }

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

// De "Overhoren" modus component
const TestMode: React.FC<{ deck: Sm2Flashcard[], setDeck: React.Dispatch<React.SetStateAction<Sm2Flashcard[]>>, onBack: () => void }> = ({ deck, setDeck, onBack }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0); // Houdt het aantal 'beurten' bij

  if (!deck || deck.length === 0) {
     return (
      <div className="text-center p-8">
        <button onClick={onBack} className="text-sm text-indigo-600 hover:underline mb-4">
          &larr; Wissel modus
        </button>
        <p className="text-gray-500">Voeg een kaart toe om te beginnen met overhoren.</p>
      </div>
    );
  }

  // Bepaal welke kaarten nu aan de beurt zijn
  const dueCards = deck.filter(card => card.interval <= sessionCount && card.repetitions === 0);
  const newCards = deck.filter(card => card.repetitions === 0 && card.interval === 0);
  
  // Prioriteer kaarten die 'due' zijn, anders een nieuwe kaart
  const cardsToShow = dueCards.length > 0 ? dueCards : newCards;
  
  if (cardsToShow.length === 0) {
     return (
       <div className="text-center p-8">
         <button onClick={onBack} className="text-sm text-indigo-600 hover:underline mb-4">
          &larr; Wissel modus
        </button>
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl shadow-lg mb-4 mx-auto flex items-center justify-center">
          <FiAward className="text-white text-3xl" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Goed gedaan!</h3>
        <p className="text-gray-600">Je bent door alle kaarten voor deze sessie heen. Kom later terug om de rest te herhalen.</p>
      </div>
    );
  }

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
      setFeedback(normalizedUserAnswer === normalizedCorrectAnswer ? 'Correct!' : `Het juiste antwoord is: ${currentCard.answer}`);
    } finally {
      setIsLoading(false);
      setIsAnswered(true);
    }
  };

  const handleNextCard = (quality: number) => {
    // Implementeer SM-2 logica
    const updatedDeck = [...deck];
    const cardToUpdate = updatedDeck[currentCardIndexInDeck];

    if (quality >= 3) { // Correct antwoord
      if (cardToUpdate.repetitions === 0) {
        cardToUpdate.interval = 1;
      } else if (cardToUpdate.repetitions === 1) {
        cardToUpdate.interval = 6;
      } else {
        cardToUpdate.interval = Math.round(cardToUpdate.interval * cardToUpdate.easinessFactor);
      }
      cardToUpdate.repetitions += 1;
    } else { // Incorrect antwoord
      cardToUpdate.repetitions = 0;
      cardToUpdate.interval = 1;
    }
    
    cardToUpdate.easinessFactor = Math.max(1.3, cardToUpdate.easinessFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    setDeck(updatedDeck);

    // Reset voor volgende kaart
    setUserAnswer('');
    setIsAnswered(false);
    setFeedback('');
    setIsCorrect(false);
    setSessionCount(prev => prev + 0.1); // Verhoog sessie lichtjes om re-render te triggeren
    //setCurrentCardIndex(prev => (prev + 1) % cardsToShow.length); // Simpele loop, kan slimmer
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div className="w-full text-left mb-4">
        <button onClick={onBack} className="text-sm text-indigo-600 hover:underline">
          &larr; Wissel modus
        </button>
      </div>
      <div className="text-center mb-8">
        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Overhoren</h3>
        <p className="text-lg text-gray-500">Beantwoord de vraag en controleer je antwoord.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
        <div className="mb-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-gray-500 mb-2">
            <FiHelpCircle className="text-indigo-500" />
            <span>Vraag</span>
          </div>
          <p className="text-xl text-gray-800">{currentCard?.question}</p>
        </div>
        <hr className="my-6 border-gray-200" />
        <div>
          <label htmlFor="userAnswer" className="flex items-center gap-3 text-lg font-semibold text-gray-500 mb-2">
            <FiCheckCircle className="text-purple-500" />
            <span>Jouw antwoord</span>
          </label>
          <textarea
            id="userAnswer"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isAnswered}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm disabled:bg-gray-50"
            placeholder="Typ hier je antwoord..."
            rows={3}
          />
        </div>
      </div>
      
      {!isAnswered ? (
        <button 
          onClick={handleCheckAnswer} 
          disabled={isLoading || !userAnswer.trim()}
          className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Aan het controleren...' : 'Controleer Antwoord'}
        </button>
      ) : (
        <div className={`p-6 rounded-2xl animate-in fade-in-50 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
          <h4 className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>{isCorrect ? 'Correct!' : 'Niet helemaal...'}</h4>
          <p className={`text- ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{feedback}</p>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Hoe goed kende je dit antwoord?</p>
            <div className="flex justify-center gap-2 sm:gap-4">
               <button onClick={() => handleNextCard(0)} className="flex-1 px-4 py-2 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition">Fout</button>
               <button onClick={() => handleNextCard(3)} className="flex-1 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition">Lastig</button>
               <button onClick={() => handleNextCard(5)} className="flex-1 px-4 py-2 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition">Makkelijk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// De Flashcards component is de 'wrapper' die de modus en state beheert
const Flashcards: React.FC<FlashcardsProps> = ({ data }) => {
  const [mode, setMode] = useState<'choice' | 'study' | 'test'>('choice');
  const [flashcardSet, setFlashcardSet] = useState<Flashcard[]>([]);
  const [testDeck, setTestDeck] = useState<Sm2Flashcard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  useEffect(() => {
    if (data && data.length > 0) {
      setFlashcardSet(data);
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

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim() && newAnswer.trim()) {
      const newCard: Flashcard = { question: newQuestion, answer: newAnswer };
      setFlashcardSet(currentSet => [...currentSet, newCard]);
      setTestDeck(currentDeck => {
        const newSm2Card: Sm2Flashcard = {
          ...newCard,
          id: currentDeck.length > 0 ? Math.max(...currentDeck.map(c => c.id)) + 1 : 0,
          interval: 0,
          repetitions: 0,
          easinessFactor: 2.5,
        };
        return [...currentDeck, newSm2Card];
      });
      setNewQuestion('');
      setNewAnswer('');
      setShowAddForm(false);
    }
  };
  
  const AddCardForm = (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Nieuwe Flashcard</h3>
        <form onSubmit={handleAddCard}>
          <div className="mb-4">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">Vraag</label>
            <textarea
              id="question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
              placeholder="Wat is de hoofdstad van Nederland?"
              rows={3}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">Antwoord</label>
            <textarea
              id="answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
              placeholder="Amsterdam"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition font-medium">
              Annuleren
            </button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition font-semibold shadow-sm">
              Kaart Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Fallback voor als er (nog) geen flashcards zijn gegenereerd.
  if (!data && flashcardSet.length === 0) {
     return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-inner border border-gray-200">
        <div className="text-6xl mb-6 opacity-60">📭</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">Geen flashcards</h3>
        <p className="text-gray-500">Er is geen data voor flashcards beschikbaar. Voeg zelf kaarten toe om te beginnen!</p>
        <div className="mt-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
          >
            <FiPlus />
            Voeg eerste kaart toe
          </button>
        </div>
         {showAddForm && AddCardForm}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {showAddForm && AddCardForm}
      <div className="w-full flex justify-center mb-8">
         <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-5 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
        >
          <FiPlus />
          Voeg kaart toe
        </button>
      </div>

      <div className="mt-4">
        {mode === 'choice' && (
          <div className="w-full text-center">
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
        )}

        {mode === 'study' && <StudyMode data={flashcardSet} onBack={() => setMode('choice')} />}
        
        {mode === 'test' && <TestMode deck={testDeck} setDeck={setTestDeck} onBack={() => setMode('choice')} />}
      </div>
    </div>
  );
};

export default Flashcards; 