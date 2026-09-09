// §2.2 input chrome: matches ArcadeCard's flat surface + neutral border —
// zero radius, no gradient/blur, no soft focus glow.
import { useState } from "react";
import { TextInput, StyleSheet } from "react-native";
import type { TextInputProps } from "react-native";
import { font, surface, text as textColor, color, borderWidth, radius } from "./tokens.js";

export interface ArcadeInputProps extends TextInputProps {
  /** Use the mono font — required by §2.2 for numeric/address entry. */
  mono?: boolean;
}

export function ArcadeInput({ mono, style, onFocus, onBlur, ...rest }: ArcadeInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={textColor.muted}
      style={[
        styles.base,
        { fontFamily: mono ? font.mono : font.body, borderColor: focused ? color.primary : surface.border },
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth,
    borderRadius: radius,
    backgroundColor: surface.card,
    color: textColor.primary,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
