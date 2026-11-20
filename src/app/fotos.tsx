import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GaleriaFotos } from '@/components/GaleriaFotos';
import { ScreenHeader } from '@/components/ui';
import { colors } from '@/theme';

export default function Fotos() {
  const { bottom } = useSafeAreaInsets();
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScreenHeader kicker="Progresso" title="Fotos" />
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: bottom + 32 }}>
      <GaleriaFotos />
    </ScrollView>
  </View>;
}
