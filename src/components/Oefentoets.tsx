'use client';

import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiMessageSquare, FiAward } from 'react-icons/fi';
import { useStudent } from '@/contexts/StudentContext';
import { StudentProgress, StudentChat } from '@/utils/studentStorage';
import StudentStorage from '@/utils/studentStorage';

interface Question {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  feedback: string;
}

interface OefentoetsData {
  title: string;
  questions: Question[];
}

interface OefentoetsProps {
  data: OefentoetsData | null;
  baseContent?: string;
}

const Oefentoets: React.FC<OefentoetsProps> = ({ data, baseContent = '' }) => {
  const { currentStudent } = useStudent();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  
  // State voor de chat-functionaliteit
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load student progress when component mounts or student changes
  useEffect(() => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(baseContent || data.title);
      const savedProgress = StudentProgress.load(currentStudent.id, presentationId);
      
      if (savedProgress?.testProgress) {
        setCurrentQuestionIndex(savedProgress.testProgress.currentQuestion || 0);
        setScore(savedProgress.testProgress.score || 0);
        setAnswers(savedProgress.testProgress.answers || []);
        setIsFinished(savedProgress.testProgress.isFinished || false);
      } else {
        // Initialize answers array
        setAnswers(new Array(data.questions.length).fill(null));
      }
      
      // Load chat history for current question
      loadChatHistory(savedProgress?.testProgress?.currentQuestion || 0);
    } else if (data) {
      // Initialize for non-logged in users
      setAnswers(new Array(data.questions.length).fill(null));
    }
  }, [currentStudent, data]);

  const loadChatHistory = (questionIndex: number) => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(baseContent || data.title);
      const chatData = StudentChat.load(currentStudent.id, presentationId, `question_${questionIndex}`);
      setChatHistory(chatData.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        text: msg.content || msg.text
      })));
    }
  };

  const saveProgress = () => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(baseContent || data.title);
      const progress = {
        testProgress: {
          currentQuestion: currentQuestionIndex,
          score,
          answers,
          isFinished,
          lastAnswered: new Date().toISOString()
        }
      };
      StudentProgress.save(currentStudent.id, presentationId, progress);
    }
  };

  const saveChatHistory = (history: { role: 'user' | 'model', text: string }[]) => {
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(baseContent || data.title);
      const chatData = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text
      }));
      StudentChat.save(currentStudent.id, presentationId, chatData, `question_${currentQuestionIndex}`);
    }
  };

  if (!data || !data.questions || data.questions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center bg-gray-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold">Oefentoets wordt voorbereid...</h3>
        <p className="text-gray-600">Geen data geladen. Probeer de leeromgeving opnieuw te genereren.</p>
      </div>
    );
  }

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    const currentQuestion = data.questions[currentQuestionIndex];
    setSelectedAnswer(index);
    setShowFeedback(true);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);
    
    if (index === currentQuestion.correctOptionIndex) {
      setScore(prev => prev + 1);
    }
    
    // Save progress
    saveProgress();
    
    // Start de chat met een lege geschiedenis, de initiële feedback wordt apart getoond.
    setChatHistory([]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < data.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(answers[nextIndex]);
      setShowFeedback(answers[nextIndex] !== null);
      
      // Load chat history for next question
      loadChatHistory(nextIndex);
      
      // Save progress
      saveProgress();
    } else {
      setIsFinished(true);
      saveProgress();
    }
  };
  
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setIsFinished(false);
    setAnswers(data ? new Array(data.questions.length).fill(null) : []);
    setChatHistory([]);
    
    // Clear saved progress
    if (currentStudent && data) {
      const presentationId = StudentStorage.generatePresentationId(baseContent || data.title);
      StudentProgress.save(currentStudent.id, presentationId, {
        testProgress: {
          currentQuestion: 0,
          score: 0,
          answers: new Array(data.questions.length).fill(null),
          isFinished: false,
          lastAnswered: new Date().toISOString()
        }
      });
      
      // Clear all chat histories
      for (let i = 0; i < data.questions.length; i++) {
        StudentChat.save(currentStudent.id, presentationId, [], `question_${i}`);
      }
    }
  }

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const newHistory = [...chatHistory, { role: 'user' as const, text: chatInput }];
    const currentQuestion = data.questions[currentQuestionIndex];
    setChatHistory(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/oefentoets-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.questionText,
          correctAnswer: currentQuestion.options[currentQuestion.correctOptionIndex],
          userAnswer: currentQuestion.options[selectedAnswer!],
          feedback: currentQuestion.feedback,
          chatHistory: newHistory,
        }),
      });

      const { response } = await res.json();
      const updatedHistory = [...newHistory, { role: 'model' as const, text: response }];
      setChatHistory(updatedHistory);
      
      // Save chat history
      saveChatHistory(updatedHistory);

    } catch (error) {
      console.error(error);
      const errorHistory = [...newHistory, { role: 'model' as const, text: 'Sorry, de tutor heeft technische problemen.' }];
      setChatHistory(errorHistory);
      
      // Save even error messages
      saveChatHistory(errorHistory);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isFinished) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl shadow-xl">
        <FiAward className="text-6xl text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Toets Voltooid!</h2>
        <p className="text-2xl text-gray-600 mb-6">
          Jouw score: <span className="font-bold text-indigo-600">{score}</span> / <span className="font-bold text-indigo-600">{data.questions.length}</span>
        </p>
        <button
          onClick={handleRestart}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 bg-white rounded-2xl shadow-xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{data.title}</h2>
          <span className="text-lg font-semibold text-gray-600">
            Vraag {currentQuestionIndex + 1} / {data.questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / data.questions.length) * 100}%` }}></div>
        </div>
      </div>

      <div className="mb-6 p-6 bg-gray-50 rounded-xl">
        <p className="text-xl text-gray-800 leading-relaxed">{currentQuestion.questionText}</p>
      </div>

      <div className="space-y-4 mb-6">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = currentQuestion.correctOptionIndex === index;
          let buttonClass = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center';
          if (showFeedback) {
            if (isCorrect) {
              buttonClass += ' bg-green-100 border-green-500 text-green-800';
            } else if (isSelected && !isCorrect) {
              buttonClass += ' bg-red-100 border-red-500 text-red-800';
            } else {
               buttonClass += ' bg-gray-100 border-gray-300 text-gray-500 opacity-70';
            }
          } else {
            buttonClass += ' bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50';
          }

          return (
            <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showFeedback} className={buttonClass}>
              <span className="font-bold mr-4">{String.fromCharCode(65 + index)}.</span>
              <span>{option}</span>
              {showFeedback && isCorrect && <FiCheckCircle className="ml-auto text-green-600" />}
              {showFeedback && isSelected && !isCorrect && <FiXCircle className="ml-auto text-red-600" />}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 animate-fadeIn">
          <h4 className="font-bold text-lg text-blue-800 mb-3 flex items-center">
            <FiMessageSquare className="mr-2" /> Feedback & Vragen
          </h4>

          {/* Toon de initiële feedback altijd als startpunt */}
          <div className="p-3 bg-white/60 rounded-lg mb-4 text-gray-800 border border-gray-200/50">
            <p className="font-semibold text-sm text-indigo-700 mb-1">Initiële Feedback:</p>
            <p>{currentQuestion.feedback}</p>
          </div>
          
          <div className="space-y-3 h-48 overflow-y-auto pr-2 mb-4 bg-white/50 p-3 rounded-lg">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg max-w-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && <p className="text-gray-500 text-sm">Tutor denkt na...</p>}
          </div>
          <div className="flex">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Stel een vervolgvraag..."
              className="flex-1 bg-white border border-gray-300 px-3 py-2 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={isChatLoading}
            />
            <button onClick={handleSendChatMessage} disabled={isChatLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-gray-400">
              Verstuur
            </button>
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="mt-8 text-right">
          <button
            onClick={handleNextQuestion}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            {currentQuestionIndex < data.questions.length - 1 ? 'Volgende vraag' : 'Toets afronden'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Oefentoets; 