// Same ambient declaration as apps/mobile/src/types/react-native-qrcode-styled.d.ts
// — the package ships no types of its own.
declare module "react-native-qrcode-styled" {
  import type { ComponentType } from "react";
  import type { ViewStyle } from "react-native";

  export interface QRCodeStyledProps {
    data: string;
    style?: ViewStyle;
    padding?: number;
    pieceSize?: number;
    color?: string;
    [key: string]: unknown;
  }

  const QRCodeStyled: ComponentType<QRCodeStyledProps>;
  export default QRCodeStyled;
}
