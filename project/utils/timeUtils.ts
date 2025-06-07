export const floorTime = (date: Date, mode: 'hour' | 'half-hour'): Date => {
  const newDate = new Date(date);
  
  if (mode === 'hour') {
    newDate.setMinutes(0, 0, 0);
  } else {
    const minutes = newDate.getMinutes();
    if (minutes < 30) {
      newDate.setMinutes(0, 0, 0);
    } else {
      newDate.setMinutes(30, 0, 0);
    }
  }
  
  return newDate;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const calculateShiftDuration = (startTime: Date, endTime: Date): number => {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
};

export const calculatePay = (duration: number, hourlyRate: number): number => {
  return Math.round((duration / 60) * hourlyRate * 100) / 100;
};

export const getWeekDates = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};