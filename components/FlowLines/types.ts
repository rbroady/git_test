export type StrokeCap = "round" | "butt" | "square";

export type BlendMode = "normal" | "screen" | "lighten" | "overlay";

export interface GradientStop {
  position: number;
  color: string;
  opacity?: number;
}

export interface FlowLinesGlow {
  enabled: boolean;
  radius: number;
  intensity: number;
  color?: string;
}

export interface FlowLinesAnimation {
  enabled: boolean;
  speed: number;
  amp: number;
}

export interface FlowLinesProps {
  width?: number;
  height?: number;
  background?: string;
  lines?: number;
  strokeWidth?: number;
  strokeCap?: StrokeCap;
  strokeOpacity?: number;
  spacing?: number;
  curvature?: number;
  bend?: number;
  valleyX?: number;
  valleyY?: number;
  endLift?: number;
  leftMargin?: number;
  rightMargin?: number;
  topMargin?: number;
  bottomMargin?: number;
  jitter?: number;
  seed?: number;
  palette?: string[];
  gradient?: GradientStop[];
  goldIndex?: number;
  glow?: FlowLinesGlow;
  blendMode?: BlendMode;
  exportScale?: number;
  animate?: FlowLinesAnimation;
}

export interface FlowLinePath {
  d: string;
  stroke: string;
  strokeOpacity: number;
}

export interface NormalizedFlowLinesProps extends Required<FlowLinesProps> {
  palette: string[];
  gradient: GradientStop[];
  glow: FlowLinesGlow;
  animate: FlowLinesAnimation;
}
