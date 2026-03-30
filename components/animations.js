/**
 * animations.js — Professional sleek animation library
 * Uses react-native-reanimated v2/v3 entering/exiting presets
 */
import {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  SlideInRight,
  SlideOutLeft,
  LinearTransition,
} from 'react-native-reanimated';

// ─── Page Transitions ────────────────────────────────────────────────────────
export const PageEnter = SlideInRight.duration(280);
export const PageExit = SlideOutLeft.duration(220);
export const PageFadeIn = FadeIn.duration(280);
export const PageFadeOut = FadeOut.duration(200);

// ─── Modal Animations ─────────────────────────────────────────────────────────
export const ModalEnter = FadeInDown.duration(350).springify().damping(20);
export const ModalExit = FadeOutDown.duration(240);
export const ModalCenterEnter = FadeInUp.duration(320).springify().damping(20);

// ─── Content / Card Animations ───────────────────────────────────────────────
// Use .delay(index * 50) when rendering lists
export const CardEnter = FadeInDown.duration(320).springify().damping(18);
export const CardExit = FadeOut.duration(180);
export const HeroEnter = FadeInUp.duration(380).springify().damping(18);

// Result reveal (estimation result, delivery result)
export const ResultReveal = FadeInDown.duration(380).springify().damping(18);

// ─── Layout Transition ────────────────────────────────────────────────────────
export const SmoothLayout = LinearTransition.duration(260);
