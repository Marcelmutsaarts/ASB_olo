'use client';

import React from 'react';
import FileInput from './FileInput';

interface ContentInputProps {
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
}

const ContentInput: React.FC<ContentInputProps> = ({ content, setContent }) => {
  const characterCount = content.length;
  const maxCharacters = 20000;
  
  const handleFileProcessed = (text: string) => {
    setContent((prevContent) => `${prevContent}\n\n--- Inhoud uit bestand ---\n${text}`);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <label htmlFor="content" className="block text-2xl font-bold text-gray-800 mb-2 text-center">
          1. Voer hier je leerinhoud in
        </label>
        <p className="text-gray-600 text-center mb-4">
          Plak hier je tekst, of upload een bestand (.docx, .txt, .md) die als basis dient voor je leeromgeving.
        </p>
      </div>
      
      <div className="space-y-4">
        <FileInput onFileProcessed={handleFileProcessed} />

        <div className="relative">
          <textarea
            id="content"
            rows={12}
            className="w-full p-4 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            placeholder="Plak hier je eigen leerstof of upload een bestand..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxCharacters}
          />
          
          <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded">
            {characterCount}/{maxCharacters}
          </div>
        </div>
      </div>
      
      {content.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            <span className="text-sm text-green-700">
              Leerinhoud ingevoerd! Je kunt nu apps selecteren en instellen.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentInput; 