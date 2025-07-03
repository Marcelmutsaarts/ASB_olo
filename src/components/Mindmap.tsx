'use client';

import React, { useState } from 'react';

interface MindmapNode {
  name: string;
  children?: MindmapNode[];
}

interface MindmapProps {
  data: MindmapNode | null;
}

const MindmapNodeComponent: React.FC<{ node: MindmapNode, level: number }> = ({ node, level }) => {
  const [isOpen, setIsOpen] = useState(true);

  const getNodeColors = (level: number) => {
    const colors = [
      'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-300 shadow-lg',
      'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-blue-300 shadow-lg',
      'bg-gradient-to-r from-green-500 to-teal-600 text-white border-green-300 shadow-lg',
      'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-300 shadow-lg',
      'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-300 shadow-lg',
    ];
    return colors[level % colors.length];
  };

  const getNodeSize = (level: number) => {
    if (level === 0) return 'text-xl px-6 py-4 min-h-[60px]';
    if (level === 1) return 'text-lg px-5 py-3 min-h-[50px]';
    if (level === 2) return 'text-base px-4 py-2.5 min-h-[45px]';
    return 'text-sm px-3 py-2 min-h-[40px]';
  };

  const colorClass = getNodeColors(level);
  const sizeClass = getNodeSize(level);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="my-3">
      <div 
        className={`
          ${colorClass} ${sizeClass} rounded-2xl border-l-4 flex items-center justify-between 
          transition-all duration-300 transform hover:scale-105 hover:shadow-xl
          ${hasChildren ? 'cursor-pointer' : 'cursor-default'}
          ${level === 0 ? 'shadow-2xl border-2 border-white/20' : ''}
        `}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <p className="font-semibold leading-tight">{node.name}</p>
        {hasChildren && (
          <span className={`text-lg transition-transform duration-300 text-white/80 ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
        )}
        {level === 0 && (
          <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse ml-2"></div>
        )}
      </div>
      {isOpen && hasChildren && (
        <div className="pl-8 border-l-2 border-gray-300/50 ml-6 mt-4 animate-fadeIn">
          {node.children?.map((child, index) => (
            <div key={index} className="relative">
              {level < 3 && (
                <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent opacity-30"></div>
              )}
              <MindmapNodeComponent node={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Mindmap: React.FC<MindmapProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-inner border border-gray-200">
        <div className="text-6xl mb-6 opacity-60">🧠</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">Geen mindmap</h3>
        <p className="text-gray-500">Er is geen data voor de mindmap beschikbaar of de data kon niet worden geladen.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 sm:p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg mb-6">
          <span className="text-3xl">🧠</span>
        </div>
        <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
          Interactieve Mindmap
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Klik op de knooppunten om ze uit te klappen of in te klappen en verken de inhoud stap voor stap.
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-12">
        <div className="mindmap-container">
          <MindmapNodeComponent node={data} level={0} />
        </div>
      </div>
      
      <div className="text-center mt-8">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          <span>Interactieve mindmap gegenereerd</span>
        </div>
      </div>
    </div>
  );
};

export default Mindmap; 