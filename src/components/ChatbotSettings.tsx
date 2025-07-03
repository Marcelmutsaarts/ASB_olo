'use client';

import React from 'react';

interface ChatbotSettingsProps {
  didactics: string;
  setDidactics: (value: string) => void;
  pedagogy: string;
  setPedagogy: (value: string) => void;
}

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({ didactics, setDidactics, pedagogy, setPedagogy }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label htmlFor="didactics" className="block text-sm font-medium text-gray-700 mb-1">
          Vakdidactische Instructies
        </label>
        <textarea
          id="didactics"
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Bijv: 'Gebruik de STARR-methode voor reflectie' of 'Leg concepten uit met voorbeelden uit de zorgsector...'"
          value={didactics}
          onChange={(e) => setDidactics(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Geef hier instructies over hoe de chatbot de leerstof moet benaderen en uitleggen.</p>
      </div>
      <div>
        <label htmlFor="pedagogy" className="block text-sm font-medium text-gray-700 mb-1">
          Pedagogische Instructies
        </label>
        <textarea
          id="pedagogy"
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Bijv: 'Spreek de student motiverend aan' of 'Stel open vragen om dieper denken te stimuleren...'"
          value={pedagogy}
          onChange={(e) => setPedagogy(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Geef hier instructies over de toon en benadering van de chatbot richting de student.</p>
      </div>
    </div>
  );
};

export default ChatbotSettings; 