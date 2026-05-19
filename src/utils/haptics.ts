import * as Haptics from 'expo-haptics';

// Wrapper fire-and-forget. Em emulador ou Web a API pode rejeitar — silenciamos
// para que call sites nao precisem se preocupar com try/catch.
function safe(p: Promise<unknown> | undefined) {
  p?.catch?.(() => {});
}

export const haptic = {
  light: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => safe(Haptics.selectionAsync()),
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
