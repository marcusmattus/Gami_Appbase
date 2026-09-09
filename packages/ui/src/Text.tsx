// The ONLY text primitive screens should use. Locks every render to exactly
// one of the three §2.2 fonts — there is no fourth variant, and no prop to
// escape it. `mono` is mandatory for every numeral (balances, XP, gas,
// addresses, hashes, dates, percentages) per §2.2's closing rule.
import { Text as RNText } from "react-native";
import type { TextProps as RNTextProps } from "react-native";
import { font, text as textColor } from "./tokens.js";

export type ArcadeTextVariant = "display" | "body" | "mono";

export interface ArcadeTextProps extends Omit<RNTextProps, "style"> {
  variant?: ArcadeTextVariant;
  color?: string;
  size?: number;
  style?: RNTextProps["style"];
}

const FONT_FAMILY: Record<ArcadeTextVariant, string> = {
  display: font.display,
  body: font.body,
  mono: font.mono,
};

const DEFAULT_SIZE: Record<ArcadeTextVariant, number> = {
  display: 22,
  body: 15,
  mono: 14,
};

export function ArcadeText({ variant = "body", color, size, style, ...rest }: ArcadeTextProps) {
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: FONT_FAMILY[variant],
          fontSize: size ?? DEFAULT_SIZE[variant],
          color: color ?? textColor.primary,
        },
        style,
      ]}
    />
  );
}
