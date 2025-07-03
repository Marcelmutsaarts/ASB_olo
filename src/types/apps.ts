export type AppId = 'chatbot' | 'flashcards' | 'mindmap' | 'quiz' | 'samenvatting' | 'presentatie' | 'escaperoom';

export const appDetails: Record<AppId, { name: string; icon: string; description: string }> = {
    chatbot: { name: 'AI Tutor Chatbot', icon: '💬', description: 'Een interactieve chatbot die vragen kan beantwoorden.' },
    flashcards: { name: 'Flashcards', icon: '📋', description: 'Genereer digitale flashcards om begrippen te leren.' },
    mindmap: { name: 'Mindmap', icon: '🧠', description: 'Visualiseer de structuur van de leerstof.' },
    quiz: { name: 'Quiz', icon: '❓', description: 'Genereer een quiz om kennis te toetsen.' },
    samenvatting: { name: 'Samenvatting', icon: '📝', description: 'Genereer een beknopte samenvatting van de tekst.' },
    presentatie: { name: 'Presentatie', icon: '📽️', description: 'Genereer een opzet voor een presentatie.' },
    escaperoom: { name: 'Escape Room', icon: '⏳', description: 'Creëer een educatieve escape room game.' },
};

export const appCategories = {
  learning: {
    name: 'Leren & Oefenen',
    icon: '📚',
    apps: ['chatbot', 'flashcards', 'mindmap'] as AppId[],
  },
  assessment: {
    name: 'Toetsen & Evalueren',
    icon: '📝',
    apps: ['quiz', 'samenvatting'] as AppId[],
  },
  interaction: {
    name: 'Interactie & Creatie',
    icon: '🎨',
    apps: ['presentatie', 'escaperoom'] as AppId[],
  }
}; 