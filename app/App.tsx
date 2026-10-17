import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { StoreProvider, useStore } from './src/store';
import { colors, font } from './src/theme';
import Login from './src/screens/Login';
import SmsBridge from './src/SmsBridge';
import { Agenda, Home, InfoScreen, Notices, Squad } from './src/screens/Team';
import { AdminGames, AdminNotices } from './src/screens/Admin';

const Tab = createBottomTabNavigator();
type Icon = keyof typeof Feather.glyphMap;

const opts = (icon: Icon, label: string) => ({
  title: label,
  tabBarIcon: ({ color, size }: { color: string; size: number }) => <Feather name={icon} size={size} color={color} />,
});

function Tabs() {
  const { user } = useStore();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: font.semi, fontSize: 11 },
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.white },
      }}
    >
      {user!.role === 'admin' ? (
        <>
          <Tab.Screen name="Programação" component={AdminGames} options={opts('calendar', 'Programação')} />
          <Tab.Screen name="AvisosAdmin" component={AdminNotices} options={opts('bell', 'Avisos')} />
        </>
      ) : (
        <>
          <Tab.Screen name="Início" component={Home} options={opts('home', 'Início')} />
          <Tab.Screen name="Agenda" component={Agenda} options={opts('calendar', 'Agenda')} />
          <Tab.Screen name="Avisos" component={Notices} options={opts('bell', 'Avisos')} />
          {user!.role === 'coach' && <Tab.Screen name="Equipe" component={Squad} options={opts('users', 'Equipe')} />}
          <Tab.Screen name="Informações" component={InfoScreen} options={opts('info', 'Informações')} />
        </>
      )}
    </Tab.Navigator>
  );
}

function Root() {
  const { user, ready } = useStore();
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  // key força nova navegação ao trocar de perfil
  return user ? (
    <NavigationContainer key={user.id}>
      {user.role !== 'admin' && <SmsBridge />}
      <Tabs />
    </NavigationContainer>
  ) : <Login />;
}

export default function App() {
  const [loaded, fontError] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  // Se a fonte falhar, segue com a fonte do sistema em vez de ficar no spinner.
  if (!loaded && !fontError) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        {/* Em telas largas (tablet/desktop) o app fica numa coluna central, como num celular. */}
        <View style={{ flex: 1, backgroundColor: '#e9edf3' }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.surface, overflow: 'hidden' }}>
            <Root />
          </View>
        </View>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
