import React, { forwardRef } from "react";
import { FlowLinesProps } from "./types";
import {
  FLOWLINES_DEFAULTS,
  buildFlowLinePathsFromNormalized,
  normalizeFlowLinesProps,
} from "./utils";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const FlowLines = forwardRef<SVGSVGElement, FlowLinesProps>((props, ref) => {
  const normalized = normalizeFlowLinesProps(props);
  const paths = buildFlowLinePathsFromNormalized(normalized);
  const glowId = `flow-lines-glow-${Math.abs(Math.round(normalized.seed * 1000))}-${Math.round(normalized.width)}`;
  const animationDash = normalized.animate.enabled
    ? Math.max(normalized.width * normalized.animate.amp * 0.8, normalized.width * 0.2)
    : undefined;
  const animationDuration = normalized.animate.enabled
    ? Math.max(1, 8 - normalized.animate.speed * 6)
    : undefined;

  return (
    <svg
      ref={ref}
      width={normalized.width}
      height={normalized.height}
      viewBox={`0 0 ${normalized.width} ${normalized.height}`}
      role="img"
      aria-label="Flowing lines graphic"
      style={{ display: "block" }}
    >
      <defs>
        {normalized.glow.enabled && (
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={normalized.glow.radius} result="blur" />
            <feFlood
              floodColor={normalized.glow.color}
              floodOpacity={clamp(normalized.glow.intensity, 0, 2)}
              result="color"
            />
            <feComposite in="color" in2="blur" operator="in" result="glowColor" />
            <feMerge>
              <feMergeNode in="glowColor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <rect width="100%" height="100%" fill={normalized.background} />
      <g
        filter={normalized.glow.enabled ? `url(#${glowId})` : undefined}
        style={{ mixBlendMode: normalized.blendMode, willChange: normalized.animate.enabled ? "stroke-dashoffset" : undefined }}
        strokeWidth={normalized.strokeWidth}
        strokeLinecap={normalized.strokeCap}
        fill="none"
        shapeRendering="geometricPrecision"
      >
        {paths.map((path, idx) => (
          <path
            key={`flow-line-${idx}`}
            d={path.d}
            stroke={path.stroke}
            strokeOpacity={path.strokeOpacity}
            vectorEffect="non-scaling-stroke"
            strokeDasharray={animationDash}
          >
            {normalized.animate.enabled && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to={String(animationDash ?? 1)}
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
              />
            )}
          </path>
        ))}
      </g>
    </svg>
  );
});

FlowLines.displayName = "FlowLines";

export { FlowLines, FLOWLINES_DEFAULTS };
