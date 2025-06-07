import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, DollarSign, Edit3 } from 'lucide-react-native';
import { Shift } from '../types';
import { formatTime, formatDuration } from '../utils/timeUtils';

interface ShiftCardProps {
  shift: Shift;
  onEdit: (shift: Shift) => void;
}

export function ShiftCard({ shift, onEdit }: ShiftCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onEdit(shift)}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{formatDate(shift.startTime)}</Text>
          <Text style={styles.timeRange}>
            {formatTime(shift.roundedStartTime)} - {formatTime(shift.roundedEndTime)}
          </Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(shift)}>
          <Edit3 size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>{formatDuration(shift.duration)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <DollarSign size={16} color="#16A34A" />
          <Text style={[styles.detailText, { color: '#16A34A', fontWeight: '600' }]}>
            ${shift.pay.toFixed(2)}
          </Text>
        </View>
      </View>
      
      {shift.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {shift.notes}
        </Text>
      )}
      
      {shift.isManual && (
        <View style={styles.manualBadge}>
          <Text style={styles.manualBadgeText}>Manual Entry</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeRange: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  editButton: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  notes: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  manualBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  manualBadgeText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '500',
  },
});