export type AppId = 
  | 'chatbot'
  | 'flashcards'
  | 'mindmap'
  | 'oefentoets'
  | 'thirtyseconds'
  | 'presentatie'
  | 'escaperoom';

export const appDetails: Record<AppId, { name: string; icon: string; description: string }> = {
    chatbot: { name: 'AI Tutor Chatbot', icon: '💬', description: 'Een interactieve chatbot die vragen kan beantwoorden.' },
    flashcards: { name: 'Flashcards', icon: '📋', description: 'Genereer digitale flashcards om begrippen te leren.' },
    mindmap: { name: 'Mindmap', icon: '🧠', description: 'Visualiseer de structuur van de leerstof.' },
    oefentoets: { name: 'Oefentoets', icon: '❓', description: 'Genereer een quiz om kennis te toetsen.' },
    thirtyseconds: { name: '30 Seconds', icon: '⏱️', description: 'Genereer kaartjes voor een energiek spel 30 Seconds.' },
    presentatie: { name: 'Presentatie', icon: '📽️', description: 'Genereer een opzet voor een presentatie.' },
    escaperoom: { name: 'Escape Room', icon: '⏳', description: 'Genereer een spannend ontsnappingsspel.' },
};

export const categories = {
    verkenning: {
      name: 'Verkennen & Oriënteren',
      icon: '🚀',
      apps: ['chatbot', 'mindmap'] as AppId[],
    },
    kennisverwerking: {
      name: 'Kennisverwerking & Toepassing',
      icon: '💡',
      apps: ['flashcards', 'escaperoom', 'presentatie'] as AppId[],
    },
    toetsing: {
      name: 'Toetsen & Evalueren',
      icon: '📝',
      apps: ['oefentoets', 'thirtyseconds'] as AppId[],
    },
  }; 