// §2.2: zero radius, 2px borders, hard offset shadow (no blur), no
// opacity-based elevation. `onPressIn` collapses the shadow into the
// translate-and-shrink "pressed" look the design's `style-active` attribute
// specifies, without any animation library.
import { useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { ArcadeText } from "./Text.js";
import { color, borderWidth, shadowOffset, surface, radius } from "./tokens.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dashed" | "danger";

export interface ArcadeButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: ButtonVariant;
  badge?: string;
  /**
   * Layout-only positioning for the button itself (alignSelf, margin, flex).
   * `style` is intentionally not exposed — it would let callers override the
   * locked ARCADE chrome (border/shadow/radius) on a per-instance basis.
   */
  containerStyle?: StyleProp<ViewStyle>;
}

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: color.primary,
  secondary: surface.card,
  ghost: "transparent",
  dashed: "transparent",
  danger: "transparent",
};

const VARIANT_BORDER: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: "#FFFFFF",
  ghost: surface.border,
  dashed: surface.border,
  danger: color.danger,
};

const VARIANT_TEXT: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: "#FFFFFF",
  ghost: "rgba(255,255,255,0.7)",
  dashed: "rgba(255,255,255,0.6)",
  danger: color.danger,
};

export function ArcadeButton({ label, variant = "primary", badge, disabled, containerStyle, ...rest }: ArcadeButtonProps) {
  const [pressed, setPressed] = useState(false);
  const hasShadow = variant === "primary" || variant === "secondary";

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}
      style={[
        styles.base,
        containerStyle,
        {
          backgroundColor: VARIANT_BG[variant],
          borderColor: VARIANT_BORDER[variant],
          borderStyle: variant === "dashed" ? "dashed" : "solid",
          opacity: disabled ? 0.5 : 1,
        },
        hasShadow && {
          shadowColor: color.primary,
          transform: pressed
            ? [{ translateX: shadowOffset / 2 }, { translateY: shadowOffset / 2 }]
            : [{ translateX: 0 }, { translateY: 0 }],
          // Hard offset "shadow" via a duplicated background box is handled
          // by BoxShadow below on native; on web this borderBottom/Right pair
          // approximates it without blur.
        },
      ]}
    >
      {hasShadow && !pressed && (
        <BoxShadowLayer offset={shadowOffset} shadowColor={variant === "primary" ? "#9C6CFF" : "#000000"} />
      )}
      <ArcadeText variant="display" size={13} color={VARIANT_TEXT[variant]} style={styles.label}>
        {label}
      </ArcadeText>
      {badge && (
        <ArcadeText variant="mono" size={9} color="#000000" style={styles.badge}>
          {badge}
        </ArcadeText>
      )}
    </Pressable>
  );
}

/** Zero-blur "hard offset" shadow: a solid rectangle behind the button, offset down-right. §2.2. */
function BoxShadowLayer({ offset, shadowColor }: { offset: number; shadowColor: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: offset,
        left: offset,
        right: -offset,
        bottom: -offset,
        backgroundColor: shadowColor,
        zIndex: -1,
        borderRadius: radius,
      }}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    position: "relative",
    borderWidth,
    borderRadius: radius,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  badge: {
    position: "absolute",
    top: -9,
    right: 10,
    backgroundColor: "#00E5A0",
    borderWidth,
    borderColor: "#000000",
    borderRadius: radius,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
});
