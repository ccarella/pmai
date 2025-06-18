interface ChangeHistoryItem {
  id: string;
  timestamp: Date;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  issueNumber: number;
  userId?: string;
}

const HISTORY_KEY_PREFIX = 'issue_history_';
const MAX_HISTORY_ITEMS = 50;

export class HistoryLogger {
  static logChange(
    issueNumber: number,
    field: string,
    oldValue: unknown,
    newValue: unknown,
    userId?: string
  ): void {
    try {
      const historyKey = `${HISTORY_KEY_PREFIX}${issueNumber}`;
      const existingHistory = this.getHistory(issueNumber);
      
      const newItem: ChangeHistoryItem = {
        id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date(),
        field,
        oldValue,
        newValue,
        issueNumber,
        userId,
      };

      // Add new item at the beginning
      const updatedHistory = [newItem, ...existingHistory].slice(0, MAX_HISTORY_ITEMS);
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Failed to log change history:', error);
    }
  }

  static getHistory(issueNumber: number): ChangeHistoryItem[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const historyKey = `${HISTORY_KEY_PREFIX}${issueNumber}`;
      const historyData = localStorage.getItem(historyKey);
      
      if (!historyData) return [];
      
      const history = JSON.parse(historyData) as ChangeHistoryItem[];
      return history.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Failed to retrieve change history:', error);
      return [];
    }
  }

  static clearHistory(issueNumber: number): void {
    try {
      if (typeof window !== 'undefined') {
        const historyKey = `${HISTORY_KEY_PREFIX}${issueNumber}`;
        localStorage.removeItem(historyKey);
      }
    } catch (error) {
      console.error('Failed to clear change history:', error);
    }
  }

  static formatHistoryItem(item: ChangeHistoryItem): string {
    const date = item.timestamp.toLocaleString();
    const fieldName = item.field.charAt(0).toUpperCase() + item.field.slice(1);
    
    if (item.field === 'labels') {
      const oldLabels = ((item.oldValue as { name: string }[] | undefined) || []).map((l) => l.name).join(', ') || 'None';
      const newLabels = ((item.newValue as { name: string }[] | undefined) || []).map((l) => l.name).join(', ') || 'None';
      return `${date}: ${fieldName} changed from "${oldLabels}" to "${newLabels}"`;
    }
    
    return `${date}: ${fieldName} changed from "${item.oldValue || 'Empty'}" to "${item.newValue}"`;
  }
}