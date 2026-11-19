import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { formatKg } from '@/lib/workout';
import { colors, fonts } from '@/theme';

/** Gráfico de linha simples (um ponto por treino), sem biblioteca extra: só o react-native-svg. */
export function LineChart({ values, height = 180, label }: { values: number[]; height?: number; label: string }) {
  const [width, setWidth] = useState(0);
  const padX = 34;
  const padY = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => padX + (values.length === 1 ? (width - padX * 2) / 2 : (i / (values.length - 1)) * (width - padX * 2));
  const y = (v: number) => padY + (1 - (v - min) / span) * (height - padY * 2);
  const pontos = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLabel={label}>
      {width > 0 && values.length > 0 && (
        <Svg width={width} height={height}>
          {[max, (max + min) / 2, min].map((v, i) => (
            <Line key={i} x1={padX} x2={width - 8} y1={y(v)} y2={y(v)} stroke={colors.line} strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {[max, min].map((v, i) => (
            <SvgText key={i} x={2} y={y(v) + 4} fill={colors.faint} fontSize={11} fontFamily={fonts.semibold}>
              {formatKg(v)}
            </SvgText>
          ))}
          {values.length > 1 && <Polyline points={pontos} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" />}
          {values.map((v, i) => (
            <Circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 5 : 3} fill={i === values.length - 1 ? colors.accent : colors.bg} stroke={colors.accent} strokeWidth={2} />
          ))}
        </Svg>
      )}
    </View>
  );
}
