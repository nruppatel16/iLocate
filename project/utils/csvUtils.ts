import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Shift } from '../types';
import { formatTime } from './timeUtils';

export const exportShiftsToCSV = async (shifts: Shift[]): Promise<void> => {
  try {
    const csvHeader = 'Date,Start Time,End Time,Duration (hours),Pay,Notes\n';
    
    const csvRows = shifts.map(shift => {
      const date = shift.startTime.toLocaleDateString();
      const startTime = formatTime(shift.roundedStartTime);
      const endTime = formatTime(shift.roundedEndTime);
      const durationHours = (shift.duration / 60).toFixed(2);
      const pay = shift.pay.toFixed(2);
      const notes = (shift.notes || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues
      
      return `${date},${startTime},${endTime},${durationHours},$${pay},"${notes}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    const fileName = `shifts_export_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Shifts Data'
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};