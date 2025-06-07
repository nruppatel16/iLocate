import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, DollarSign, Clock, TrendingUp } from 'lucide-react-native';
import { Shift, Settings } from '../../types';
import { storageService } from '../../services/storageService';
import { getWeekDates, formatDuration } from '../../utils/timeUtils';

export default function WeeklyScreen() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [weeklyData, setWeeklyData] = useState({
    totalHours: 0,
    totalPay: 0,
    totalShifts: 0,
    dailyBreakdown: [] as Array<{
      date: Date;
      shifts: Shift[];
      hours: number;
      pay: number;
    }>
  });

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    try {
      const [shiftsData, settingsData] = await Promise.all([
        storageService.getShifts(),
        storageService.getSettings()
      ]);
      
      setShifts(shiftsData);
      setSettings(settingsData);
      calculateWeeklyData(shiftsData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const calculateWeeklyData = (allShifts: Shift[]) => {
    const { start, end } = getWeekDates(currentWeek);
    
    // Filter shifts for current week
    const weekShifts = allShifts.filter(shift => 
      shift.startTime >= start && shift.startTime <= end
    );

    let totalHours = 0;
    let totalPay = 0;

    // Calculate daily breakdown
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      const dayShifts = weekShifts.filter(shift => 
        shift.startTime.toDateString() === date.toDateString()
      );
      
      const dayHours = dayShifts.reduce((sum, shift) => sum + shift.duration, 0);
      const dayPay = dayShifts.reduce((sum, shift) => sum + shift.pay, 0);
      
      totalHours += dayHours;
      totalPay += dayPay;
      
      dailyBreakdown.push({
        date,
        shifts: dayShifts,
        hours: dayHours,
        pay: dayPay
      });
    }

    setWeeklyData({
      totalHours,
      totalPay,
      totalShifts: weekShifts.length,
      dailyBreakdown
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const formatWeekRange = () => {
    const { start, end } = getWeekDates(currentWeek);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Summary</Text>
          
          <View style={styles.weekNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('prev')}>
              <ChevronLeft size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.weekRange}>{formatWeekRange()}</Text>
            
            <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('next')}>
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Clock size={20} color="#2563EB" />
            </View>
            <Text style={styles.summaryValue}>{formatDuration(weeklyData.totalHours)}</Text>
            <Text style={styles.summaryLabel}>Total Hours</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={20} color="#16A34A" />
            </View>
            <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
              ${weeklyData.totalPay.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total Pay</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={20} color="#EA580C" />
            </View>
            <Text style={styles.summaryValue}>{weeklyData.totalShifts}</Text>
            <Text style={styles.summaryLabel}>Shifts</Text>
          </View>
        </View>

        <View style={styles.dailyBreakdown}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          
          {weeklyData.dailyBreakdown.map((day, index) => (
            <View key={index} style={[styles.dayCard, isToday(day.date) && styles.todayCard]}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={[styles.dayName, isToday(day.date) && styles.todayText]}>
                    {getDayName(day.date)}
                  </Text>
                  <Text style={styles.dayDate}>
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                
                <View style={styles.dayStats}>
                  {day.shifts.length > 0 ? (
                    <>
                      <Text style={styles.dayHours}>{formatDuration(day.hours)}</Text>
                      <Text style={styles.dayPay}>${day.pay.toFixed(2)}</Text>
                    </>
                  ) : (
                    <Text style={styles.noShifts}>No shifts</Text>
                  )}
                </View>
              </View>
              
              {day.shifts.length > 0 && (
                <View style={styles.shiftsPreview}>
                  {day.shifts.map((shift) => (
                    <Text key={shift.id} style={styles.shiftTime}>
                      {shift.roundedStartTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      })} - {shift.roundedEndTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      })}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 120,
    textAlign: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  dailyBreakdown: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  todayText: {
    color: '#2563EB',
  },
  dayDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  dayStats: {
    alignItems: 'flex-end',
  },
  dayHours: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dayPay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 2,
  },
  noShifts: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  shiftsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  shiftTime: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
});