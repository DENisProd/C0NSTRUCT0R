import type { Block, GridBlock, GridCell } from '../../types';
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
  currentAccent?: string
): Block => {
  const base = { ...block, id: makeId(idxHint) } as Block;
  
  if (block.type === 'container') {
    const children = ((block as any).children as Block[]).map((child, i) =>
      cloneBlockDeep(child, makeId, i, currentAccent)
    );
    return { ...(base as any), children } as Block;
  }
  
  if (block.type === 'grid') {
    const gb = block as GridBlock;
    const cells = gb.cells.map((cell, i) => {
      if (!cell.block) return { ...cell } as GridCell;
      return {
        ...cell,
        block: cloneBlockDeep(cell.block, makeId, i, currentAccent),
      } as GridCell;
    });
    return {
      ...(base as any),
      settings: { ...gb.settings },
      cells,
    } as Block;
  }
  
  // Нормализуем цвет кнопок из шаблонов: primary -> текущий accent
  if (block.type === 'button' && currentAccent) {
    const btn = base as any;
    const originalColor = (block as any).buttonColor;
    const normalizedColor =
      originalColor === theme.colors.primary ? currentAccent : originalColor;
    return { ...btn, buttonColor: normalizedColor } as Block;
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



