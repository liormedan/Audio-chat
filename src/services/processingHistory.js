// Processing history service
import authService from './auth';

const HISTORY_STORAGE_KEY = 'audiochat_processing_history';

class ProcessingHistoryService {
  constructor() {
    this.history = this.loadHistory();
  }

  // Load history from localStorage
  loadHistory() {
    try {
      const user = authService.getCurrentUser();
      if (!user) return {};

      const userId = user.uid || user.id || user.sub;
      const allHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '{}');
      
      return allHistory[userId] || [];
    } catch (error) {
      console.error('Error loading processing history:', error);
      return [];
    }
  }

  // Save history to localStorage
  saveHistory() {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const userId = user.uid || user.id || user.sub;
      const allHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '{}');
      
      allHistory[userId] = this.history;
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Error saving processing history:', error);
    }
  }

  // Add a new processing entry to history
  addProcessingEntry(originalFileId, processingResult) {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const entry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        originalFileId,
        processedFileId: processingResult.processed_file_id,
        instructions: processingResult.instructions,
        processingSteps: processingResult.processing_steps,
        audioUrl: processingResult.audio_url,
        audioAnalysis: processingResult.audio_analysis || {}
      };

      this.history.unshift(entry); // Add to beginning of array
      
      // Limit history to 50 entries
      if (this.history.length > 50) {
        this.history = this.history.slice(0, 50);
      }

      this.saveHistory();
      return entry;
    } catch (error) {
      console.error('Error adding processing entry:', error);
    }
  }

  // Get all history entries
  getHistory() {
    return this.history;
  }

  // Get history entries for a specific file
  getHistoryForFile(fileId) {
    return this.history.filter(entry => entry.originalFileId === fileId);
  }

  // Get a specific history entry by ID
  getHistoryEntry(entryId) {
    return this.history.find(entry => entry.id === entryId);
  }

  // Clear all history
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  // Delete a specific history entry
  deleteHistoryEntry(entryId) {
    this.history = this.history.filter(entry => entry.id !== entryId);
    this.saveHistory();
  }

  // Mark a history entry as favorite
  toggleFavorite(entryId) {
    const entry = this.history.find(entry => entry.id === entryId);
    if (entry) {
      entry.isFavorite = !entry.isFavorite;
      this.saveHistory();
    }
  }
}

// Create singleton instance
const processingHistoryService = new ProcessingHistoryService();

export default processingHistoryService;