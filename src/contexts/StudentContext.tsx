'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Student {
  id: string;
  name: string;
  createdAt: string;
  lastActive: string;
}

interface StudentContextType {
  currentStudent: Student | null;
  login: (name: string, rememberMe?: boolean) => void;
  logout: () => void;
  isLoggedIn: boolean;
  getPreviousStudents: () => Student[];
  clearStudentData: (studentId: string) => void;
}

// Context
const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Provider component
interface StudentProviderProps {
  children: ReactNode;
}

export const StudentProvider: React.FC<StudentProviderProps> = ({ children }) => {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Load saved student session on mount
  useEffect(() => {
    const savedStudentId = localStorage.getItem('currentStudentId');
    const rememberMe = localStorage.getItem('rememberStudent') === 'true';
    
    if (savedStudentId && rememberMe) {
      const students = getAllStudents();
      const student = students.find(s => s.id === savedStudentId);
      if (student) {
        // Update last active time
        const updatedStudent = { ...student, lastActive: new Date().toISOString() };
        saveStudent(updatedStudent);
        setCurrentStudent(updatedStudent);
      }
    }
  }, []);

  // Helper function to generate student ID
  const generateStudentId = (name: string): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '').substr(0, 8);
    return `${nameSlug}_${timestamp}_${random}`;
  };

  // Get all students from localStorage
  const getAllStudents = (): Student[] => {
    try {
      const studentsData = localStorage.getItem('allStudents');
      return studentsData ? JSON.parse(studentsData) : [];
    } catch {
      return [];
    }
  };

  // Save student to localStorage
  const saveStudent = (student: Student) => {
    const students = getAllStudents();
    const existingIndex = students.findIndex(s => s.id === student.id);
    
    if (existingIndex >= 0) {
      students[existingIndex] = student;
    } else {
      students.push(student);
    }
    
    // Keep only last 10 students to prevent localStorage bloat
    if (students.length > 10) {
      students.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      students.splice(10);
    }
    
    localStorage.setItem('allStudents', JSON.stringify(students));
  };

  // Login function
  const login = (name: string, rememberMe: boolean = false) => {
    if (!name.trim()) return;

    // Check if student with this name already exists
    const students = getAllStudents();
    let student = students.find(s => 
      s.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (student) {
      // Update existing student's last active time
      student = { ...student, lastActive: new Date().toISOString() };
    } else {
      // Create new student
      student = {
        id: generateStudentId(name),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
    }

    saveStudent(student);
    setCurrentStudent(student);
    
    // Save session info
    localStorage.setItem('currentStudentId', student.id);
    localStorage.setItem('rememberStudent', rememberMe.toString());
  };

  // Logout function
  const logout = () => {
    setCurrentStudent(null);
    localStorage.removeItem('currentStudentId');
    localStorage.removeItem('rememberStudent');
  };

  // Get previous students for quick login
  const getPreviousStudents = (): Student[] => {
    return getAllStudents()
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
      .slice(0, 5); // Show last 5 students
  };

  // Clear all data for a specific student
  const clearStudentData = (studentId: string) => {
    // Get all localStorage keys that belong to this student
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`student_${studentId}_`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all student-specific data
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Remove student from students list
    const students = getAllStudents().filter(s => s.id !== studentId);
    localStorage.setItem('allStudents', JSON.stringify(students));
    
    // If current student is being cleared, logout
    if (currentStudent?.id === studentId) {
      logout();
    }
  };

  const value: StudentContextType = {
    currentStudent,
    login,
    logout,
    isLoggedIn: currentStudent !== null,
    getPreviousStudents,
    clearStudentData
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

// Hook to use student context
export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};