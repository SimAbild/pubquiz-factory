import { useState } from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';

import { getTodayName } from '../../utils/days';

import {getAllQuizzes} from "../../services/quizzes";
import {getQuizzesForDay} from "../../utils/quizzes";
import WeekStrip from "../../components/WeekStrip";

export default function AllQuizzesScreen() {
  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const allQuizzes = getAllQuizzes();
  const quizzesForDay = getQuizzesForDay(allQuizzes, selectedDay);


  return (
    <View style={styles.screen}>
      <WeekStrip
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        quizzes={allQuizzes}
      />
      <Text style={styles.heading}>Quizzes on {selectedDay}</Text>
      <FlatList
          data={quizzesForDay}
          keyExtractor={(quiz) => quiz.id}
          renderItem={({item}) => <Text>{item.name}</Text>}
          ListEmptyComponent={<Text>No quizzes added yet</Text>}
        />

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
});
