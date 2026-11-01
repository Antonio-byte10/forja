import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useHydrated } from '@/store';
import { colors } from '@/theme';

export default function RootLayout() {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="treino" options={{ title: 'Treino' }} />
        <Stack.Screen name="historico" options={{ title: 'Histórico' }} />
        <Stack.Screen name="fichas/index" options={{ title: 'Fichas' }} />
        <Stack.Screen name="fichas/[id]" options={{ title: 'Editar ficha' }} />
        <Stack.Screen name="backup" options={{ title: 'Backup' }} />
      </Stack>
    </>
  );
}
