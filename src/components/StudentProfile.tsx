'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiUser, FiLogOut, FiSettings, FiDownload, FiTrash2, FiAward, FiUpload } from 'react-icons/fi';
import { useStudent } from '@/contexts/StudentContext';

interface StudentProfileProps {
  presentationTitle?: string;
  className?: string;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ presentationTitle, className = '' }) => {
  const { currentStudent, logout, clearStudentData } = useStudent();
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const updatePosition = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const dropdownWidth = 288; // w-72 = 18rem = 288px
        
        setDropdownPosition({
          top: rect.bottom + 8, // mt-2 = 8px
          left: Math.max(8, rect.right - dropdownWidth) // Ensure it doesn't go off-screen
        });
      };

      updatePosition();

      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showDropdown]);

  // Click outside handling with portal support
  useEffect(() => {
    if (showDropdown) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (buttonRef.current && !buttonRef.current.contains(target)) {
          // Check if click is inside dropdown (portal rendered)
          const dropdownElement = document.querySelector('[data-dropdown-content]');
          if (!dropdownElement || !dropdownElement.contains(target)) {
            setShowDropdown(false);
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  if (!currentStudent) return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    setShowDropdown(false);
  };

  const handleClearMyData = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Weet je zeker dat je al je gegevens wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      clearStudentData(currentStudent.id);
    }
    setShowDropdown(false);
  };

  const handleExportData = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const studentData: {
      student: typeof currentStudent;
      exportDate: string;
      presentation: string | undefined;
      data: Record<string, any>;
    } = {
      student: currentStudent,
      exportDate: new Date().toISOString(),
      presentation: presentationTitle,
      data: {}
    };

    // Collect all student data from localStorage
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`student_${currentStudent.id}_`)) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }

    studentData.data = allData;

    const blob = new Blob([JSON.stringify(studentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_data_${currentStudent.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDropdown(false);
  };

  const handleImportData = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate the imported data structure
      if (!importedData.student || !importedData.data || typeof importedData.data !== 'object') {
        alert('Ongeldig bestandsformaat. Zorg ervoor dat je een geldig export bestand uploadt.');
        return;
      }

      // Ask for confirmation before importing
      const confirmMessage = `Wil je de gegevens van "${importedData.student.name}" importeren?\n\n` +
        `Export datum: ${new Date(importedData.exportDate).toLocaleDateString('nl-NL')}\n` +
        `Presentatie: ${importedData.presentation || 'Onbekend'}\n\n` +
        `Dit zal je huidige gegevens overschrijven voor overlappende data.`;

      if (!confirm(confirmMessage)) {
        return;
      }

      // Import the data by merging with current student's data
      let importCount = 0;
      Object.entries(importedData.data).forEach(([key, value]) => {
        // Replace the student ID in the key with current student's ID
        const originalStudentId = importedData.student.id;
        const newKey = key.replace(`student_${originalStudentId}_`, `student_${currentStudent.id}_`);
        
        try {
          localStorage.setItem(newKey, JSON.stringify(value));
          importCount++;
        } catch (error) {
          console.warn(`Kon niet importeren: ${key}`, error);
        }
      });

      alert(`Succesvol ${importCount} data items geïmporteerd!`);
      
      // Refresh the page to reload all imported data
      window.location.reload();

    } catch (error) {
      console.error('Import error:', error);
      alert('Fout bij het importeren van het bestand. Zorg ervoor dat het een geldig JSON bestand is.');
    }

    // Reset file input
    e.target.value = '';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getJoinedDate = () => {
    const date = new Date(currentStudent.createdAt);
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };


  return (
    <>
      {/* Hidden file input for importing data */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">
              {getInitials(currentStudent.name)}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">
              {currentStudent.name}
            </p>
            <p className="text-xs text-gray-500">
              Student
            </p>
          </div>
          <FiUser className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Dropdown rendered via portal for proper z-index */}
      {mounted && showDropdown && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9999]" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDropdown(false);
            }}
          />
          
          {/* Dropdown */}
          <div 
            data-dropdown-content
            className="fixed w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-[10000] overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">
                    {getInitials(currentStudent.name)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{currentStudent.name}</p>
                  <p className="text-sm text-gray-500">Lid sinds {getJoinedDate()}</p>
                </div>
              </div>
              
              {presentationTitle && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Huidige leeromgeving:</strong>
                    <br />
                    {presentationTitle}
                  </p>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={handleExportData}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FiDownload className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">Exporteer mijn gegevens</p>
                  <p className="text-xs text-gray-500">Download al je voortgang</p>
                </div>
              </button>

              <button
                onClick={handleImportData}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <FiUpload className="w-4 h-4 text-green-500" />
                <div>
                  <p className="font-medium">Importeer gegevens</p>
                  <p className="text-xs text-gray-500">Laad voortgang uit bestand</p>
                </div>
              </button>

              <button
                onClick={handleClearMyData}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <div>
                  <p className="font-medium">Wis mijn gegevens</p>
                  <p className="text-xs text-red-500">Verwijder alle opgeslagen data</p>
                </div>
              </button>

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FiLogOut className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Uitloggen</p>
                    <p className="text-xs text-gray-500">Wissel van student</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Alle gegevens worden lokaal opgeslagen
              </p>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default StudentProfile;