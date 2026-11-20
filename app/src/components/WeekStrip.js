import {Pressable, StyleSheet, Text, View} from 'react-native';

import {WEEK_DAYS} from '../constants/days';
import {getShortDayName} from '../utils/days';
import {countQuizzesForDay} from '../utils/quizzes';

export default function WeekStrip({selectedDay, onSelectDay, quizzes}) {
    return (
        <View style={styles.weekStrip}>
            {WEEK_DAYS.map((day) => (
                <Pressable
                    key={day}
                    onPress={() => onSelectDay(day)}
                    style={[styles.day, day === selectedDay && styles.selectedDay]}
                >
                    <Text>{getShortDayName(day)}</Text>
                    <Text style={styles.count}>{countQuizzesForDay(quizzes,day)}</Text>
                </Pressable>
            ))}
        </View>
    )
}


const styles = StyleSheet.create({
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
    count: {
        fontSize: 12,
        color: "#6B6358"
    },
});
