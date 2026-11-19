import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Image, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { catalog } from '@/data/catalog';
import { parseNumber } from '@/lib/workout';
import { colors, fonts, radius } from '@/theme';
import { Boneco } from './Boneco';
import { Icon, type IconName } from './Icon';

const variants = StyleSheet.create({
  hero: { fontFamily: fonts.displayHeavy, fontSize: 44, lineHeight: 46, color: colors.text, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.text, textTransform: 'uppercase' },
  h2: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.sub },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.faint, textTransform: 'uppercase', letterSpacing: 1.2 },
  num: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.text, fontVariant: ['tabular-nums'] },
});

/** Texto com a tipografia do app. */
export const Txt = ({ v = 'body', style, ...props }: TextProps & { v?: keyof typeof variants }) => (
  <Text style={[variants[v], style]} {...props} />
);

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, small, disabled, style }: ButtonProps) {
  const tint = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.accent : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [s.btn, s[variant], small && s.small, disabled && s.disabled, pressed && s.pressed, style]}
    >
      {icon && <Icon name={icon} size={small ? 16 : 20} color={tint} stroke={2.5} />}
      <Text style={[s.btnLabel, small && s.btnLabelSmall, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color = colors.text, filled, disabled, size = 44 }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2 },
        s.iconBtn,
        filled && { backgroundColor: colors.raised },
        disabled && { opacity: 0.25 },
        pressed && s.pressed,
      ]}
    >
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

export const Card = ({ style, ...props }: ViewProps) => <View style={[s.card, style]} {...props} />;

export function ProgressBar({ value, style }: { value: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.track, style]}>
      <View style={[s.fill, { width: `${Math.min(100, Math.max(0, value * 100))}%` }]} />
    </View>
  );
}

/** Cabeçalho das telas fora das abas: voltar, título e uma ação. */
export function ScreenHeader({ title, kicker, right, onBack }: { title: string; kicker?: string; right?: ReactNode; onBack?: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: top + 8 }]}>
      <IconButton icon="chevronLeft" label="Voltar" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} filled />
      <View style={s.headerTitle}>
        {kicker && <Txt v="label">{kicker}</Txt>}
        <Txt v="h2" numberOfLines={1}>{title}</Txt>
      </View>
      {right}
    </View>
  );
}

const show = (n: number) => (n ? String(n).replace('.', ',') : '');

/** Campo numérico que aceita vírgula e não perde o que está sendo digitado. */
export function NumberInput({ value, onChange, label, integer, style }: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  integer?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const [text, setText] = useState(show(value));
  const [synced, setSynced] = useState(value);
  // Valor mudou por fora (ex.: nova série): atualiza o texto sem apagar "42," enquanto digita.
  if (value !== synced) {
    setSynced(value);
    if (parseNumber(text) !== value) setText(show(value));
  }
  return (
    <TextInput
      value={text}
      accessibilityLabel={label}
      onChangeText={(t) => {
        setText(t);
        onChange(parseNumber(t));
      }}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      selectTextOnFocus
      placeholder="0"
      placeholderTextColor={colors.faint}
      style={[s.input, style]}
    />
  );
}

export function Stepper({ value, onChange, min = 1, label }: { value: number; onChange: (n: number) => void; min?: number; label: string }) {
  return (
    <View style={s.stepper}>
      <Txt v="label">{label}</Txt>
      <View style={s.stepRow}>
        <IconButton icon="minus" label={`Menos ${label}`} onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} size={40} />
        <Txt v="num" style={s.stepValue}>{value}</Txt>
        <IconButton icon="plus" label={`Mais ${label}`} onPress={() => onChange(value + 1)} size={40} />
      </View>
    </View>
  );
}

/** Alterna entre 0 e 1 para trocar as duas fotos do movimento. */
function useFase(ligado: boolean) {
  const [fase, setFase] = useState(0);
  useEffect(() => {
    if (!ligado) return;
    const id = setInterval(() => setFase((f) => 1 - f), 1100);
    return () => clearInterval(id);
  }, [ligado]);
  return ligado ? fase : 0;
}

/**
 * `size` é a altura: miniatura 3:2 (a foto inteira, sem cortar). '100%' ocupa a largura toda.
 * `animado`: mostra o movimento — o boneco, se o exercício tiver, ou as duas fotos alternando.
 */
export function ExerciseImage({ catalogKey, name, size, animado }: { catalogKey?: string; name: string; size: number | '100%'; animado?: boolean }) {
  const item = catalogKey ? catalog[catalogKey] : undefined;
  const boneco = item?.anim && (animado || !item.image) ? item.anim : undefined;
  const fase = useFase(!!animado && !boneco && !!item?.image2);
  const box = size === '100%' ? { width: '100%' as const, aspectRatio: 1.5 } : { width: size * 1.5, height: size };
  const small = size !== '100%' && size < 60;
  return (
    <View style={[s.image, small && { borderRadius: 8 }, box, (boneco || !item?.image) && s.placeholder]}>
      {boneco ? (
        <Boneco anim={boneco} parado={!animado} label={`Movimento: ${name}`} />
      ) : item?.image ? (
        <Image source={fase && item.image2 ? item.image2 : item.image} resizeMode="cover" style={s.imageFill} accessibilityLabel={`Foto: ${name}`} />
      ) : (
        <Icon name="dumbbell" size={small ? 16 : 28} color={colors.faint} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 54, borderRadius: radius.md, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  small: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.sm },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.raised },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  btnLabel: { fontFamily: fonts.display, fontSize: 19, letterSpacing: 0.6, textTransform: 'uppercase' },
  btnLabelSmall: { fontSize: 15 },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.raised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: colors.bg },
  headerTitle: { flex: 1 },
  input: {
    backgroundColor: colors.raised, color: colors.text, borderRadius: radius.sm, height: 46,
    fontFamily: fonts.display, fontSize: 22, textAlign: 'center', minWidth: 56,
  },
  stepper: { gap: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.raised, borderRadius: radius.pill, padding: 2 },
  stepValue: { minWidth: 34, textAlign: 'center' },
  image: { borderRadius: radius.md, backgroundColor: '#fff', overflow: 'hidden' },
  imageFill: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
});
