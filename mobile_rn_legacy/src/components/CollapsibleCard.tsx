import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, T, S, R, SHADOW } from '@/theme';

interface CollapsibleCardProps {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: 'warning' | 'default';
}

export function CollapsibleCard({
  title, count, children, defaultOpen = false, accent = 'default',
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bg     = accent === 'warning' ? C.warningLight : C.bgCard;
  const border = accent === 'warning' ? C.warningBorder : C.border;
  const tc     = accent === 'warning' ? C.warning : C.textSub;

  return (
    <View style={[s.card, { backgroundColor: bg, borderColor: border }]}>
      <Pressable
        style={({ pressed }) => [s.header, pressed && { opacity: 0.8 }]}
        onPress={() => setOpen((o) => !o)}
        hitSlop={4}
      >
        <Text style={[s.title, { color: tc }]}>
          {title}{count !== undefined ? ` (${count})` : ''}
        </Text>
        <Text style={[s.chevron, { color: tc }]}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && <View style={s.body}>{children}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { borderRadius: R.lg, borderWidth: 1, overflow: 'hidden', ...SHADOW.xs },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.md, paddingVertical: S.sm + 4 },
  title:   { ...T.smallBold },
  chevron: { fontSize: 10, fontWeight: '700' },
  body:    { paddingHorizontal: S.md, paddingBottom: S.md },
});
