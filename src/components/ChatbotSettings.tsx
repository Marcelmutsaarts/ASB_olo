'use client';

import React from 'react';

interface DidacticRole {
  title: string;
  text: string;
}

interface PedagogicalRole {
  title: string;
  text: string;
}

interface ChatbotSettingsProps {
  didactics: string;
  setDidactics: (value: string) => void;
  pedagogy: string;
  setPedagogy: (value: string) => void;
  didacticRoles: DidacticRole[];
  pedagogicalRoles: PedagogicalRole[];
}

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({ didactics, setDidactics, pedagogy, setPedagogy, didacticRoles, pedagogicalRoles }) => {
  
  const handleDidacticRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTitle = event.target.value;
    const selectedRole = didacticRoles.find(role => role.title === selectedTitle);
    if (selectedRole) {
      setDidactics(selectedRole.text);
    }
  };

  const handlePedagogicalRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTitle = event.target.value;
    const selectedRole = pedagogicalRoles.find(role => role.title === selectedTitle);
    if (selectedRole) {
      setPedagogy(selectedRole.text);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
      {/* Didactiek met dropdown */}
      <div className="space-y-2">
        <label htmlFor="didactics" className="block text-lg font-semibold text-gray-800">
          Vakdidactische Instructies
        </label>
        
        <select
          onChange={handleDidacticRoleChange}
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 bg-white appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em' }}
        >
          {didacticRoles.map(role => (
            <option key={role.title} value={role.title}>{role.title}</option>
          ))}
        </select>
        
        <textarea
          id="didactics"
          rows={5}
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 placeholder-gray-400 bg-gray-50"
          placeholder="Selecteer een rol hierboven of schrijf je eigen instructies... Bijv: 'Gebruik de STARR-methode' of 'Leg uit met voorbeelden uit de zorg...'"
          value={didactics}
          onChange={(e) => setDidactics(e.target.value)}
        />
        <p className="text-sm text-gray-600">Selecteer een standaardrol of schrijf eigen instructies voor hoe de chatbot de leerstof moet benaderen.</p>
      </div>
      
      {/* Pedagogiek met dropdown */}
      <div className="space-y-2">
        <label htmlFor="pedagogy" className="block text-lg font-semibold text-gray-800">
          Pedagogische Instructies
        </label>

        <select
          onChange={handlePedagogicalRoleChange}
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 bg-white appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em' }}
        >
          {pedagogicalRoles.map(role => (
            <option key={role.title} value={role.title}>{role.title}</option>
          ))}
        </select>

        <textarea
          id="pedagogy"
          rows={5}
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 placeholder-gray-400 bg-gray-50"
          placeholder="Selecteer een rol hierboven of schrijf je eigen instructies... Bijv: 'Spreek de student motiverend aan' of 'Stel open vragen...'"
          value={pedagogy}
          onChange={(e) => setPedagogy(e.target.value)}
        />
        <p className="text-sm text-gray-600">Selecteer een standaardrol of schrijf eigen instructies voor de toon en benadering van de chatbot.</p>
      </div>
    </div>
  );
};

export default ChatbotSettings; 