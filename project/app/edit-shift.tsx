import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, Calendar, Clock } from 'lucide-react-native';
import { Shift, Settings } from '../types';
import { storageService } from '../services/storageService';
import { floorTime, calculateShiftDuration, calculatePay, formatTime } from '../utils/timeUtils';

export default function EditShiftScreen() {
  const router = useRouter();
  const { shiftId, isNew } = useLocalSearchParams();
  
  const [shift, setShift] = useState<Shift | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const settingsData = await storageService.getSettings();
      setSettings(settingsData);

      if (isNew === 'true') {
        // Create new shift with current time
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        setStartDate(formatDateInput(oneHourAgo));
        setStartTime(formatTimeInput(oneHourAgo));
        setEndDate(formatDateInput(now));
        setEndTime(formatTimeInput(now));
        setNotes('');
      } else if (shiftId) {
        const shifts = await storageService.getShifts();
        const existingShift = shifts.find(s => s.id === shiftId);
        
        if (existingShift) {
          setShift(existingShift);
          setStartDate(formatDateInput(existingShift.startTime));
          setStartTime(formatTimeInput(existingShift.startTime));
          setEndDate(formatDateInput(existingShift.endTime));
          setEndTime(formatTimeInput(existingShift.endTime));
          setNotes(existingShift.notes || '');
        }
      }
    } catch (error) {
      console.error('Error loading shift data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeInput = (date: Date): string => {
    return date.toTimeString().substring(0, 5);
  };

  const parseDateTime = (dateStr: string, timeStr: string): Date => {
    return new Date(`${dateStr}T${timeStr}:00`);
  };

  const calculatePreview = () => {
    if (!settings || !startDate || !startTime || !endDate || !endTime) {
      return null;
    }

    try {
      const startDateTime = parseDateTime(startDate, startTime);
      const endDateTime = parseDateTime(endDate, endTime);
      
      if (endDateTime <= startDateTime) {
        return null;
      }

      const roundedStart = floorTime(startDateTime, settings.roundingMode);
      const roundedEnd = floorTime(endDateTime, settings.roundingMode);
      const duration = calculateShiftDuration(roundedStart, roundedEnd);
      const pay = calculatePay(duration, settings.hourlyRate);

      return {
        originalStart: startDateTime,
        originalEnd: endDateTime,
        roundedStart,
        roundedEnd,
        duration,
        pay
      };
    } catch (error) {
      return null;
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    const preview = calculatePreview();
    if (!preview) {
      Alert.alert('Error', 'Please check your date and time inputs');
      return;
    }

    try {
      const newShift: Shift = {
        id: shift?.id || Date.now().toString(),
        startTime: preview.originalStart,
        endTime: preview.originalEnd,
        roundedStartTime: preview.roundedStart,
        roundedEndTime: preview.roundedEnd,
        duration: preview.duration,
        pay: preview.pay,
        notes: notes.trim() || undefined,
        isManual: true
      };

      await storageService.saveShift(newShift);
      Alert.alert('Success', 'Shift saved successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving shift:', error);
      Alert.alert('Error', 'Failed to save shift');
    }
  };

  const handleDelete = async () => {
    if (!shift) return;

    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteShift(shift.id);
              router.back();
            } catch (error) {
              console.error('Error deleting shift:', error);
              Alert.alert('Error', 'Failed to delete shift');
            }
          }
        }
      ]
    );
  };

  const preview = calculatePreview();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isNew === 'true' ? 'Add Shift' : 'Edit Shift'}
          </Text>
          
          <View style={styles.headerButtons}>
            {shift && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Trash2 size={18} color="#DC2626" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={18} color="white" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color="#2563EB" />
              <Text style={styles.sectionTitle}>Start Time</Text>
            </View>
            
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeInput}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              
              <View style={styles.dateTimeInput}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#2563EB" />
              <Text style={styles.sectionTitle}>End Time</Text>
            </View>
            
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeInput}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              
              <View style={styles.dateTimeInput}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.textInput}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this shift..."
              multiline
              numberOfLines={3}
            />
          </View>

          {preview && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Shift Preview</Text>
              
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Rounded Times:</Text>
                <Text style={styles.previewValue}>
                  {formatTime(preview.roundedStart)} - {formatTime(preview.roundedEnd)}
                </Text>
              </View>
              
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Duration:</Text>
                <Text style={styles.previewValue}>
                  {Math.floor(preview.duration / 60)}h {preview.duration % 60}m
                </Text>
              </View>
              
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Pay:</Text>
                <Text style={[styles.previewValue, { color: '#16A34A', fontWeight: '600' }]}>
                  ${preview.pay.toFixed(2)}
                </Text>
              </View>
              
              {settings && (
                <Text style={styles.previewNote}>
                  Using {settings.roundingMode} rounding at ${settings.hourlyRate}/hour
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  notesInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  previewNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});