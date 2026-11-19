import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold } from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useHydrated } from '@/store';
import { colors } from '@/theme';

export default function RootLayout() {
  const hydrated = useHydrated();
  const [fontsLoaded, fontError] = useFonts({
    Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold,
    BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold,
  });
  // Se a fonte falhar, segue com a do sistema em vez de travar numa tela vazia.
  if (!hydrated || (!fontsLoaded && !fontError)) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="treino" options={{ gestureEnabled: false }} />
        <Stack.Screen name="ficha/[id]" />
        <Stack.Screen name="backup" />
        <Stack.Screen name="atividade" />
        <Stack.Screen name="resumo" options={{ gestureEnabled: false }} />
        <Stack.Screen name="exercicio/[key]" />
        <Stack.Screen name="editar/[id]" />
        <Stack.Screen name="fotos" />
      </Stack>
    </>
  );
}
