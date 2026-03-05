import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, T, S, R, SHADOW, BTN_HEIGHT_SM, SCREEN_H_PAD } from '@/theme';

interface StepNavigatorProps {
  stepIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function StepNavigator({ stepIndex, total, onPrev, onNext }: StepNavigatorProps) {
  const canPrev = stepIndex > 0;
  const canNext = stepIndex < total - 1;

  return (
    <View style={s.bar}>
      {/* Prev */}
      <Pressable
        style={({ pressed }) => [s.ghostBtn, !canPrev && s.btnDisabled, pressed && canPrev && s.btnPressed]}
        onPress={onPrev}
        disabled={!canPrev}
      >
        <Text style={[s.ghostBtnText, !canPrev && s.disabledText]}>← Prev</Text>
      </Pressable>

      {/* Counter */}
      <View style={s.counter}>
        <Text style={s.counterStep}>{stepIndex + 1}</Text>
        <Text style={s.counterOf}> / {total}</Text>
      </View>

      {/* Next */}
      <Pressable
        style={({ pressed }) => [s.filledBtn, !canNext && s.btnDisabled, pressed && canNext && s.btnPressed]}
        onPress={onNext}
        disabled={!canNext}
      >
        <Text style={s.filledBtnText}>Next →</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar:          { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SCREEN_H_PAD, backgroundColor: C.bgCard, borderTopWidth: 1, borderTopColor: C.border, ...SHADOW.lg },
  ghostBtn:     { height: BTN_HEIGHT_SM, paddingHorizontal: S.md, borderRadius: R.full, borderWidth: 1.5, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { ...T.smallBold, color: C.primary },
  filledBtn:    { height: BTN_HEIGHT_SM, paddingHorizontal: S.md, borderRadius: R.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.xs },
  filledBtnText:{ ...T.smallBold, color: '#fff', fontWeight: '700' },
  btnDisabled:  { opacity: 0.35 },
  btnPressed:   { opacity: 0.85 },
  disabledText: { color: C.textMuted },
  counter:      { flexDirection: 'row', alignItems: 'baseline' },
  counterStep:  { ...T.heading, color: C.text },
  counterOf:    { ...T.subhead, color: C.textMuted },
});
