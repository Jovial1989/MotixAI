import { useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Image,
  Modal, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { C, T, S, R } from '@/theme';

const { width: W, height: H } = Dimensions.get('window');

type ImageStatus = 'none' | 'queued' | 'generating' | 'ready' | 'failed';

interface ImageLightboxProps {
  imageUrl?: string | null;
  imageStatus: ImageStatus;
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
  onRetry: () => void;
}

export function ImageLightbox({
  imageUrl, imageStatus, visible, onClose, onOpen, onRetry,
}: ImageLightboxProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (imageStatus !== 'queued' && imageStatus !== 'generating') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [imageStatus, pulse]);

  // ── Ready ──
  if (imageStatus === 'ready' && imageUrl) {
    return (
      <>
        <Pressable onPress={onOpen} style={s.thumb}>
          <Image source={{ uri: imageUrl }} style={s.thumbImg} resizeMode="cover" />
          <View style={s.expandBadge}>
            <Text style={s.expandText}>⤢ Tap to expand</Text>
          </View>
        </Pressable>

        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
          <Pressable style={s.modalBg} onPress={onClose}>
            <Image source={{ uri: imageUrl }} style={s.fullImg} resizeMode="contain" />
            <Pressable style={s.closeBtn} onPress={onClose} hitSlop={12}>
              <Text style={s.closeBtnText}>✕</Text>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ── Queued / Generating ──
  if (imageStatus === 'queued' || imageStatus === 'generating') {
    return (
      <Animated.View style={[s.skeleton, { opacity: pulse }]}>
        <ActivityIndicator color={C.primary} size="small" />
        <Text style={s.skeletonText}>Generating illustration…</Text>
      </Animated.View>
    );
  }

  // ── Failed ──
  if (imageStatus === 'failed') {
    return (
      <Pressable style={s.failBox} onPress={onRetry}>
        <Text style={s.failIcon}>⟳</Text>
        <Text style={s.failText}>Tap to retry</Text>
      </Pressable>
    );
  }

  return null;
}

const s = StyleSheet.create({
  // Thumbnail
  thumb:       { borderRadius: R.md, overflow: 'hidden', position: 'relative' },
  thumbImg:    { width: '100%', height: 200 },
  expandBadge: { position: 'absolute', bottom: S.sm, right: S.sm, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: R.xs, paddingHorizontal: S.sm, paddingVertical: 3 },
  expandText:  { ...T.caption, color: '#fff', fontWeight: '500', textTransform: undefined, letterSpacing: 0 },

  // Full-screen modal
  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  fullImg:     { width: W, height: H * 0.75 },
  closeBtn:    { position: 'absolute', top: 56, right: S.md, width: 40, height: 40, borderRadius: R.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:{ fontSize: 16, color: '#fff', fontWeight: '700' },

  // Skeleton
  skeleton:    { width: '100%', height: 140, borderRadius: R.md, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center', gap: S.sm },
  skeletonText:{ ...T.caption, color: C.textMuted, fontWeight: '400', textTransform: undefined, letterSpacing: 0 },

  // Failed
  failBox:     { width: '100%', height: 72, borderRadius: R.md, borderWidth: 1.5, borderColor: C.errorBorder, backgroundColor: C.errorLight, alignItems: 'center', justifyContent: 'center', gap: 4 },
  failIcon:    { fontSize: 18, color: C.error },
  failText:    { ...T.caption, color: C.error, fontWeight: '500', textTransform: undefined, letterSpacing: 0 },
});
