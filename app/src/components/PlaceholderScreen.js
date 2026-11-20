import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderScreen({ title }) {
    return (
        <View style={styles.screen}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20 },
});
