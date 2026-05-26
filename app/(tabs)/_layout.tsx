import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/theme';

function Icon({ emoji, size = 22 }: { emoji: string; size?: number }) {
  return <Text style={{ fontSize: size }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color }) => <Icon emoji="📷" />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: () => <Icon emoji="📋" />,
        }}
      />
      <Tabs.Screen
        name="recompensas"
        options={{
          title: 'Premios',
          tabBarIcon: () => <Icon emoji="🎁" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: () => <Icon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
