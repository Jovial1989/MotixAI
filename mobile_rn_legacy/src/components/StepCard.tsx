import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RepairStep } from '@motixai/shared';
import { ImageLightbox } from './ImageLightbox';
import { C, T, S, R, SHADOW } from '@/theme';

interface StepCardProps {
  step: RepairStep;
  onRetry: () => void;
}

export function StepCard({ step, onRetry }: StepCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [detailsOpen, setDetailsOpen]   = useState(false);
  const hasDetails = !!(step.torqueValue || step.warningNote);

  return (
    <View style={s.card}>
      {/* Number pill + title */}
      <View style={s.titleRow}>
        <View style={s.pill}>
          <Text style={s.pillText}>{step.stepOrder}</Text>
        </View>
        <Text style={s.title} numberOfLines={3}>{step.title}</Text>
      </View>

      {/* Image */}
      <View style={s.imageWrap}>
        <ImageLightbox
          imageUrl={step.imageUrl}
          imageStatus={step.imageStatus as 'none' | 'queued' | 'generating' | 'ready' | 'failed'}
          visible={lightboxOpen}
          onOpen={() => setLightboxOpen(true)}
          onClose={() => setLightboxOpen(false)}
          onRetry={onRetry}
        />
      </View>

      {/* Instruction */}
      <Text style={s.instruction}>{step.instruction}</Text>

      {/* Expandable details */}
      {hasDetails && (
        <>
          <Pressable style={s.detailsToggle} onPress={() => setDetailsOpen((o) => !o)} hitSlop={4}>
            <Text style={s.detailsToggleText}>
              {detailsOpen ? '▲ Hide details' : '▼ Show details'}
            </Text>
          </Pressable>
          {detailsOpen && (
            <View style={s.specRow}>
              {step.torqueValue && (
                <View style={[s.specChip, s.torqueChip]}>
                  <Text style={s.specIcon}>🔩</Text>
                  <Text style={s.specLabel}>Torque</Text>
                  <Text style={s.specValue}>{step.torqueValue}</Text>
                </View>
              )}
              {step.warningNote && (
                <View style={[s.specChip, s.warnChip]}>
                  <Text style={s.specIcon}>⚠️</Text>
                  <Text style={[s.specLabel, s.warnText]} numberOfLines={3}>{step.warningNote}</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:         { backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, ...SHADOW.xs, gap: S.sm },
  titleRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  pill:         { width: 36, height: 36, borderRadius: R.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  pillText:     { fontSize: 14, fontWeight: '800', color: '#fff' },
  title:        { ...T.heading, flex: 1 },
  imageWrap:    { marginVertical: S.xs },
  instruction:  { ...T.body, lineHeight: 24, color: C.textSub },
  detailsToggle:{ alignSelf: 'flex-start', paddingVertical: S.xs },
  detailsToggleText: { ...T.smallBold, color: C.primary },
  specRow:      { gap: S.xs },
  specChip:     { flexDirection: 'row', alignItems: 'center', gap: S.xs, borderRadius: R.sm, padding: S.sm, borderWidth: 1 },
  torqueChip:   { backgroundColor: C.successLight, borderColor: C.successBorder },
  warnChip:     { backgroundColor: C.warningLight, borderColor: C.warningBorder },
  specIcon:     { fontSize: 14 },
  specLabel:    { ...T.caption, color: C.success, fontWeight: '600', textTransform: undefined, letterSpacing: 0 },
  specValue:    { ...T.smallBold, color: C.success },
  warnText:     { color: C.warning, flex: 1 },
});
