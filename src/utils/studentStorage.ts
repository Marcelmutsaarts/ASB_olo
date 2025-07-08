// LocalStorage helper utilities for student data management

export interface StudentData {
  studentId: string;
  presentationId: string;
  type: 'notes' | 'progress' | 'chat' | 'scores' | 'preferences';
  data: any;
  lastUpdated: string;
}

class StudentStorage {
  // Generate a key for student-specific data
  private static generateKey(studentId: string, presentationId: string, type: string, subKey?: string): string {
    const baseKey = `student_${studentId}_${type}_${presentationId}`;
    return subKey ? `${baseKey}_${subKey}` : baseKey;
  }

  // Save student data
  static saveStudentData(studentId: string, presentationId: string, type: string, data: any, subKey?: string): void {
    try {
      const key = this.generateKey(studentId, presentationId, type, subKey);
      const studentData: StudentData = {
        studentId,
        presentationId,
        type: type as StudentData['type'],
        data,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(studentData));
    } catch (error) {
      console.error('Error saving student data:', error);
    }
  }

  // Load student data
  static loadStudentData(studentId: string, presentationId: string, type: string, subKey?: string): any {
    try {
      const key = this.generateKey(studentId, presentationId, type, subKey);
      const stored = localStorage.getItem(key);
      if (stored) {
        const studentData: StudentData = JSON.parse(stored);
        return studentData.data;
      }
      return null;
    } catch (error) {
      console.error('Error loading student data:', error);
      return null;
    }
  }

  // Remove specific student data
  static removeStudentData(studentId: string, presentationId: string, type: string, subKey?: string): void {
    try {
      const key = this.generateKey(studentId, presentationId, type, subKey);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing student data:', error);
    }
  }

  // Get all student data for a specific presentation
  static getAllStudentDataForPresentation(studentId: string, presentationId: string): Record<string, any> {
    const allData: Record<string, any> = {};
    const prefix = `student_${studentId}_`;
    const presentationSuffix = `_${presentationId}`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key.endsWith(presentationSuffix)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed: StudentData = JSON.parse(data);
            allData[key] = parsed;
          }
        } catch (error) {
          console.error('Error parsing student data:', error);
        }
      }
    }
    
    return allData;
  }

  // Clear all data for a student in a specific presentation
  static clearStudentPresentationData(studentId: string, presentationId: string): void {
    const keysToRemove: string[] = [];
    const prefix = `student_${studentId}_`;
    const presentationSuffix = `_${presentationId}`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key.endsWith(presentationSuffix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Clear all data for a student across all presentations
  static clearAllStudentData(studentId: string): void {
    const keysToRemove: string[] = [];
    const prefix = `student_${studentId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Migrate old localStorage data to new student-based structure
  static migrateOldData(studentId: string, presentationTitle: string): boolean {
    try {
      let migrated = false;
      const presentationId = this.generatePresentationId(presentationTitle);
      
      // Migrate old student notes format
      const oldNotesKey = `studentNotes_${presentationTitle}`;
      const oldNotes = localStorage.getItem(oldNotesKey);
      if (oldNotes) {
        try {
          const notes = JSON.parse(oldNotes);
          this.saveStudentData(studentId, presentationId, 'notes', notes);
          localStorage.removeItem(oldNotesKey);
          migrated = true;
        } catch (error) {
          console.error('Error migrating notes:', error);
        }
      }

      // Look for other potential old data patterns
      const oldKeys = [
        `flashcardProgress_${presentationTitle}`,
        `quizScores_${presentationTitle}`,
        `chatHistory_${presentationTitle}`
      ];

      oldKeys.forEach(oldKey => {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
          try {
            const data = JSON.parse(oldData);
            const type = oldKey.split('_')[0];
            this.saveStudentData(studentId, presentationId, type as any, data);
            localStorage.removeItem(oldKey);
            migrated = true;
          } catch (error) {
            console.error(`Error migrating ${oldKey}:`, error);
          }
        }
      });

      return migrated;
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  }

  // Generate a consistent presentation ID from title
  static generatePresentationId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }

  // Get storage usage for a student
  static getStudentStorageUsage(studentId: string): { keys: number; size: number } {
    let keys = 0;
    let size = 0;
    const prefix = `student_${studentId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys++;
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }
    
    return { keys, size };
  }

  // Clean up old data (older than specified days)
  static cleanupOldData(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleaned = 0;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('student_')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const data: StudentData = JSON.parse(value);
            const lastUpdated = new Date(data.lastUpdated);
            if (lastUpdated < cutoffDate) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse the data, it might be corrupted, so remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleaned++;
    });
    
    return cleaned;
  }
}

// Convenience functions for specific data types
export const StudentNotes = {
  save: (studentId: string, presentationId: string, notes: Record<string, string>) => 
    StudentStorage.saveStudentData(studentId, presentationId, 'notes', notes),
  
  load: (studentId: string, presentationId: string): Record<string, string> => 
    StudentStorage.loadStudentData(studentId, presentationId, 'notes') || {},
  
  clear: (studentId: string, presentationId: string) => 
    StudentStorage.removeStudentData(studentId, presentationId, 'notes')
};

export const StudentProgress = {
  save: (studentId: string, presentationId: string, progress: any) => 
    StudentStorage.saveStudentData(studentId, presentationId, 'progress', progress),
  
  load: (studentId: string, presentationId: string) => 
    StudentStorage.loadStudentData(studentId, presentationId, 'progress'),
  
  clear: (studentId: string, presentationId: string) => 
    StudentStorage.removeStudentData(studentId, presentationId, 'progress')
};

export const StudentChat = {
  save: (studentId: string, presentationId: string, chatHistory: any[], slideId?: string) => 
    StudentStorage.saveStudentData(studentId, presentationId, 'chat', chatHistory, slideId),
  
  load: (studentId: string, presentationId: string, slideId?: string) => 
    StudentStorage.loadStudentData(studentId, presentationId, 'chat', slideId) || [],
  
  clear: (studentId: string, presentationId: string, slideId?: string) => 
    StudentStorage.removeStudentData(studentId, presentationId, 'chat', slideId)
};

export const StudentScores = {
  save: (studentId: string, presentationId: string, scores: any) => 
    StudentStorage.saveStudentData(studentId, presentationId, 'scores', scores),
  
  load: (studentId: string, presentationId: string) => 
    StudentStorage.loadStudentData(studentId, presentationId, 'scores'),
  
  clear: (studentId: string, presentationId: string) => 
    StudentStorage.removeStudentData(studentId, presentationId, 'scores')
};

export default StudentStorage;