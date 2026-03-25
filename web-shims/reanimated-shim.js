/**
 * Web shim for react-native-reanimated v4
 * Provides React Native Web-compatible stubs so the app loads in browsers.
 */
const React = require('react');
const { View, Text, ScrollView, FlatList, Image, TouchableOpacity } = require('react-native');

// ── Animation stubs ──────────────────────────────────────────────────────────
function noop() {}
function identity(x) { return x; }
function passthrough(fn) { return fn; }

// Shared value stub
function useSharedValue(init) {
  const ref = React.useRef(init);
  const sv = React.useRef({
    value: init,
    get: () => ref.current,
  });
  return sv.current;
}

// Animated style stub - just returns a plain style object
function useAnimatedStyle(fn) {
  try { return fn(); } catch { return {}; }
}

// Animation builders - return no-op descriptors
function withTiming(value) { return value; }
function withSpring(value) { return value; }
function withDelay(_, anim) { return anim; }
function withSequence(...anims) { return anims[anims.length - 1]; }
function withRepeat(anim) { return anim; }
function withDecay() { return 0; }
function cancelAnimation() {}
function runOnJS(fn) { return fn; }
function runOnUI(fn) { return fn; }
function useAnimatedReaction() {}
function useAnimatedScrollHandler() { return {}; }
function useAnimatedGestureHandler() { return {}; }
function useDerivedValue(fn) { try { return { value: fn() }; } catch { return { value: undefined }; } }
function interpolate(value, inputRange, outputRange) {
  if (!inputRange || !outputRange || inputRange.length < 2) return outputRange ? outputRange[0] : 0;
  const idx = inputRange.findIndex((v) => value <= v);
  if (idx <= 0) return outputRange[0];
  if (idx >= inputRange.length) return outputRange[outputRange.length - 1];
  const ratio = (value - inputRange[idx - 1]) / (inputRange[idx] - inputRange[idx - 1]);
  return outputRange[idx - 1] + ratio * (outputRange[idx] - outputRange[idx - 1]);
}
function interpolateColor() { return 'transparent'; }
function useWorkletCallback(fn) { return fn; }

// Easing stubs
const Easing = {
  linear: identity, ease: identity, quad: identity, cubic: identity,
  sin: identity, circle: identity, exp: identity, elastic: identity,
  back: () => identity, bounce: identity, bezier: () => identity,
  bezierFn: () => identity, steps: () => identity,
  in: passthrough, out: passthrough, inOut: passthrough,
};

// Layout animation stubs
function NoLayoutAnim() { return null; }
NoLayoutAnim.duration = () => NoLayoutAnim;
NoLayoutAnim.delay = () => NoLayoutAnim;
NoLayoutAnim.springify = () => NoLayoutAnim;
NoLayoutAnim.damping = () => NoLayoutAnim;
NoLayoutAnim.mass = () => NoLayoutAnim;
NoLayoutAnim.stiffness = () => NoLayoutAnim;
NoLayoutAnim.overshootClamping = () => NoLayoutAnim;
NoLayoutAnim.restDisplacementThreshold = () => NoLayoutAnim;
NoLayoutAnim.restSpeedThreshold = () => NoLayoutAnim;

// Keyframe stub
class Keyframe {
  constructor() {}
  duration() { return this; }
  delay() { return this; }
}

// ── Animated components ──────────────────────────────────────────────────────
/**
 * Creates a pass-through wrapper that strips Reanimated-specific props
 * and renders the base component with plain style.
 */
function makeAnimated(BaseComponent) {
  return React.forwardRef(function AnimatedWrapper(
    { entering, exiting, layout, style, animatedProps, ...rest },
    ref
  ) {
    let mergedStyle = style;
    if (animatedProps?.style) {
      mergedStyle = [style, animatedProps.style];
    }
    return React.createElement(BaseComponent, { ...rest, style: mergedStyle, ref });
  });
}

const AnimatedView = makeAnimated(View);
const AnimatedText = makeAnimated(Text);
const AnimatedScrollView = makeAnimated(ScrollView);
const AnimatedFlatList = makeAnimated(FlatList);
const AnimatedImage = makeAnimated(Image);
const AnimatedTouchableOpacity = makeAnimated(TouchableOpacity);

// The default export is the Animated namespace
const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  Image: AnimatedImage,
  TouchableOpacity: AnimatedTouchableOpacity,
  createAnimatedComponent: makeAnimated,
  // Hooks
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useDerivedValue,
  useWorkletCallback,
  // Animations
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  withDecay,
  cancelAnimation,
  // Utils
  runOnJS,
  runOnUI,
  interpolate,
  interpolateColor,
  Easing,
};

module.exports = Animated;
module.exports.default = Animated;

// Named exports (used via `import { FadeIn, ... } from 'react-native-reanimated'`)
module.exports.useSharedValue = useSharedValue;
module.exports.useAnimatedStyle = useAnimatedStyle;
module.exports.useAnimatedReaction = useAnimatedReaction;
module.exports.useAnimatedScrollHandler = useAnimatedScrollHandler;
module.exports.useAnimatedGestureHandler = useAnimatedGestureHandler;
module.exports.useDerivedValue = useDerivedValue;
module.exports.useWorkletCallback = useWorkletCallback;
module.exports.withTiming = withTiming;
module.exports.withSpring = withSpring;
module.exports.withDelay = withDelay;
module.exports.withSequence = withSequence;
module.exports.withRepeat = withRepeat;
module.exports.withDecay = withDecay;
module.exports.cancelAnimation = cancelAnimation;
module.exports.runOnJS = runOnJS;
module.exports.runOnUI = runOnUI;
module.exports.interpolate = interpolate;
module.exports.interpolateColor = interpolateColor;
module.exports.Easing = Easing;
module.exports.Keyframe = Keyframe;

// Layout animations (FadeIn, FadeOut, SlideIn, etc.)
module.exports.FadeIn = NoLayoutAnim;
module.exports.FadeInDown = NoLayoutAnim;
module.exports.FadeInUp = NoLayoutAnim;
module.exports.FadeInLeft = NoLayoutAnim;
module.exports.FadeInRight = NoLayoutAnim;
module.exports.FadeOut = NoLayoutAnim;
module.exports.FadeOutDown = NoLayoutAnim;
module.exports.FadeOutUp = NoLayoutAnim;
module.exports.FadeOutLeft = NoLayoutAnim;
module.exports.FadeOutRight = NoLayoutAnim;
module.exports.SlideInRight = NoLayoutAnim;
module.exports.SlideInLeft = NoLayoutAnim;
module.exports.SlideInUp = NoLayoutAnim;
module.exports.SlideInDown = NoLayoutAnim;
module.exports.SlideOutRight = NoLayoutAnim;
module.exports.SlideOutLeft = NoLayoutAnim;
module.exports.SlideOutUp = NoLayoutAnim;
module.exports.SlideOutDown = NoLayoutAnim;
module.exports.ZoomIn = NoLayoutAnim;
module.exports.ZoomOut = NoLayoutAnim;
module.exports.BounceIn = NoLayoutAnim;
module.exports.BounceOut = NoLayoutAnim;
module.exports.FlipInXDown = NoLayoutAnim;
module.exports.FlipInYLeft = NoLayoutAnim;
module.exports.Layout = NoLayoutAnim;
module.exports.LinearTransition = NoLayoutAnim;
module.exports.CurvedTransition = NoLayoutAnim;
module.exports.JumpingTransition = NoLayoutAnim;
module.exports.EntryExitTransition = NoLayoutAnim;
module.exports.SequencedTransition = NoLayoutAnim;

// Animated components
module.exports.createAnimatedComponent = makeAnimated;
