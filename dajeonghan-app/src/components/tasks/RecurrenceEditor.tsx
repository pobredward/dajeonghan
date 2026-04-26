import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as KoreanHolidays from 'korean-holidays';
import { Colors, Typography, Spacing } from '@/constants';
import { TaskCustomization } from '@/types/furnitureTaskTemplate.types';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ─── 반복 예정일 계산 ────────────────────────────────────────
export const getNextOccurrences = (
  startDate: Date,
  customization: TaskCustomization,
  selectedDays: DayOfWeek[],
  count: number
): Date[] => {
  const occurrences: Date[] = [];
  const currentDate = new Date(startDate);

  if (customization.recurrenceType === 'weekly' && selectedDays.length > 0) {
    let weekOffset = 0;
    while (occurrences.length < count && weekOffset < 52) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      selectedDays.forEach(dayOfWeek => {
        const targetDate = new Date(weekStart);
        targetDate.setDate(
          targetDate.getDate() + dayOfWeek + weekOffset * 7 * (customization.interval || 1)
        );
        if (targetDate >= startDate && occurrences.length < count) {
          occurrences.push(new Date(targetDate));
        }
      });
      weekOffset++;
    }
    return occurrences.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
  }

  for (let i = 0; i < count && i < 365; i++) {
    const nextDate = new Date(currentDate);
    switch (customization.recurrenceType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + i * (customization.interval || 1));
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + i * 7 * (customization.interval || 1));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + i * (customization.interval || 1));
        break;
    }
    occurrences.push(nextDate);
  }
  return occurrences;
};

// ─── RecurrenceEditor 컴포넌트 ───────────────────────────────
export interface RecurrenceEditorProps {
  unit: 'day' | 'week' | 'month';
  interval: number;
  selectedDays: DayOfWeek[];
  startDate: Date;
  onUnitChange: (unit: 'day' | 'week' | 'month') => void;
  onIntervalChange: (interval: number) => void;
  onToggleDayOfWeek: (day: DayOfWeek) => void;
  onStartDateChange: (date: Date) => void;
  getNextOccurrences: (
    startDate: Date,
    customization: TaskCustomization,
    selectedDays: DayOfWeek[],
    count: number
  ) => Date[];
  hasTime?: boolean;
  onHasTimeChange?: (hasTime: boolean) => void;
  hasEstimatedTime?: boolean;
  onHasEstimatedTimeChange?: (v: boolean) => void;
  estimatedMinutes?: number;
  onEstimatedMinutesChange?: (minutes: number) => void;
}

export const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({
  unit,
  interval,
  selectedDays,
  startDate,
  onUnitChange,
  onIntervalChange,
  onToggleDayOfWeek,
  onStartDateChange,
  getNextOccurrences: getOccurrences,
  hasTime = false,
  onHasTimeChange,
  hasEstimatedTime = false,
  onHasEstimatedTimeChange,
  estimatedMinutes = 30,
  onEstimatedMinutesChange,
}) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(startDate);

  const pseudoCustomization: TaskCustomization = {
    recurrenceType: unit === 'day' ? 'daily' : unit === 'week' ? 'weekly' : 'monthly',
    interval,
  };

  return (
    <>
      {/* 반복 설정 섹션 */}
      <View style={styles.formSectionHeaderUpcoming}>
        <View style={styles.formSectionHeaderBar} />
        <Text style={styles.formSectionHeaderTitle}>반복 설정</Text>
      </View>

      <View style={styles.formSettingCard}>
        <View style={styles.recurrenceGrid}>
          {(['day', 'week', 'month'] as const).map(u => (
            <TouchableOpacity
              key={u}
              style={[styles.modernRecurrenceCard, unit === u && styles.modernRecurrenceCardActive]}
              onPress={() => onUnitChange(u)}
            >
              <Text style={styles.recurrenceIcon}>
                {u === 'day' ? '📅' : u === 'week' ? '📆' : '🗓️'}
              </Text>
              <Text style={[styles.modernRecurrenceText, unit === u && styles.modernRecurrenceTextActive]}>
                {u === 'day' ? '매일' : u === 'week' ? '매주' : '매월'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formIntervalRow}>
          <Text style={styles.formIntervalLabel}>간격</Text>
          <View style={styles.formIntervalControls}>
            <TouchableOpacity style={styles.formIntervalBtn} onPress={() => onIntervalChange(Math.max(1, interval - 1))}>
              <Text style={styles.formIntervalBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.formIntervalValueBox}>
              <Text style={styles.formIntervalNumber}>{interval}</Text>
              <Text style={styles.formIntervalUnit}>
                {unit === 'day' ? '일마다' : unit === 'week' ? '주마다' : '개월마다'}
              </Text>
            </View>
            <TouchableOpacity style={styles.formIntervalBtn} onPress={() => onIntervalChange(Math.min(30, interval + 1))}>
              <Text style={styles.formIntervalBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {unit === 'week' && (
          <View style={styles.formDayPickerRow}>
            <Text style={styles.formIntervalLabel}>요일</Text>
            <View style={styles.formDayPicker}>
              {dayNames.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.formDayBtn, selectedDays.includes(index as DayOfWeek) && styles.formDayBtnActive]}
                  onPress={() => onToggleDayOfWeek(index as DayOfWeek)}
                >
                  <Text style={[styles.formDayBtnText, selectedDays.includes(index as DayOfWeek) && styles.formDayBtnTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 시작일 섹션 */}
      <View style={styles.formSectionHeaderUpcoming}>
        <View style={styles.formSectionHeaderBar} />
        <Text style={styles.formSectionHeaderTitle}>시작일</Text>
      </View>

      <View style={styles.formSettingCard}>
        <View style={styles.formStartDateRow}>
          <TouchableOpacity style={styles.formDateBtn} onPress={() => { const d = new Date(startDate); d.setDate(d.getDate() - 1); onStartDateChange(d); }}>
            <Text style={styles.formDateBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.formDateDisplay}>
            <Text style={styles.formDateText}>
              {startDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </Text>
            <Text style={styles.formDateWeekday}>
              {startDate.toLocaleDateString('ko-KR', { weekday: 'long' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.formDateBtn} onPress={() => { const d = new Date(startDate); d.setDate(d.getDate() + 1); onStartDateChange(d); }}>
            <Text style={styles.formDateBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendarStyle}
            current={startDate.toISOString().split('T')[0]}
            markedDates={(() => {
              const marked: Record<string, any> = {};
              const nextDates = getOccurrences(startDate, pseudoCustomization, selectedDays, 10);
              nextDates.forEach((date, index) => {
                const key = date.toISOString().split('T')[0];
                if (index < 3) {
                  marked[key] = { selected: true, selectedColor: Colors.primary, selectedTextColor: Colors.white };
                } else {
                  marked[key] = { marked: true, dotColor: Colors.textSecondary };
                }
              });
              return marked;
            })()}
            dayComponent={({ date, state }) => {
              if (!date) return null;
              const dateObj = new Date(date.year, date.month - 1, date.day);
              const dow = dateObj.getDay();
              const isHoliday = KoreanHolidays.isHoliday(dateObj);
              const nextDates = getOccurrences(startDate, pseudoCustomization, selectedDays, 50);
              const hasSchedule = nextDates.some(d => d.toISOString().split('T')[0] === date.dateString);
              let textColor: string = Colors.textPrimary;
              if (isHoliday || dow === 0) textColor = '#FF3B30';
              else if (dow === 6) textColor = '#007AFF';
              return (
                <View style={hasSchedule ? [styles.calendarDay, styles.calendarDayMarked] : styles.calendarDay}>
                  <Text style={[styles.calendarDayText, { color: textColor }]}>{date.day}</Text>
                </View>
              );
            }}
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.lightGray,
              dotColor: Colors.primary,
              selectedDotColor: Colors.white,
              arrowColor: Colors.primary,
              disabledArrowColor: Colors.lightGray,
              monthTextColor: Colors.textPrimary,
              indicatorColor: Colors.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 12,
              textMonthFontSize: 14,
              textDayHeaderFontSize: 10,
            }}
            hideExtraDays
            firstDay={1}
            onMonthChange={month => {
              setCurrentCalendarMonth(new Date(month.year, month.month - 1, 1));
            }}
          />
        </View>
        <Text style={styles.formCalendarHint}>파란 테두리 = 반복 예정일</Text>
      </View>

      {/* 시간 설정 섹션 */}
      <View style={styles.formSectionHeaderUpcoming}>
        <View style={styles.formSectionHeaderBar} />
        <Text style={styles.formSectionHeaderTitle}>시간 설정</Text>
      </View>

      <View style={styles.formSettingCard}>
        <View style={styles.formTimeToggleRow}>
          <Text style={styles.formIntervalLabel}>시간 지정</Text>
          <Switch
            value={hasTime}
            onValueChange={v => {
              onHasTimeChange?.(v);
              if (v) { const d = new Date(startDate); d.setHours(9, 0, 0, 0); onStartDateChange(d); }
            }}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {hasTime && (
          <View style={styles.formTimePickerRow}>
            <TouchableOpacity style={styles.formDateBtn} onPress={() => { const d = new Date(startDate); d.setHours((d.getHours() - 1 + 24) % 24); onStartDateChange(d); }}>
              <Text style={styles.formDateBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.formTimeValueBox}>
              <Text style={styles.formTimeValueText}>{String(startDate.getHours()).padStart(2, '0')}</Text>
              <Text style={styles.formTimeUnitLabel}>시</Text>
            </View>
            <TouchableOpacity style={styles.formDateBtn} onPress={() => { const d = new Date(startDate); d.setHours((d.getHours() + 1) % 24); onStartDateChange(d); }}>
              <Text style={styles.formDateBtnText}>›</Text>
            </TouchableOpacity>
            <Text style={styles.formTimeColon}>:</Text>
            <TouchableOpacity style={styles.formDateBtn} onPress={() => { const d = new Date(startDate); const m = Math.floor(d.getMinutes() / 10) * 10; d.setMinutes((m - 10 + 60) % 60); onStartDateChange(d); }}>
              <Text style={styles.formDateBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.formTimeValueBox}>
              <Text style={styles.formTimeValueText}>{String(Math.floor(startDate.getMinutes() / 10) * 10).padStart(2, '0')}</Text>
              <Text style={styles.formTimeUnitLabel}>분</Text>
            </View>
            <TouchableOpacity style={styles.formDateBtn} onPress={() => { const d = new Date(startDate); const m = Math.floor(d.getMinutes() / 10) * 10; d.setMinutes((m + 10) % 60); onStartDateChange(d); }}>
              <Text style={styles.formDateBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {onHasEstimatedTimeChange !== undefined && <View style={styles.formTimeDivider} />}

        {onHasEstimatedTimeChange !== undefined && (
          <View style={styles.formTimeToggleRow}>
            <Text style={styles.formIntervalLabel}>소요시간 지정</Text>
            <Switch
              value={hasEstimatedTime}
              onValueChange={onHasEstimatedTimeChange}
              trackColor={{ false: Colors.lightGray, true: Colors.warning }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        {onHasEstimatedTimeChange !== undefined && hasEstimatedTime && (
          <View style={styles.formIntervalRow}>
            <View style={styles.formIntervalControls}>
              <TouchableOpacity style={styles.formIntervalBtn} onPress={() => onEstimatedMinutesChange?.(Math.max(5, estimatedMinutes - 5))}>
                <Text style={styles.formIntervalBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.formIntervalValueBox}>
                <Text style={styles.formIntervalNumber}>{estimatedMinutes}</Text>
                <Text style={styles.formIntervalUnit}>분</Text>
              </View>
              <TouchableOpacity style={styles.formIntervalBtn} onPress={() => onEstimatedMinutesChange?.(Math.min(180, estimatedMinutes + 5))}>
                <Text style={styles.formIntervalBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  formSectionHeaderUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.veryLightGray + '80',
    borderRadius: 10,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  formSectionHeaderBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.lightGray,
    marginRight: Spacing.md,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  formSectionHeaderTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  formSettingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  recurrenceGrid: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
  modernRecurrenceCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 6,
    paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.veryLightGray, minHeight: 52,
  },
  modernRecurrenceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  modernRecurrenceText: { ...Typography.label, color: Colors.textSecondary, fontSize: 11, fontWeight: '500' },
  modernRecurrenceTextActive: { color: Colors.primary, fontWeight: '600' },
  recurrenceIcon: { fontSize: 16, marginBottom: 2 },
  formIntervalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.veryLightGray,
  },
  formIntervalLabel: { ...Typography.label, color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  formIntervalControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  formIntervalBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center',
  },
  formIntervalBtnText: { fontSize: 18, color: Colors.primary, fontWeight: '700', lineHeight: 22 },
  formIntervalValueBox: { alignItems: 'center', minWidth: 64 },
  formIntervalNumber: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, lineHeight: 24 },
  formIntervalUnit: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11, marginTop: 1 },
  formDayPickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.veryLightGray,
  },
  formDayPicker: { flexDirection: 'row', gap: 4 },
  formDayBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.veryLightGray, justifyContent: 'center', alignItems: 'center',
  },
  formDayBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formDayBtnText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  formDayBtnTextActive: { color: Colors.white },
  formStartDateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  formDateBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center',
  },
  formDateBtnText: { fontSize: 22, color: Colors.primary, fontWeight: '600', lineHeight: 26 },
  formDateDisplay: { flex: 1, alignItems: 'center' },
  formDateText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  formDateWeekday: { ...Typography.caption, color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  calendarContainer: {
    backgroundColor: Colors.white, borderRadius: 10, padding: Spacing.xs,
    borderWidth: 1, borderColor: Colors.veryLightGray + '40', maxHeight: 280,
  },
  calendarStyle: { borderRadius: 8 },
  calendarDay: { width: 28, height: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  calendarDayMarked: { borderWidth: 1, borderColor: Colors.primary },
  calendarDayText: { fontSize: 12, fontWeight: '400' },
  formCalendarHint: {
    ...Typography.caption, color: Colors.textSecondary, fontSize: 11,
    textAlign: 'center', marginTop: Spacing.sm, opacity: 0.7,
  },
  formTimeDivider: { height: 1, backgroundColor: Colors.veryLightGray, marginVertical: Spacing.sm },
  formTimeToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm,
  },
  formTimePickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.sm, gap: Spacing.xs,
  },
  formTimeValueBox: { alignItems: 'center', minWidth: 48 },
  formTimeValueText: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 1 },
  formTimeUnitLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  formTimeColon: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginHorizontal: Spacing.xs, lineHeight: 36 },
});
