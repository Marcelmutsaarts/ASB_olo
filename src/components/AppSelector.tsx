'use client';

import React from 'react';
import { AppId, appCategories, appDetails } from '@/types/apps';

interface AppSelectorProps {
  selectedApps: Record<AppId, boolean>;
  setSelectedApps: (value: React.SetStateAction<Record<AppId, boolean>>) => void;
}

const AppSelector: React.FC<AppSelectorProps> = ({ selectedApps, setSelectedApps }) => {
  const handleAppSelection = (appId: AppId) => {
    setSelectedApps(prev => ({ ...prev, [appId]: !prev[appId] }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Selecteer Educatieve Apps</h2>
      <p className="text-gray-600 mb-6">Kies welke apps je wilt genereren op basis van de leerstof.</p>
      <div className="space-y-8">
        {Object.values(appCategories).map((category, index) => (
          <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
             <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-500 rounded-lg text-white">
                <span className="text-2xl">{category.icon}</span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {category.apps.map((appId) => {
                const app = appDetails[appId];
                const isSelected = selectedApps[appId];
                return (
                  <div
                    key={appId}
                    onClick={() => handleAppSelection(appId)}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 transform border-2 
                      ${isSelected 
                        ? 'bg-indigo-50 border-indigo-500 shadow-lg scale-105' 
                        : 'bg-white hover:bg-gray-50 border-transparent hover:border-indigo-300'
                      }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{app.icon}</span>
                      <h4 className="text-lg font-bold text-gray-900">{app.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {app.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppSelector; 