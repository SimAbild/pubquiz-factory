import {Tabs} from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'All' }} />
            <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
            <Tabs.Screen name="map" options={{ title: 'Map' }} />
            <Tabs.Screen name="logbook" options={{ title: 'Logbook', headerShown: false }} />
        </Tabs>
    );
}
