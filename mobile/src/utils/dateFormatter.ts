// utils/dateFormatter.ts
export const formatChatTime = (isoString: string | null) => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) {
      // Today - show just time (e.g., "3:45 PM")
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week - show day name (e.g., "Tuesday")
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      // Older - show short date (e.g., "Apr 15")
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };