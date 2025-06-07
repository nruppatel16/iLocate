import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Play, Pause } from 'lucide-react-native';
import { ShiftState, Settings } from '../types';
import { formatTime, formatDuration } from '../utils/timeUtils';

interface ShiftTimerCardProps {
  shiftState: ShiftState;
  settings: Settings;
}

export function ShiftTimerCard({ shiftState, settings }: ShiftTimerCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimerInfo = () => {
    const now = currentTime;
    const minDuration = settings.developerMode ? 30 * 1000 : 60 * 60 * 1000; // 30s vs 1 hour

    if (shiftState.isActive && shiftState.startTime) {
      const duration = Math.floor((now.getTime() - shiftState.startTime.getTime()) / (1000 * 60));
      return {
        title: 'Active Shift',
        subtitle: `Started at ${formatTime(shiftState.startTime)}`,
        duration: formatDuration(duration),
        isActive: true
      };
    }

    if (shiftState.entryTime && !shiftState.isActive) {
      const timeInside = now.getTime() - shiftState.entryTime.getTime();
      const remainingTime = Math.max(0, minDuration - timeInside);
      
      if (remainingTime > 0) {
        const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
        const remainingSeconds = Math.ceil((remainingTime % (1000 * 60)) / 1000);
        
        return {
          title: 'Time Since Entry',
          subtitle: `${settings.developerMode ? '30s' : '1 hour'} minimum to start shift`,
          duration: settings.developerMode ? 
            `${Math.floor(timeInside / 1000)}s (${remainingSeconds}s left)` :
            `${Math.floor(timeInside / (1000 * 60))}m (${remainingMinutes}m left)`,
          isActive: false
        };
      }
    }

    return {
      title: 'No Active Shift',
      subtitle: 'Enter workplace area to start tracking',
      duration: '--:--',
      isActive: false
    };
  };

  const timerInfo = getTimerInfo();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {timerInfo.isActive ? (
            <Play size={20} color="white" />
          ) : (
            <Pause size={20} color="white" />
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{timerInfo.title}</Text>
          <Text style={styles.subtitle}>{timerInfo.subtitle}</Text>
        </View>
      </View>
      
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: timerInfo.isActive ? '#16A34A' : '#6B7280' }]}>
          {timerInfo.duration}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
});