import { useEffect, useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

type TimeWheelPickerProps = {
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
};

const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

const formatNumber = (value: number) => value.toString().padStart(2, '0');

const wrapValue = (value: number, maxExclusive: number) => {
  if (value < 0) {
    return maxExclusive - 1;
  }

  if (value >= maxExclusive) {
    return 0;
  }

  return value;
};

function TimeWheelColumn({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: number[];
  value: number;
  onChange: (value: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const maxExclusive = values.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: value * ITEM_HEIGHT,
      animated: false,
    });
  }, [value]);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const nextValue = values[Math.min(Math.max(nextIndex, 0), values.length - 1)];
    onChange(nextValue);
  };

  return (
    <View style={styles.column}>
      <TouchableOpacity style={styles.adjustButton} onPress={() => onChange(wrapValue(value + 1, maxExclusive))}>
        <Text style={styles.adjustText}>+</Text>
      </TouchableOpacity>

      <View style={styles.wheelFrame}>
        <ScrollView
          ref={scrollRef}
          nestedScrollEnabled
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.wheelContent}
          onMomentumScrollEnd={handleMomentumEnd}
          onScrollEndDrag={handleMomentumEnd}
        >
          {values.map((item) => {
            const active = item === value;

            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                style={styles.timeItem}
                onPress={() => onChange(item)}
              >
                <Text style={[styles.timeText, active && styles.timeTextActive]}>{formatNumber(item)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View pointerEvents="none" style={styles.selectionBand} />
      </View>

      <TouchableOpacity style={styles.adjustButton} onPress={() => onChange(wrapValue(value - 1, maxExclusive))}>
        <Text style={styles.adjustText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.columnLabel}>{label}</Text>
    </View>
  );
}

export default function TimeWheelPicker({ hour, minute, onHourChange, onMinuteChange }: TimeWheelPickerProps) {
  const displayTime = useMemo(() => `${formatNumber(hour)}:${formatNumber(minute)}`, [hour, minute]);

  return (
    <View style={styles.container}>
      <Text style={styles.displayTime}>{displayTime}</Text>
      <View style={styles.pickerRow}>
        <TimeWheelColumn label="Giờ" values={hours} value={hour} onChange={onHourChange} />
        <Text style={styles.separator}>:</Text>
        <TimeWheelColumn label="Phút" values={minutes} value={minute} onChange={onMinuteChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    alignItems: 'center',
  },
  displayTime: {
    fontSize: 44,
    fontWeight: '800',
    color: '#3525cd',
  },
  pickerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e7e8e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3525cd',
  },
  wheelFrame: {
    width: '100%',
    height: WHEEL_HEIGHT,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  wheelContent: {
    paddingVertical: WHEEL_PADDING,
  },
  selectionBand: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: WHEEL_PADDING,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(53, 37, 205, 0.2)',
  },
  timeItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#777587',
  },
  timeTextActive: {
    fontSize: 30,
    fontWeight: '800',
    color: '#191c1d',
  },
  separator: {
    marginTop: -28,
    fontSize: 34,
    fontWeight: '800',
    color: '#777587',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777587',
    textTransform: 'uppercase',
  },
});
