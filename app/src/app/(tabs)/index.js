import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEEK_DAYS } from '../../constants/days';
import { getShortDayName, getTodayName } from '../../utils/days';

import {getAllQuizzes} from "../../services/quizzes";
import {getQuizzesForDay} from "../../utils/quizzes";

export default function AllQuizzesScreen() {
  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const allQuizzes = getAllQuizzes();
  const quizzesForDay = getQuizzesForDay(allQuizzes, selectedDay);


  return (
    <View style={styles.screen}>
      <View style={styles.weekStrip}>
        {WEEK_DAYS.map((day) => (
          <Pressable
            key={day}
            onPress={() => setSelectedDay(day)}
            style={[styles.day, day === selectedDay && styles.selectedDay]}
          >
            <Text>{getShortDayName(day)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.heading}>Quizzes on {selectedDay}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: '#FFE082',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
});
