import { useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AdicionarFoto, dataCurta, VerFotos } from '@/components/Fotos';
import { Icon } from '@/components/Icon';
import { Button, Card, Txt } from '@/components/ui';
import type { Foto } from '@/lib/types';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

const mes = (t: number) => new Date(t).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

/** Todas as fotos de progresso, por mês, com a comparação da primeira com a mais recente. */
export function GaleriaFotos() {
  const fotos = useStore((st) => st.fotos);
  const { width } = useWindowDimensions();
  const [abertas, setAbertas] = useState<Foto[]>([]);
  const lado = (Math.min(width, 600) - 32 - 16) / 3;

  const grupos: [string, Foto[]][] = [];
  for (const f of fotos) {
    const m = mes(f.t);
    const g = grupos.at(-1);
    if (g && g[0] === m) g[1].push(f);
    else grupos.push([m, [f]]);
  }

  return (
    <>
        <AdicionarFoto />
        {fotos.length >= 2 && (
          <Button
            variant="ghost"
            icon="swap"
            label="Comparar antes e depois"
            onPress={() => setAbertas([fotos[fotos.length - 1], fotos[0]])}
          />
        )}
        {fotos.length === 0 && (
          <Card style={s.empty}>
            <Icon name="camera" size={28} color={colors.faint} />
            <Txt v="sub" style={{ textAlign: 'center' }}>
              Tire uma foto por semana, no mesmo lugar e com a mesma luz. Com o tempo dá para comparar o antes e o depois.
              As fotos ficam só no celular.
            </Txt>
          </Card>
        )}
        {grupos.map(([m, lista]) => (
          <View key={m} style={{ gap: 8 }}>
            <Txt v="label">{m}</Txt>
            <View style={s.grid}>
              {lista.map((f) => (
                <Pressable key={f.id} onPress={() => setAbertas([f])} accessibilityRole="button" accessibilityLabel={`Ver foto de ${dataCurta(f.t)}`}>
                  <Image source={{ uri: f.uri }} style={[s.thumb, { width: lado, height: lado * (4 / 3) }]} />
                  <Txt v="label" style={s.date}>{dataCurta(f.t)}</Txt>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      <VerFotos fotos={abertas} onClose={() => setAbertas([])} />
    </>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { borderRadius: radius.sm, backgroundColor: colors.raised },
  date: { fontSize: 10, marginTop: 4, textAlign: 'center' },
});
