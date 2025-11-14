import type { Block, GridBlock, GridCell, Theme } from '../../types';
import { theme } from '../../styles/theme';

/**
 * Вычисляет глубину контейнера в дереве блоков
 */
export const computeContainerDepth = (
  blocks: Block[],
  targetId: string,
  depth: number = 0
): number => {
  for (const b of blocks) {
    if (b.id === targetId && b.type === 'container') return depth + 1;
    if (b.type === 'container') {
      const children = (b as any).children as Block[];
      const d = computeContainerDepth(children, targetId, depth + 1);
      if (d > 0) return d;
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      for (const cell of gb.cells) {
        if (cell.block) {
          const inner = cell.block;
          const d = computeContainerDepth(
            [inner],
            targetId,
            depth + (inner.type === 'container' ? 1 : 0)
          );
          if (d > 0) return d;
        }
      }
    }
  }
  return 0;
};

/**
 * Глубокое клонирование блока с новыми ID
 */
export const cloneBlockDeep = (
  block: Block,
  makeId: (idx?: number) => string,
  idxHint?: number,
  currentTheme?: Theme
): Block => {
  const initialStyle = (block as any).style ?? {
    margin: '10px 0',
    padding: '10px',
    width: '100%',
  };
  const base = { ...(block as any), id: makeId(idxHint), style: initialStyle } as Block;
  const applyStyle = (s: any) => {
    if (!currentTheme) return s;
    const next = { ...s };
    if (next?.color === theme.colors.textPrimary || next?.color === theme.colors.textSecondary || next?.color === theme.colors.textMuted) {
      next.color = currentTheme.text;
    }
    if (next?.backgroundColor === theme.colors.surface || next?.backgroundColor === theme.colors.surfaceAlt || next?.backgroundColor === theme.colors.surfaceMuted || next?.backgroundColor === theme.colors.highlightBlue || next?.backgroundColor === theme.colors.highlightGreen) {
      next.backgroundColor = currentTheme.surface;
    }
    return next;
  };
  
  if (block.type === 'container') {
    const children = ((block as any).children as Block[]).map((child, i) =>
      cloneBlockDeep(child, makeId, i, currentTheme)
    );
    const styled = applyStyle((base as any).style);
    return { ...(base as any), style: styled, children } as Block;
  }
  
  if (block.type === 'grid') {
    const gb = block as GridBlock;
    const cells = gb.cells.map((cell, i) => {
      if (!cell.block) return { ...cell } as GridCell;
      return {
        ...cell,
        block: cloneBlockDeep(cell.block, makeId, i, currentTheme),
      } as GridCell;
    });
    const settings = { ...gb.settings };
    if (currentTheme && settings.cellBorderColor === theme.colors.border) {
      settings.cellBorderColor = currentTheme.border;
    }
    const styled = applyStyle((base as any).style);
    return { ...(base as any), style: styled, settings, cells } as Block;
  }
  
  if (block.type === 'button' && currentTheme) {
    const btn = base as any;
    const originalColor = (block as any).buttonColor;
    const normalizedColor = originalColor === theme.colors.primary ? currentTheme.accent : originalColor;
    const styled = applyStyle(btn.style);
    return { ...btn, style: styled, buttonColor: normalizedColor } as Block;
  }
  
  const styled = applyStyle((base as any).style);
  if (styled !== (base as any).style) {
    return { ...(base as any), style: styled } as Block;
  }
  return base;
};

/**
 * Создает функцию для генерации уникальных ID
 */
export const createIdGenerator = (timestamp: number) => {
  return (idx?: number) =>
    `block-${timestamp}-${idx ?? 0}-${Math.random().toString(36).substr(2, 9)}`;
};




