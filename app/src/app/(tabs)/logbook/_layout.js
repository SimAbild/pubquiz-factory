import {Stack} from 'expo-router';

export default function LogbookLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Logbook' }} />
            <Stack.Screen name="[entryId]" options={{ title: 'Entry' }} />
            <Stack.Screen name="new" options={{ title: 'Log a quiz' }} />
        </Stack>
    );
}
