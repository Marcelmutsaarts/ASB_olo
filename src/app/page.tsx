'use client';

import { useState } from 'react';
import AppSelector from '@/components/AppSelector';
import ContentInput from '@/components/ContentInput';
import { AppId } from '@/types/apps';
import Chatbot from '@/components/Chatbot';
import ChatbotSettings from '@/components/ChatbotSettings';
import Flashcards from '@/components/Flashcards';
import Mindmap from '@/components/Mindmap';
import EscapeRoom from '@/components/EscapeRoom';

// Definieer de datatypes voor de props
interface FlashcardData {
  question: string;
  answer: string;
}
interface MindmapData {
  name: string;
  children?: MindmapData[];
}

export default function HomePage() {
  const [baseContent, setBaseContent] = useState('');
  const [didactics, setDidactics] = useState('');
  const [pedagogy, setPedagogy] = useState('');
  const [selectedApps, setSelectedApps] = useState<Record<AppId, boolean>>({
    chatbot: true,
    flashcards: true,
    mindmap: true,
    quiz: false,
    samenvatting: false,
    presentatie: false,
    escaperoom: false,
  });
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppId>('chatbot');

  // States om de gegenereerde data op te slaan
  const [flashcardsData, setFlashcardsData] = useState<FlashcardData[]>([]);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [escapeRoomData, setEscapeRoomData] = useState<any | null>(null);

  const getSelectedAppsCount = () => {
    return Object.values(selectedApps).filter(Boolean).length;
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    setIsGenerated(true);
    setGenerationError(null);
    // Set the first selected app as active tab
    const firstSelectedApp = Object.keys(selectedApps).find(key => selectedApps[key as AppId]) as AppId;
    setActiveTab(firstSelectedApp || 'chatbot');

    const generationPromises: { id: AppId; promise: Promise<any> }[] = [];

    if (selectedApps.flashcards) {
      generationPromises.push({
        id: 'flashcards',
        promise: fetch('/api/generate-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseContent, didactics, pedagogy }),
        }).then(res => res.json())
      });
    }
    if (selectedApps.mindmap) {
      generationPromises.push({
        id: 'mindmap',
        promise: fetch('/api/generate-mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseContent, didactics, pedagogy }),
        }).then(res => res.json())
      });
    }
    if (selectedApps.escaperoom) {
      generationPromises.push({
        id: 'escaperoom',
        promise: fetch('/api/generate-escaperoom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseContent, didactics, pedagogy }),
        }).then(res => res.json())
      });
    }

    try {
      const results = await Promise.all(generationPromises.map(p => p.promise.catch(e => ({ error: e, id: p.id }))));
      
      let newFlashcardsData: FlashcardData[] = [];
      let newMindmapData: MindmapData | null = null;
      let newEscapeRoomData: any | null = null;
      
      results.forEach((result, index) => {
        const appId = generationPromises[index].id;
        
        if (result.error) {
          throw new Error(`Fout bij genereren van ${appId}: ${result.error.message || 'API call mislukt'}`);
        }

        if (appId === 'flashcards') newFlashcardsData = result.flashcards || [];
        if (appId === 'mindmap') newMindmapData = result.mindmap || null;
        if (appId === 'escaperoom') newEscapeRoomData = result || null;
      });

      setFlashcardsData(newFlashcardsData);
      setMindmapData(newMindmapData);
      setEscapeRoomData(newEscapeRoomData);

    } catch (e: any) {
      console.error("Fout bij het genereren van apps:", e);
      setGenerationError(e.message || 'Er is een onbekende fout opgetreden bij het genereren.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToBuilder = () => {
    setIsGenerated(false);
    setFlashcardsData([]);
    setMindmapData(null);
    setEscapeRoomData(null);
    setGenerationError(null);
  };

  if (isGenerated) {
    const enabledApps = Object.entries(selectedApps)
      .filter(([, isSelected]) => isSelected)
      .map(([appId]) => appId as AppId);

    const appDetails: Record<AppId, { name: string; icon: string }> = {
        chatbot: { name: 'Chatbot', icon: '💬' },
        flashcards: { name: 'Flashcards', icon: '📋' },
        mindmap: { name: 'Mindmap', icon: '🧠' },
        escaperoom: { name: 'Escape Room', icon: '⏳' },
        quiz: { name: 'Quiz', icon: '❓' },
        samenvatting: { name: 'Samenvatting', icon: '📝' },
        presentatie: { name: 'Presentatie', icon: '📽️' },
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-7xl">
          <header className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3">
               <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                 <img src="/images/ai-voor-docenten-logo.png" alt="Logo" className="h-8 w-8" />
               </div>
               <div>
                 <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                   Gegenereerde Leeromgeving
                 </h1>
                 <p className="text-sm text-gray-500 font-medium">Powered by AI</p>
               </div>
            </div>
            <button
              onClick={handleBackToBuilder}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              ← Terug naar bouwer
            </button>
          </header>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="border-b border-gray-200/50">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                {enabledApps.map((appId) => (
                  <button
                    key={appId}
                    onClick={() => setActiveTab(appId)}
                    className={`whitespace-nowrap py-6 px-1 border-b-3 font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5 ${
                      activeTab === appId
                        ? 'border-indigo-500 text-indigo-600 bg-gradient-to-t from-indigo-50/50 to-transparent'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <span className="mr-3 text-lg">{appDetails[appId].icon}</span>
                    {appDetails[appId].name}
                  </button>
                ))}
              </nav>
            </div>

           {isGenerating && (
            <div className="w-full max-w-4xl mx-auto p-12 text-center">
              <div className="relative">
                <div className="text-6xl mb-6 animate-spin">⚙️</div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                Apps worden gegenereerd...
              </h3>
              <p className="text-gray-600 text-lg">De AI is de leerstof aan het analyseren voor alle geselecteerde apps.</p>
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
           )}

           {generationError && (
              <div className="w-full max-w-4xl mx-auto p-8 text-center mt-8 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-lg border border-red-100">
                <div className="text-5xl mb-4">😢</div>
                <h3 className="text-2xl font-bold text-red-800 mb-2">Er is iets misgegaan</h3>
                <p className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{generationError}</p>
              </div>
           )}

          <main className="p-8">
            {!isGenerating && !generationError && (
              <>
                {activeTab === 'chatbot' && (
                  <Chatbot
                    baseContent={baseContent}
                    didactics={didactics}
                    pedagogy={pedagogy}
                  />
                )}
                {activeTab === 'flashcards' && (
                  <Flashcards data={flashcardsData} />
                )}
                {activeTab === 'mindmap' && (
                  <Mindmap data={mindmapData} />
                )}
                {activeTab === 'escaperoom' && (
                  <EscapeRoom data={escapeRoomData} />
                )}
                {(activeTab === 'quiz' || activeTab === 'samenvatting' || activeTab === 'presentatie') && (
                    <div className="w-full max-w-4xl mx-auto p-8 text-center bg-white rounded-lg shadow-lg">
                        <div className="text-4xl mb-4">{appDetails[activeTab].icon}</div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{appDetails[activeTab].name}</h3>
                        <p className="text-gray-600">Deze functionaliteit is binnenkort beschikbaar.</p>
                    </div>
                )}
              </>
            )}
          </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-4">
            <img src="/images/ai-voor-docenten-logo.png" alt="Logo" className="h-16 w-16" />
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
                ASB Leeromgeving Bouwer
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Creëer in een handomdraai een interactieve leeromgeving voor je studenten.
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
          <div className="space-y-12">
            <ContentInput content={baseContent} setContent={setBaseContent} />
            
            <AppSelector selectedApps={selectedApps} setSelectedApps={setSelectedApps} />
            
            <ChatbotSettings 
              didactics={didactics} 
              setDidactics={setDidactics}
              pedagogy={pedagogy}
              setPedagogy={setPedagogy}
            />

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Live Preview</h2>
              <p className="text-gray-600 mb-4">
                Test de AI Tutor Chatbot direct met de ingevoerde context.
              </p>
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                {baseContent.trim() ? (
                  <Chatbot baseContent={baseContent} didactics={didactics} pedagogy={pedagogy} />
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg border">
                    <p className="text-gray-500">Voer eerst leerinhoud in om de chatbot te activeren.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center pt-6 border-t border-gray-200">
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating || !baseContent.trim() || getSelectedAppsCount() === 0}
                  className="w-full max-w-md bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg text-lg"
                >
                  {isGenerating ? 'Bezig met genereren...' : '🚀 Genereer Leeromgeving'}
                </button>
                
                {(!baseContent.trim() || getSelectedAppsCount() === 0) && (
                  <p className="text-sm text-gray-500 mt-2">
                    {!baseContent.trim() && "Voer eerst leerinhoud in"}
                    {!baseContent.trim() && getSelectedAppsCount() === 0 && " en "}
                    {getSelectedAppsCount() === 0 && "selecteer minimaal één app"}
                  </p>
                )}
            </div>
          </div>
        </div>

        <footer className="text-center mt-12">
          <p className="text-gray-500">Mogelijk gemaakt door AI voor Docenten.</p>
        </footer>
      </div>
    </main>
  );
} 