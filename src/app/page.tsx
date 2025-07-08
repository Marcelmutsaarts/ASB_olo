'use client';

import { useState, useEffect } from 'react';
import AppSelector from '@/components/AppSelector';
import ContentInput from '@/components/ContentInput';
import { AppId } from '@/types/apps';
import Chatbot from '@/components/Chatbot';
import ChatbotSettings from '@/components/ChatbotSettings';
import Flashcards from '@/components/Flashcards';
import Mindmap from '@/components/Mindmap';
import EscapeRoom from '@/components/EscapeRoom';
import Oefentoets from '@/components/Oefentoets';
import ThirtySeconds from '@/components/ThirtySeconds';
import Presentatie from '@/components/Presentatie';
import { StudentProvider, useStudent } from '@/contexts/StudentContext';
import LoginModal from '@/components/LoginModal';
import StudentProfile from '@/components/StudentProfile';

// Definieer de datatypes voor de props
interface FlashcardData {
  question: string;
  answer: string;
}
interface MindmapData {
  name: string;
  children?: MindmapData[];
}

const didacticRoles = [
  {
    title: 'Selecteer een didactische rol...',
    text: ''
  },
  {
    title: 'Tutor',
    text: 'Je bent een deskundige tutor die complexe concepten helder en stapsgewijs uitlegt. Je past je uitleg aan op het niveau van de leerling en gebruikt concrete voorbeelden en analogieën om abstracte concepten toegankelijk te maken. Je structureert je uitleg logisch: eerst de hoofdlijnen, dan de details. Je controleert regelmatig of de leerling het begrijpt door korte samenvattingen te geven en te vragen of alles duidelijk is. Bij moeilijke onderwerpen breek je de stof op in behapbare delen en bouw je de kennis systematisch op.'
  },
  {
    title: 'Socratische gesprekspartner',
    text: 'Je bent een Socratische gesprekspartner die NOOIT direct antwoorden geeft, maar de leerling helpt zelf tot inzichten te komen door gerichte vragen te stellen. Je begint met open vragen om te peilen wat de leerling al weet, en stelt vervolgvragen die de leerling uitdagen dieper na te denken. Gebruik vragen als: "Wat denk je dat...?", "Hoe zou je...?", "Waarom denk je dat...?", "Wat zou er gebeuren als...?". Als de leerling vastloopt, stel je hulpvragen die een denkrichting aangeven zonder het antwoord te verklappen. Je reflecteert de antwoorden van de leerling terug en nodigt uit tot verdere verdieping.'
  },
  {
    title: 'Mentor',
    text: 'Je bent een betrokken mentor die oog heeft voor de hele persoon achter de leerling. Je bespreekt niet alleen vakinhoudelijke zaken, maar ook persoonlijke en professionele uitdagingen die het leerproces beïnvloeden. Je luistert actief, toont empathie en helpt de leerling obstakels te identificeren en aan te pakken. Je moedigt zelfreflectie aan over studiegewoonten, motivatie en doelen. Je deelt relevante eigen ervaringen en helpt de leerling een langetermijnperspectief te ontwikkelen. Je bent een vertrouwenspersoon die een veilige ruimte creëert voor open gesprekken.'
  },
  {
    title: 'Coach',
    text: 'Je bent een motiverende coach die de leerling helpt het beste uit zichzelf te halen. Je focust op het ontwikkelen van leervaardigheden, zelfvertrouwen en een groeimindset. Je stelt doelgerichte vragen over wat de leerling wil bereiken en helpt realistische, meetbare doelen te formuleren. Je viert successen, hoe klein ook, en helpt tegenslagen om te zetten in leermomenten. Je geeft constructieve feedback en moedigt de leerling aan om uit de comfortzone te stappen. Je helpt bij het ontwikkelen van effectieve leerstrategieën en het overwinnen van faalangst.'
  },
  {
    title: 'Simulator',
    text: 'Je neemt een specifieke rol aan die relevant is voor de leersituatie, zodat de leerling kan oefenen met realistische scenario\'s. Je gedraagt je volledig volgens deze rol - bijvoorbeeld als patiënt, klant, collega, of historisch figuur. Je reageert authentiek op de acties van de leerling en geeft realistische feedback vanuit je rolperspectief. Je creëert uitdagende maar haalbare oefensituaties en past de complexiteit aan op het niveau van de leerling. Na afloop stap je uit je rol om constructieve feedback te geven op de prestatie.'
  }
];

const pedagogicalRoles = [
  {
    title: 'Selecteer een pedagogische rol...',
    text: ''
  },
  {
    title: 'Ondersteunend Begeleidend',
    text: 'Je bent een geduldige, empathische begeleider die een veilige leeromgeving creëert. Je gebruikt warme, bemoedigende taal en benadrukt wat goed gaat. Bij fouten reageer je begripvol: "Dat is een begrijpelijke denkfout" of "Laten we dit stap voor stap bekijken". Je geeft leerlingen expliciet de tijd om na te denken en normaliseert het maken van fouten als onderdeel van leren. Je biedt structuur door complexe taken op te delen in behapbare stappen. Je gebruikt af en toe een emoji om warmte uit te stralen (👍 ✨). Je past je tempo aan op de leerling en herhaalt belangrijke punten zonder ongeduldig te worden. Je focus ligt op het opbouwen van zelfvertrouwen en het creëren van succeservaringen.'
  },
  {
    title: 'Zakelijk Efficiënt',
    text: 'Je communiceert helder, direct en doelgericht. Je gebruikt correcte, professionele taal zonder overbodig jargon. Je antwoorden zijn gestructureerd met duidelijke kopjes of genummerde punten. Feedback is objectief en constructief: je beschrijft precies wat goed is en wat beter kan. Je respecteert de tijd van de leerling door to-the-point te zijn. Je vermijdt smalltalk en houdt de focus op de leerdoelen. Je gebruikt concrete voorbeelden en praktische toepassingen. Humor gebruik je alleen functioneel. Je waardeert efficiency en moedigt zelfstandig werken aan. Je bent consistent in je aanpak en verwachtingen.'
  },
  {
    title: 'Uitdagend Activerend',
    text: 'Je prikkelt leerlingen om verder te denken dan het voor de hand liggende. Je stelt kritische vragen: "Is dat wel zo?", "Wat als het tegenovergestelde waar is?", "Kun je een tegenvoorbeeld bedenken?". Je accepteert geen oppervlakkige antwoorden en vraagt door tot de kern. Je speelt advocaat van de duivel en creëert productieve cognitieve dissonantie. Je stelt hoge verwachtingen en laat leerlingen hun grenzen verkennen. Je waardeert intellectuele moed en origineel denken. Je geeft directe feedback zonder omhaal. Je daagt uit maar blijft respectvol. Je stimuleert competitie met zichzelf: "Kun je een nog beter antwoord bedenken?".'
  },
  {
    title: 'Speels Energiek',
    text: 'Je maakt leren leuk en engaging met humor, creativiteit en enthousiasme. Je gebruikt levendige taal, woordspelingen en verrassende vergelijkingen. Je bedenkt memorabele geheugensteuntjes en relate abstracte concepten aan de belevingswereld van de leerling. Je durft te experimenteren met verschillende formats: quiz, roleplay, game-elementen. Je gebruikt uitroeptekens om energie over te brengen! Je viert successen uitbundig en maakt van fouten leermomenten met een knipoog. Je houdt het tempo hoog en de sfeer licht. Je gebruikt gamification elementen zoals punten, badges of levels. Je motto: leren mag best een feestje zijn!'
  },
  {
    title: 'Coachend Reflectief',
    text: 'Je begeleidt leerlingen naar zelfinzicht en persoonlijke groei. Je stelt metacognitieve vragen: "Hoe kwam je tot dit antwoord?", "Wat vond je moeilijk?", "Welke strategie werkte het best?". Je helpt leerlingen hun eigen leerproces te begrijpen en te optimaliseren. Je past je stijl aan op wat de individuele leerling nodig heeft - soms sturend, soms loslatend. Je creëert ruimte voor reflectie en betekenisgeving. Je helpt verbanden leggen tussen verschillende kennisdomeinen en persoonlijke ervaringen. Je ondersteunt bij het stellen van eigen leerdoelen. Je bent een sparringpartner die de leerling helpt het beste uit zichzelf te halen. Je checkt regelmatig: "Werkt deze aanpak voor jou?".'
  }
];

const hboLevels = [
  { key: 'propedeuse', name: 'Propedeuse', description: 'Het niveau is gericht op basiskennis en kernbegrippen. De content moet helder, gestructureerd en overzichtelijk zijn, geschikt voor eerstejaars HBO-studenten.' },
  { key: 'hoofdfase_1_2', name: 'Hoofdfase 1 / 2', description: 'Het niveau vereist meer diepgang en toepassing van kennis. De content mag complexere scenario\'s en casuïstiek bevatten, passend bij tweede- en derdejaars HBO-studenten.' },
  { key: 'afstudeerniveau', name: 'Afstudeerniveau', description: 'Het niveau moet uitdagend zijn en een beroep doen op kritisch en analytisch denkvermogen. De content moet complex, veelzijdig en praktijkgericht zijn, geschikt voor afstuderende HBO-studenten die op het punt staan het werkveld te betreden.' },
];

function HomePage() {
  const { currentStudent, isLoggedIn } = useStudent();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [baseContent, setBaseContent] = useState('');
  const [didactics, setDidactics] = useState('');
  const [pedagogy, setPedagogy] = useState('');
  const [level, setLevel] = useState(hboLevels[0].description);
  const [selectedApps, setSelectedApps] = useState<Record<AppId, boolean>>({
    chatbot: true,
    flashcards: true,
    mindmap: true,
    oefentoets: false,
    thirtyseconds: false,
    presentatie: false,
    escaperoom: true,
  });
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppId>('chatbot');

  // States om de gegenereerde data op te slaan
  const [flashcardsData, setFlashcardsData] = useState<FlashcardData[]>([]);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [escapeRoomData, setEscapeRoomData] = useState<any | null>(null);
  const [oefentoetsData, setOefentoetsData] = useState<any | null>(null);
  const [thirtySecondsData, setThirtySecondsData] = useState<any | null>(null);
  const [presentatieData, setPresentatieData] = useState<any | null>(null);

  // Nieuwe state voor Escape Room instellingen
  const [escapeRoomTime, setEscapeRoomTime] = useState(20); // Default 20 minuten
  const [escapeRoomQuestions, setEscapeRoomQuestions] = useState(5); // Default 5 vragen

  // Nieuwe state voor Oefentoets instellingen
  const [testQuestions, setTestQuestions] = useState(10);
  const [testType, setTestType] = useState<'mc3' | 'mc4' | 'true-false'>('mc4');

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

    const bodyPayload = { baseContent, didactics, pedagogy, level };

    const generationPromises: { id: AppId; promise: Promise<any> }[] = [];

    if (selectedApps.flashcards) {
      generationPromises.push({
        id: 'flashcards',
        promise: fetch('/api/generate-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        }).then(res => res.json())
      });
    }
    if (selectedApps.mindmap) {
      generationPromises.push({
        id: 'mindmap',
        promise: fetch('/api/generate-mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        }).then(res => res.json())
      });
    }
    if (selectedApps.thirtyseconds) {
      generationPromises.push({
        id: 'thirtyseconds',
        promise: fetch('/api/generate-30seconds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        }).then(res => res.json())
      });
    }
    if (selectedApps.oefentoets) {
      generationPromises.push({
        id: 'oefentoets',
        promise: fetch('/api/generate-oefentoets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...bodyPayload,
            testQuestions,
            testType,
           }),
        }).then(res => res.json())
      });
    }
    if (selectedApps.escaperoom) {
      generationPromises.push({
        id: 'escaperoom',
        promise: fetch('/api/generate-escaperoom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...bodyPayload, 
            time: escapeRoomTime, 
            questions: escapeRoomQuestions 
          }),
        }).then(res => res.json())
      });
    }
    if (selectedApps.presentatie) {
      generationPromises.push({
        id: 'presentatie',
        promise: fetch('/api/generate-presentatie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        }).then(res => res.json())
      });
    }

    try {
      const results = await Promise.all(generationPromises.map(p => p.promise.catch(e => ({ error: e, id: p.id }))));
      
      let newFlashcardsData: FlashcardData[] = [];
      let newMindmapData: MindmapData | null = null;
      let newEscapeRoomData: any | null = null;
      let newOefentoetsData: any | null = null;
      let newThirtySecondsData: any | null = null;
      let newPresentatieData: any | null = null;
      
      results.forEach((result, index) => {
        const appId = generationPromises[index].id;
        
        if (result.error) {
          throw new Error(`Fout bij genereren van ${appId}: ${result.error.message || 'API call mislukt'}`);
        }

        if (appId === 'flashcards') newFlashcardsData = result.flashcards || [];
        if (appId === 'mindmap') newMindmapData = result.mindmap || null;
        if (appId === 'escaperoom') newEscapeRoomData = result || null;
        if (appId === 'oefentoets') newOefentoetsData = result.testData || null;
        if (appId === 'thirtyseconds') newThirtySecondsData = result.gameData || null;
        if (appId === 'presentatie') newPresentatieData = result.presentationData || null;
      });

      setFlashcardsData(newFlashcardsData);
      setMindmapData(newMindmapData);
      setEscapeRoomData(newEscapeRoomData);
      setOefentoetsData(newOefentoetsData);
      setThirtySecondsData(newThirtySecondsData);
      setPresentatieData(newPresentatieData);

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
    setOefentoetsData(null);
    setThirtySecondsData(null);
    setPresentatieData(null);
    setGenerationError(null);
  };

  // Show login modal when leeromgeving is generated but no student is logged in
  useEffect(() => {
    if (isGenerated && !isLoggedIn) {
      setShowLoginModal(true);
    }
  }, [isGenerated, isLoggedIn]);

  if (isGenerated) {
    const enabledApps = Object.entries(selectedApps)
      .filter(([, isSelected]) => isSelected)
      .map(([appId]) => appId as AppId);

    const appDetails: Record<AppId, { name: string; icon: string }> = {
        chatbot: { name: 'Chatbot', icon: '💬' },
        flashcards: { name: 'Flashcards', icon: '📋' },
        mindmap: { name: 'Mindmap', icon: '🧠' },
        escaperoom: { name: 'Escape Room', icon: '⏳' },
        oefentoets: { name: 'Oefentoets', icon: '❓' },
        thirtyseconds: { name: '30 Seconds', icon: '⏱️' },
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
            <div className="flex items-center gap-4">
              {currentStudent && (
                <StudentProfile 
                  presentationTitle={baseContent ? `Leeromgeving: ${new Date().toLocaleDateString('nl-NL')}` : undefined}
                />
              )}
              <button
                onClick={handleBackToBuilder}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                ← Terug naar bouwer
              </button>
            </div>
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
                    level={level}
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
                {activeTab === 'oefentoets' && (
                  <Oefentoets data={oefentoetsData} />
                )}
                {activeTab === 'thirtyseconds' && (
                  <ThirtySeconds data={thirtySecondsData} />
                )}
                {activeTab === 'presentatie' && (
                  <Presentatie 
                    data={presentatieData} 
                    baseContent={baseContent}
                    didactics={didactics}
                    pedagogy={pedagogy}
                    level={level}
                  />
                )}
              </>
            )}
          </main>
          </div>
        </div>
        
        {/* Login Modal */}
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          presentationTitle={baseContent ? `Leeromgeving: ${new Date().toLocaleDateString('nl-NL')}` : undefined}
        />
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
              didacticRoles={didacticRoles}
              pedagogicalRoles={pedagogicalRoles}
            />

            <div className="mt-6">
              <label htmlFor="level" className="block text-lg font-semibold text-gray-800 mb-2">
                Gewenst Niveau
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 bg-white appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em' }}
              >
                {hboLevels.map(level => (
                  <option key={level.key} value={level.description}>{level.name}</option>
                ))}
              </select>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Live Preview</h2>
              <p className="text-gray-600 mb-4">
                Test de AI Tutor Chatbot direct met de ingevoerde context.
              </p>
              <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                {baseContent.trim() ? (
                  <Chatbot baseContent={baseContent} didactics={didactics} pedagogy={pedagogy} level={level} />
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg border">
                    <p className="text-gray-500">Voer eerst leerinhoud in om de chatbot te activeren.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Escape Room Specifieke Instellingen */}
            {selectedApps.escaperoom && (
              <div className="w-full max-w-7xl mt-10 p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-inner border border-white/80 animate-fadeIn">
                <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="text-2xl mr-3">⏳</span> Escape Room Instellingen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tijd instelling */}
                  <div className="space-y-3">
                    <label htmlFor="escape-time" className="block text-sm font-medium text-gray-600">
                      Speelduur (minuten)
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        id="escape-time"
                        min="0.5"
                        max="60"
                        step="0.5"
                        value={escapeRoomTime}
                        onChange={(e) => setEscapeRoomTime(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-semibold text-indigo-600 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 min-w-[50px] text-center">
                        {escapeRoomTime}
                      </span>
                    </div>
                  </div>
                  {/* Vragen instelling */}
                  <div className="space-y-3">
                    <label htmlFor="escape-questions" className="block text-sm font-medium text-gray-600">
                      Aantal puzzels
                    </label>
                    <div className="flex items-center space-x-4">
                       <input
                        type="range"
                        id="escape-questions"
                        min="3"
                        max="10"
                        step="1"
                        value={escapeRoomQuestions}
                        onChange={(e) => setEscapeRoomQuestions(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-semibold text-indigo-600 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 min-w-[50px] text-center">
                        {escapeRoomQuestions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Oefentoets Specifieke Instellingen */}
            {selectedApps.oefentoets && (
              <div className="w-full max-w-7xl mt-10 p-8 bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 rounded-2xl shadow-inner border border-white/80 animate-fadeIn">
                <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="text-2xl mr-3">❓</span> Oefentoets Instellingen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Aantal vragen instelling */}
                  <div className="space-y-3">
                    <label htmlFor="test-questions" className="block text-sm font-medium text-gray-600">
                      Aantal vragen
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        id="test-questions"
                        min="1"
                        max="20"
                        step="1"
                        value={testQuestions}
                        onChange={(e) => setTestQuestions(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-semibold text-blue-600 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 min-w-[50px] text-center">
                        {testQuestions}
                      </span>
                    </div>
                  </div>
                  {/* Vraagvorm instelling */}
                  <div className="space-y-3">
                    <label htmlFor="test-type" className="block text-sm font-medium text-gray-600">
                      Vraagvorm
                    </label>
                    <select
                      id="test-type"
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as 'mc3' | 'mc4' | 'true-false')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="mc4">Multiple choice (4 opties)</option>
                      <option value="mc3">Multiple choice (3 opties)</option>
                      <option value="true-false">Juist / Onjuist</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="mt-12 text-center">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating || getSelectedAppsCount() === 0}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-400 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:bg-gray-400 disabled:from-gray-400 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-1"
              >
                {isGenerating ? 'Moment, de AI is aan het werk...' : `Genereer ${getSelectedAppsCount()} App${getSelectedAppsCount() > 1 ? 's' : ''}`}
              </button>
            </div>

          </div>
        </div>

        <footer className="text-center mt-12">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} AI voor Docenten. Alle rechten voorbehouden.</p>
        </footer>
      </div>
    </main>
  );
}

// Wrap HomePage with StudentProvider
export default function Page() {
  return (
    <StudentProvider>
      <HomePage />
    </StudentProvider>
  );
} 