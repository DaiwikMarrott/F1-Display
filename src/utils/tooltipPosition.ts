export interface TooltipPosition {
  left: number;
  top: number;
}

export function getTooltipPosition(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  tooltipWidth = 220,
  tooltipHeight = 180,
  margin = 12,
): TooltipPosition {
  const preferredLeft = x + 16;
  const preferredTop = y - 12;
  const left = preferredLeft + tooltipWidth + margin <= viewportWidth
    ? preferredLeft
    : x - tooltipWidth - 16;
  const top = Math.min(
    Math.max(margin, preferredTop),
    Math.max(margin, viewportHeight - tooltipHeight - margin),
  );

  return {
    left: Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin)),
    top,
  };
}
