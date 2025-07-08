'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2, FiGrid, FiFileText, FiMessageCircle, FiEdit3, FiSave, FiX, FiPlus, FiTrash2, FiDownload } from 'react-icons/fi';

// Types
interface SlideContent {
  mainText?: string;
  bulletPoints?: string[];
  visualElement?: {
    type: 'emoji' | 'diagram' | 'chart' | 'icon-grid';
    data: any;
  };
  speakerNotes?: string;
}

interface Slide {
  id: string;
  type: 'title' | 'intro' | 'concept' | 'example' | 'visual' | 'summary' | 'questions';
  title: string;
  content: SlideContent;
  layout: 'center' | 'two-column' | 'bullets' | 'visual-focus';
  theme: 'primary' | 'accent' | 'neutral';
}

interface PresentationData {
  title: string;
  slides: Slide[];
  metadata: {
    totalSlides: number;
    estimatedDuration: string;
    targetAudience: string;
  };
}

interface PresentatieProps {
  data: PresentationData | null;
  baseContent?: string;
  didactics?: string;
  pedagogy?: string;
  level?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const Presentatie: React.FC<PresentatieProps> = ({ data, baseContent = '', didactics = '', pedagogy = '', level = '' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showStudentNotes, setShowStudentNotes] = useState(false);
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [showChat, setShowChat] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!data) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousSlide();
          break;
        case 'ArrowRight':
          goToNextSlide();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          setIsFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, data]);

  // Initialize edited slides when data changes
  useEffect(() => {
    if (data && data.slides) {
      setEditedSlides([...data.slides]);
      // Load student notes from localStorage
      loadStudentNotes();
    }
  }, [data]);

  // LocalStorage functions for student notes
  const loadStudentNotes = () => {
    if (data?.title) {
      const saved = localStorage.getItem(`studentNotes_${data.title}`);
      if (saved) {
        setStudentNotes(JSON.parse(saved));
      }
    }
  };

  const saveStudentNotes = (notes: Record<string, string>) => {
    if (data?.title) {
      localStorage.setItem(`studentNotes_${data.title}`, JSON.stringify(notes));
    }
  };

  const updateStudentNote = (slideId: string, note: string) => {
    const updatedNotes = { ...studentNotes, [slideId]: note };
    setStudentNotes(updatedNotes);
    saveStudentNotes(updatedNotes);
  };

  const clearStudentNote = (slideId: string) => {
    const updatedNotes = { ...studentNotes };
    delete updatedNotes[slideId];
    setStudentNotes(updatedNotes);
    saveStudentNotes(updatedNotes);
  };

  const exportStudentNotes = () => {
    if (!data) return;
    
    let exportText = `Aantekeningen bij: ${data.title}\n`;
    exportText += `Geëxporteerd op: ${new Date().toLocaleString('nl-NL')}\n\n`;
    
    data.slides.forEach((slide, index) => {
      const note = studentNotes[slide.id];
      if (note && note.trim()) {
        exportText += `Slide ${index + 1}: ${slide.title}\n`;
        exportText += `${note.trim()}\n\n`;
      }
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aantekeningen_${data.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goToNextSlide = useCallback(() => {
    if (data && currentSlide < data.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  }, [currentSlide, data]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setShowThumbnails(false);
  };

  // Chat functionality
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !data) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/presentatie-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          slide: editedSlides[currentSlide] || data.slides[currentSlide],
          presentationTitle: data.title,
          baseContent,
          didactics,
          pedagogy,
          level
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');
      
      const result = await response.json();
      const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'Sorry, ik kon je vraag niet verwerken. Probeer het opnieuw.' 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Edit functionality
  const updateSlideContent = (field: keyof SlideContent, value: any, index?: number) => {
    const updatedSlides = [...editedSlides];
    const slide = updatedSlides[currentSlide];
    
    if (field === 'bulletPoints' && typeof index === 'number') {
      if (!slide.content.bulletPoints) slide.content.bulletPoints = [];
      slide.content.bulletPoints[index] = value;
    } else {
      slide.content[field] = value;
    }
    
    setEditedSlides(updatedSlides);
  };

  const addBulletPoint = () => {
    const updatedSlides = [...editedSlides];
    const slide = updatedSlides[currentSlide];
    if (!slide.content.bulletPoints) slide.content.bulletPoints = [];
    slide.content.bulletPoints.push('');
    setEditedSlides(updatedSlides);
  };

  const removeBulletPoint = (index: number) => {
    const updatedSlides = [...editedSlides];
    const slide = updatedSlides[currentSlide];
    if (slide.content.bulletPoints) {
      slide.content.bulletPoints.splice(index, 1);
    }
    setEditedSlides(updatedSlides);
  };

  const updateSlideTitle = (value: string) => {
    const updatedSlides = [...editedSlides];
    updatedSlides[currentSlide].title = value;
    setEditedSlides(updatedSlides);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Touch/swipe support voor mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextSlide();
    }
    if (isRightSwipe) {
      goToPreviousSlide();
    }
  };

  if (!data || !data.slides || data.slides.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-2xl font-semibold text-gray-700">Geen presentatie data beschikbaar</h3>
        <p className="text-gray-500 mt-2">Genereer eerst een presentatie door content toe te voegen.</p>
      </div>
    );
  }

  const slide = editedSlides.length > 0 ? editedSlides[currentSlide] : data.slides[currentSlide];
  const progress = ((currentSlide + 1) / data.slides.length) * 100;

  // Theme colors
  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'primary':
        return 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white';
      case 'accent':
        return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white';
      case 'neutral':
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800';
    }
  };

  // Render visual elements
  const renderVisualElement = (visual: any) => {
    if (!visual) return null;

    switch (visual.type) {
      case 'emoji':
        return <div className="text-8xl mb-4">{visual.data}</div>;
      
      case 'icon-grid':
        return (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {visual.data.map((item: string, idx: number) => (
              <div key={idx} className="text-5xl text-center p-4 bg-white/20 rounded-lg">
                {item}
              </div>
            ))}
          </div>
        );
      
      case 'diagram':
        return (
          <div className="bg-white/20 p-6 rounded-lg mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4">{visual.data.center}</div>
              <div className="flex justify-around">
                {visual.data.nodes?.map((node: string, idx: number) => (
                  <div key={idx} className="text-lg font-medium">
                    {node}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render slide content based on layout
  const renderSlideContent = () => {
    switch (slide.layout) {
      case 'center':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            {slide.content.visualElement && renderVisualElement(slide.content.visualElement)}
            {isEditMode ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => updateSlideTitle(e.target.value)}
                className="text-4xl md:text-6xl font-bold mb-6 bg-transparent border-b-2 border-white/50 focus:border-white outline-none text-center"
              />
            ) : (
              <h1 className="text-4xl md:text-6xl font-bold mb-6">{slide.title}</h1>
            )}
            {slide.content.mainText && (
              isEditMode ? (
                <textarea
                  value={slide.content.mainText}
                  onChange={(e) => updateSlideContent('mainText', e.target.value)}
                  className="text-xl md:text-2xl opacity-90 bg-transparent border border-white/50 rounded p-2 resize-none text-center"
                  rows={3}
                />
              ) : (
                <p className="text-xl md:text-2xl opacity-90">{slide.content.mainText}</p>
              )
            )}
          </div>
        );

      case 'two-column':
        return (
          <div className="flex flex-col md:flex-row h-full p-12">
            <div className="flex-1 pr-8">
              {isEditMode ? (
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => updateSlideTitle(e.target.value)}
                  className="text-3xl md:text-4xl font-bold mb-6 bg-transparent border-b-2 border-white/50 focus:border-white outline-none w-full"
                />
              ) : (
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{slide.title}</h2>
              )}
              {slide.content.mainText && (
                isEditMode ? (
                  <textarea
                    value={slide.content.mainText}
                    onChange={(e) => updateSlideContent('mainText', e.target.value)}
                    className="text-lg mb-4 opacity-90 bg-transparent border border-white/50 rounded p-2 w-full resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-lg mb-4 opacity-90">{slide.content.mainText}</p>
                )
              )}
              {slide.content.bulletPoints && (
                <div className="space-y-3">
                  {slide.content.bulletPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="mr-3 text-2xl">•</span>
                      {isEditMode ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateSlideContent('bulletPoints', e.target.value, idx)}
                            className="text-lg bg-transparent border-b border-white/50 focus:border-white outline-none flex-1"
                          />
                          <button
                            onClick={() => removeBulletPoint(idx)}
                            className="text-red-300 hover:text-red-100"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-lg">{point}</span>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <button
                      onClick={addBulletPoint}
                      className="flex items-center text-white/70 hover:text-white"
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Voeg punt toe
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center">
              {slide.content.visualElement && renderVisualElement(slide.content.visualElement)}
            </div>
          </div>
        );

      case 'bullets':
        return (
          <div className="p-12 h-full">
            {isEditMode ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => updateSlideTitle(e.target.value)}
                className="text-3xl md:text-4xl font-bold mb-8 bg-transparent border-b-2 border-white/50 focus:border-white outline-none w-full"
              />
            ) : (
              <h2 className="text-3xl md:text-4xl font-bold mb-8">{slide.title}</h2>
            )}
            {slide.content.mainText && (
              isEditMode ? (
                <textarea
                  value={slide.content.mainText}
                  onChange={(e) => updateSlideContent('mainText', e.target.value)}
                  className="text-xl mb-6 opacity-90 bg-transparent border border-white/50 rounded p-2 w-full resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-xl mb-6 opacity-90">{slide.content.mainText}</p>
              )
            )}
            {slide.content.bulletPoints && (
              <div className="space-y-4">
                {slide.content.bulletPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start transform transition-all duration-300 hover:translate-x-2">
                    <span className="mr-3 text-2xl">→</span>
                    {isEditMode ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => updateSlideContent('bulletPoints', e.target.value, idx)}
                          className="text-lg md:text-xl bg-transparent border-b border-white/50 focus:border-white outline-none flex-1"
                        />
                        <button
                          onClick={() => removeBulletPoint(idx)}
                          className="text-red-300 hover:text-red-100"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-lg md:text-xl">{point}</span>
                    )}
                  </div>
                ))}
                {isEditMode && (
                  <button
                    onClick={addBulletPoint}
                    className="flex items-center text-white/70 hover:text-white"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Voeg punt toe
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'visual-focus':
        return (
          <div className="flex flex-col items-center justify-center h-full p-12">
            {isEditMode ? (
              <input
                type="text"
                value={slide.title}
                onChange={(e) => updateSlideTitle(e.target.value)}
                className="text-3xl md:text-4xl font-bold mb-8 bg-transparent border-b-2 border-white/50 focus:border-white outline-none text-center"
              />
            ) : (
              <h2 className="text-3xl md:text-4xl font-bold mb-8">{slide.title}</h2>
            )}
            {slide.content.visualElement && renderVisualElement(slide.content.visualElement)}
            {slide.content.mainText && (
              isEditMode ? (
                <textarea
                  value={slide.content.mainText}
                  onChange={(e) => updateSlideContent('mainText', e.target.value)}
                  className="text-xl text-center opacity-90 max-w-3xl bg-transparent border border-white/50 rounded p-2 resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-xl text-center opacity-90 max-w-3xl">{slide.content.mainText}</p>
              )
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full'}`}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-300">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main slide area */}
      <div 
        className={`relative h-[600px] ${getThemeColors(slide.theme)} rounded-lg overflow-hidden shadow-2xl ${
          isFullscreen ? 'h-screen' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide number and indicators */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {studentNotes[slide.id] && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Deze slide heeft aantekeningen" />
          )}
          <span className="text-sm opacity-70">
            {currentSlide + 1} / {data.slides.length}
          </span>
        </div>

        {/* Slide content */}
        <div className="h-full">
          {renderSlideContent()}
        </div>

        {/* Navigation controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black/20 to-transparent">
          <button
            onClick={goToPreviousSlide}
            disabled={currentSlide === 0}
            className={`p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all ${
              currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full transition-all ${
                showChat ? 'bg-indigo-500 text-white' : 'bg-white/20 hover:bg-white/30'
              }`}
              title="Chat met AI"
            >
              <FiMessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`p-3 rounded-full transition-all ${
                isEditMode ? 'bg-green-500 text-white' : 'bg-white/20 hover:bg-white/30'
              }`}
              title="Bewerk slide"
            >
              <FiEdit3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all"
              title="Thumbnail overzicht"
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowStudentNotes(!showStudentNotes)}
              className={`p-3 rounded-full transition-all ${
                showStudentNotes ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'
              }`}
              title="Aantekeningen"
            >
              <FiFileText className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all"
              title="Fullscreen"
            >
              {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={goToNextSlide}
            disabled={currentSlide === data.slides.length - 1}
            className={`p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all ${
              currentSlide === data.slides.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Thumbnails overlay */}
      {showThumbnails && (
        <div className="absolute inset-0 bg-black/80 z-50 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-white text-2xl font-bold mb-6">Slide Overzicht</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.slides.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => goToSlide(idx)}
                  className={`cursor-pointer rounded-lg overflow-hidden transform transition-all hover:scale-105 ${
                    idx === currentSlide ? 'ring-4 ring-indigo-500' : ''
                  }`}
                >
                  <div className={`${getThemeColors(s.theme)} p-4 h-32 flex items-center justify-center relative`}>
                    {studentNotes[s.id] && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full" />
                    )}
                    <div className="text-center">
                      <div className="text-sm font-bold mb-1">{idx + 1}</div>
                      <div className="text-xs">{s.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowThumbnails(false)}
              className="mt-6 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed right-4 top-4 bottom-4 w-96 bg-white rounded-lg shadow-2xl z-40 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Chat over deze slide</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-indigo-500 text-white ml-auto'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
            {isChatLoading && (
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[80%]">
                <p className="text-sm animate-pulse">AI denkt na...</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Stel een vraag over deze slide..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isChatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verstuur
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Vraag uitleg, verbeteringen of extra voorbeelden
            </p>
          </div>
        </div>
      )}

      {/* Student Notes Panel */}
      {showStudentNotes && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-gray-700 flex items-center">
              <FiFileText className="w-4 h-4 mr-2" />
              Mijn Aantekeningen - Slide {currentSlide + 1}
            </h4>
            <div className="flex gap-2">
              {Object.keys(studentNotes).length > 0 && (
                <button
                  onClick={exportStudentNotes}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
                  title="Export alle aantekeningen"
                >
                  <FiDownload className="w-3 h-3" />
                  Export
                </button>
              )}
              {studentNotes[slide.id] && (
                <button
                  onClick={() => clearStudentNote(slide.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  title="Wis aantekening"
                >
                  Wis
                </button>
              )}
            </div>
          </div>
          <textarea
            value={studentNotes[slide.id] || ''}
            onChange={(e) => updateStudentNote(slide.id, e.target.value)}
            placeholder="Voeg hier je eigen aantekeningen toe voor deze slide..."
            className="w-full h-32 p-3 border border-yellow-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>
              {studentNotes[slide.id]?.length || 0} karakters
            </span>
            <span>Automatisch opgeslagen</span>
          </div>
        </div>
      )}

      {/* Presentation metadata */}
      <div className="mt-4 text-center text-gray-600">
        <p className="text-sm">
          {data.metadata.estimatedDuration} • {data.metadata.targetAudience}
        </p>
      </div>

      {/* Keyboard shortcuts info */}
      {!isFullscreen && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Gebruik ← → pijltjes om te navigeren • F voor fullscreen
        </div>
      )}
    </div>
  );
};

export default Presentatie;