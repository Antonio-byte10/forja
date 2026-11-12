import { useEffect, useId, useMemo, useState } from 'react';
import Svg, { Defs, Ellipse, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { animacoes, type AnimKey } from '@/data/animacoes';
import { caixa, desenhar, paleta, poseEm, type Animacao } from '@/lib/boneco';
import { colors } from '@/theme';

const tons = paleta(colors.accent);
const PARADAS = [0, 0.3, 0.62, 1];
const QUADRO_MS = 1000 / 30;

/** Segundos desde que o componente apareceu, atualizado a ~30 quadros por segundo. */
function useRelogio(ligado: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!ligado) return;
    let id = 0, ultimo = 0;
    const inicio = Date.now();
    const passo = () => {
      const agora = Date.now();
      if (agora - ultimo >= QUADRO_MS) {
        ultimo = agora;
        setT((agora - inicio) / 1000);
      }
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [ligado]);
  return t;
}

/** Boneco fazendo o exercício. Parado mostra a primeira pose (para miniaturas). */
export function Boneco({ anim, parado, label }: { anim: AnimKey; parado?: boolean; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const a: Animacao = animacoes[anim];
  const c = useMemo(() => caixa(a), [a]);
  const t = useRelogio(!parado);
  const { formas, sombra } = desenhar(a, parado ? a.poses[0].pose : poseEm(a, t));

  return (
    <Svg width="100%" height="100%" viewBox={`${c.x} ${c.y} ${c.w} ${c.h}`} accessibilityLabel={label ?? a.nome}>
      <Defs>
        {formas.map((f, i) => (
          <LinearGradient key={i} id={`${id}${i}`} gradientUnits="userSpaceOnUse" x1={f.g[0]} y1={f.g[1]} x2={f.g[2]} y2={f.g[3]}>
            {PARADAS.map((o, k) => <Stop key={k} offset={o} stopColor={tons[f.tom][k]} />)}
          </LinearGradient>
        ))}
      </Defs>
      <Line x1={c.x} x2={c.x + c.w} y1={0.6} y2={0.6} stroke={colors.line} strokeWidth={1.2} />
      {a.objetos?.map((o, i) =>
        o.tipo === 'banco' ? (
          <Rect key={i} x={o.x} y={-o.y - o.h} width={o.w} height={o.h} rx={3} fill={colors.raised} stroke={colors.line} />
        ) : o.tipo === 'parede' ? (
          <Rect key={i} x={o.x} y={c.y} width={14} height={-c.y} fill={colors.raised} stroke={colors.line} />
        ) : (
          <Line key={i} x1={o.x - 46} x2={o.x + 46} y1={-o.y} y2={-o.y} stroke={colors.sub} strokeWidth={4} strokeLinecap="round" />
        ),
      )}
      <Ellipse cx={sombra.cx} cy={1.5} rx={sombra.rx} ry={3.2} fill="#000" opacity={sombra.opacidade} />
      {formas.map((f, i) => <Path key={i} d={f.d} fill={`url(#${id}${i})`} />)}
    </Svg>
  );
}
