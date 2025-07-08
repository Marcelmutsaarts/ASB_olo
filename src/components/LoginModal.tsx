'use client';

import React, { useState, useEffect } from 'react';
import { FiUser, FiLogIn, FiClock, FiTrash2, FiX } from 'react-icons/fi';
import { useStudent, Student } from '@/contexts/StudentContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  presentationTitle?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, presentationTitle }) => {
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPreviousStudents, setShowPreviousStudents] = useState(false);
  const { login, getPreviousStudents, clearStudentData } = useStudent();

  const previousStudents = getPreviousStudents();

  useEffect(() => {
    if (isOpen) {
      setShowPreviousStudents(previousStudents.length > 0);
    }
  }, [isOpen, previousStudents.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim(), rememberMe);
      setName('');
      onClose?.();
    }
  };

  const handlePreviousStudentLogin = (student: Student) => {
    login(student.name, rememberMe);
    onClose?.();
  };

  const handleClearStudent = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    if (confirm('Weet je zeker dat je alle gegevens van deze student wilt verwijderen?')) {
      clearStudentData(studentId);
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Net actief';
    if (diffInHours < 24) return `${diffInHours} uur geleden`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Gisteren';
    if (diffInDays < 7) return `${diffInDays} dagen geleden`;
    return date.toLocaleDateString('nl-NL');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiUser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Student Login</h2>
              <p className="text-sm text-gray-500">Toegang tot leeromgeving</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {presentationTitle && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Leeromgeving:</strong> {presentationTitle}
            </p>
          </div>
        )}

        {/* Previous Students */}
        {showPreviousStudents && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              Eerder ingelogd
            </h3>
            <div className="space-y-2">
              {previousStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handlePreviousStudentLogin(student)}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatLastActive(student.lastActive)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleClearStudent(e, student.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                    title="Verwijder student gegevens"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowPreviousStudents(false)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Of login met nieuwe naam
              </button>
            </div>
          </div>
        )}

        {/* New Login Form */}
        {(!showPreviousStudents || previousStudents.length === 0) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                Jouw naam
              </label>
              <input
                type="text"
                id="studentName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Voer je naam in..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700">
                Onthoud mij voor volgende keer
              </label>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <FiLogIn className="w-5 h-5" />
                Start Leren
              </span>
            </button>

            {previousStudents.length > 0 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowPreviousStudents(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Terug naar eerdere studenten
                </button>
              </div>
            )}
          </form>
        )}

        {/* Info */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Je voortgang wordt lokaal opgeslagen in deze browser.
            <br />
            Geen account of wachtwoord nodig.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;