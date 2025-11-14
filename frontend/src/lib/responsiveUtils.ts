import type { BlockStyle, ResponsiveStyle, ResponsiveConfig } from '../types';
import type { Breakpoint } from '../store/useResponsiveStore';
import { DEFAULT_SCALE_FACTORS } from '../store/useResponsiveStore';
function parseValue(value: string): { num: number; unit: string; parts?: number[] } | null {
  if (!value || typeof value !== 'string') return null;
  
  if (value.includes(' ')) {
    const parts = value.split(' ').map((v) => {
      const match = v.match(/^([\d.]+)(.*)$/);
      return match ? { num: parseFloat(match[1]), unit: match[2] || 'px' } : null;
    }).filter(Boolean) as { num: number; unit: string }[];
    if (parts.length > 0) {
      return {
        num: parts[0].num,
        unit: parts[0].unit,
        parts: parts.map((p) => p.num),
      };
    }
  }
  
  const match = value.match(/^([\d.]+)(.*)$/);
  if (match) {
    return {
      num: parseFloat(match[1]),
      unit: match[2] || 'px',
    };
  }
  
  return null;
}

function scaleValue(value: string, factor: number): string {
  const parsed = parseValue(value);
  if (!parsed) return value;
  
  if (parsed.parts) {
    return parsed.parts.map((num) => `${Math.round(num * factor)}${parsed.unit}`).join(' ');
  }
  
  const scaled = Math.round(parsed.num * factor);
  return `${scaled}${parsed.unit}`;
}

export function generateResponsiveStyles(
  desktopStyle: BlockStyle,
  scaleFactors: { tablet: number; mobile: number } = DEFAULT_SCALE_FACTORS
): ResponsiveConfig {
  const responsive: ResponsiveConfig = {};
  
  const scalableProps = ['fontSize', 'padding', 'margin', 'borderRadius'] as const;
  
  const tabletStyle: ResponsiveStyle = {};
  scalableProps.forEach((prop) => {
    const value = desktopStyle[prop];
    if (value) {
      tabletStyle[prop] = scaleValue(value, scaleFactors.tablet);
    }
  });
  if (desktopStyle.textAlign) {
    tabletStyle.textAlign = desktopStyle.textAlign as 'left' | 'center' | 'right';
  }
  if (desktopStyle.width) {
    tabletStyle.width = desktopStyle.width;
  }
  if (Object.keys(tabletStyle).length > 0) {
    responsive.tablet = tabletStyle;
  }
  
  const mobileStyle: ResponsiveStyle = {};
  scalableProps.forEach((prop) => {
    const value = desktopStyle[prop];
    if (value) {
      mobileStyle[prop] = scaleValue(value, scaleFactors.mobile);
    }
  });
  if (desktopStyle.textAlign) {
    mobileStyle.textAlign = desktopStyle.textAlign as 'left' | 'center' | 'right';
  }
  if (desktopStyle.width) {
    mobileStyle.width = desktopStyle.width;
  }
  if (Object.keys(mobileStyle).length > 0) {
    responsive.mobile = mobileStyle;
  }
  
  return responsive;
}

export function getStyleForBreakpoint(
  blockStyle: BlockStyle,
  breakpoint: Breakpoint
): Partial<BlockStyle> {
  if (breakpoint === 'desktop') {
    return blockStyle;
  }
  
  const responsive = blockStyle.responsive?.[breakpoint];
  if (!responsive) {
    return {};
  }
  return responsive;
}

export function isDifferentFromDesktop(
  blockStyle: BlockStyle,
  breakpoint: Breakpoint,
  property: keyof ResponsiveStyle
): boolean {
  if (breakpoint === 'desktop') return false;
  
  const responsiveValue = blockStyle.responsive?.[breakpoint]?.[property];
  const desktopValue = blockStyle[property];
  
  return responsiveValue !== undefined && responsiveValue !== desktopValue;
}

export function migrateBlockToResponsive(
  block: { style: BlockStyle },
  scaleFactors: { tablet: number; mobile: number } = DEFAULT_SCALE_FACTORS
): { style: BlockStyle } {
  if (block.style.responsive) {
    return block;
  }
  
  const responsive = generateResponsiveStyles(block.style, scaleFactors);
  
  return {
    ...block,
    style: {
      ...block.style,
      responsive,
    },
  };
}

