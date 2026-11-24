import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Diario } from '@/components/Diario';
import { Card, ScreenHeader, Txt } from '@/components/ui';
import { useNow } from '@/lib/platform';
import { sessionMinutes } from '@/lib/workout';
import { useStore } from '@/store';
import { colors } from '@/theme';
import { dataLocal, dataValida, meioDia } from '@/lib/datas';

export default function RegistroDoDia() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const { bottom } = useSafeAreaInsets();
  const hoje = dataLocal(useNow(60000));
  const treinos = useStore((st) => st.history).filter((s) => dataLocal(s.startedAt) === data);
  const valido = typeof data === 'string' && dataValida(data) && data <= hoje;
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScreenHeader kicker="Diário" title={valido ? meioDia(data).toLocaleDateString('pt-BR', { dateStyle: 'long' }) : 'Data inválida'} />
    <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottom + 32 }}>
      {treinos.length > 0 && <Card style={{ gap: 8 }}>
        <Txt v="h2">Treinos do dia</Txt>
        {treinos.map((s) => <Txt key={s.id}>{s.planTitle || s.planName || 'Treino'} · {sessionMinutes(s)} min</Txt>)}
      </Card>}
      {valido ? <Diario key={data} dia={data} /> : <Txt>Escolha outro dia no calendário.</Txt>}
    </ScrollView>
  </View>;
}
