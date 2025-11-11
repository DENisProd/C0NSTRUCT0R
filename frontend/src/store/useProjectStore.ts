import { create } from 'zustand';
import type { Project, Block, BlockType, TextBlock, ImageBlock, ButtonBlock, VideoBlock, GridBlock, GridCell, Theme } from '../types';
import { theme } from '../styles/theme';
import { generateResponsiveStyles, migrateBlockToResponsive } from '../lib/responsiveUtils';
import { DEFAULT_SCALE_FACTORS } from './useResponsiveStore';

const STORAGE_KEY = 'landing-constructor-project';

// Вспомогательная функция для добавления responsive стилей к блоку
function addResponsiveToBlock(block: Block): Block {
  if (!block.style.responsive) {
    const responsive = generateResponsiveStyles(block.style, DEFAULT_SCALE_FACTORS);
    return {
      ...block,
      style: {
        ...block.style,
        responsive,
      },
    };
  }
  return block;
}

// Рекурсивная миграция всех блоков в проекте
function migrateProjectBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const migrated = migrateBlockToResponsive(block, DEFAULT_SCALE_FACTORS);
    
    // Рекурсивно мигрируем вложенные блоки
    if (block.type === 'container') {
      const children = (block as any).children as Block[];
      return {
        ...migrated,
        children: migrateProjectBlocks(children),
      } as Block;
    }
    
    if (block.type === 'grid') {
      const gb = block as GridBlock;
      const cells = gb.cells.map((cell) => {
        if (!cell.block) return cell;
        // Рекурсивно мигрируем блок в ячейке (может быть контейнером с вложенными блоками)
        const migratedBlocks = migrateProjectBlocks([cell.block]);
        const migratedCellBlock = migratedBlocks[0] || cell.block;
        return {
          ...cell,
          block: migratedCellBlock,
        };
      });
      return {
        ...migrated,
        cells,
      } as Block;
    }
    
    return migrated;
  });
}

const defaultProject: Project = {
  projectName: 'Новый лендинг',
  header: {
    logoUrl: '',
    companyName: 'Моя компания',
    backgroundColor: '#ffffff',
    textColor: '#000000',
  },
  blocks: [],
  footer: {
    text: '© 2025 My Landing',
    backgroundColor: '#f5f5f5',
    textColor: '#000000',
  },
  theme: {
    mode: 'light',
    accent: '#007bff',
    text: '#000000',
    heading: '#000000',
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#e0e0e0',
  },
};

type UpdatePayload =
  | Partial<TextBlock>
  | Partial<ImageBlock>
  | Partial<ButtonBlock>
  | Partial<VideoBlock>
  | Partial<Block>;

  interface ProjectStore {
    project: Project;
    selectedBlockId: string | null;
    isPreviewMode: boolean;
  
    // Actions
    setProject: (project: Project) => void;
    addBlock: (type: BlockType) => void;
    addGrid: (columns: number, rows: number) => void;
    addBlockToContainer: (containerId: string, index: number, type: BlockType) => void;
    addBlockToGridCell: (gridId: string, cellIndex: number, type: BlockType) => void;
    moveGridItem: (gridId: string, fromCellIndex: number, toCellIndex: number) => void;
    updateGridSettings: (gridId: string, updates: Partial<GridBlock['settings']>) => void;
    updateGridCellAlign: (gridId: string, cellIndex: number, updates: { align?: GridCell['align']; justify?: GridCell['justify'] }) => void;
    addTemplateBlocks: (blocks: Block[]) => void; // Добавление готового блока (в корень)
    addTemplateBlocksAt: (index: number, blocks: Block[]) => void; // Добавление готового блока по индексу (в корень)
    addTemplateToContainer: (containerId: string, index: number, blocks: Block[]) => void; // Вставка шаблонов внутрь контейнера
    addTemplateToGridCell: (gridId: string, cellIndex: number, blocks: Block[]) => void; // Вставка шаблонов в ячейку сетки
    updateBlock: (id: string, updates: UpdatePayload) => void;
    deleteBlock: (id: string) => void;
    moveBlock: (fromIndex: number, toIndex: number) => void;
    selectBlock: (id: string | null) => void;
    updateHeader: (updates: Partial<Project['header']>) => void;
  updateFooter: (updates: Partial<Project['footer']>) => void;
  updateTheme: (updates: Partial<Theme>) => void;
  clearProject: () => void;
  setPreviewMode: (isPreview: boolean) => void;
  
  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: defaultProject,
  selectedBlockId: null,
  isPreviewMode: false,

  setProject: (project) => set({ project }),

  addBlock: (type) => {
    const createNewBlock = (t: BlockType): Block => {
      const baseBlock = {
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: {
          margin: '10px 0',
          padding: '10px',
          width: '100%',
        },
      };

      switch (t) {
        case 'text':
          return {
            ...baseBlock,
            type: 'text',
            content: 'Новый текстовый блок',
            style: {
              ...baseBlock.style,
              color: '#000000',
              fontSize: '16px',
              textAlign: 'left',
            },
          } as Block;
        case 'image':
          return {
            ...baseBlock,
            type: 'image',
            url: '',
            style: {
              ...baseBlock.style,
              width: '100%',
            },
          } as Block;
        case 'button':
          return {
            ...baseBlock,
            type: 'button',
            text: 'Кнопка',
            link: '#',
            buttonColor: get().project.theme.accent,
            style: {
              ...baseBlock.style,
              textAlign: 'center',
            },
          } as Block;
        case 'video':
          return {
            ...baseBlock,
            type: 'video',
            url: '',
            style: {
              ...baseBlock.style,
              width: '100%',
            },
          } as Block;
        case 'container':
          return {
            ...baseBlock,
            type: 'container',
            style: {
              ...baseBlock.style,
              padding: '20px',
              backgroundColor: '#fafafa',
            },
            children: [],
          } as Block;
        case 'grid':
          return {
            ...baseBlock,
            type: 'grid',
            style: {
              ...baseBlock.style,
              padding: '10px',
            },
            settings: {
              columns: 2,
              rows: 2,
              gapX: 12,
              gapY: 12,
              align: 'stretch',
              justify: 'start',
              placementType: 'fraction',
              showCellBorders: false,
              cellBorderColor: '#e0e0e0',
              cellBorderWidth: 1,
            },
            cells: Array.from({ length: 4 }, () => ({ block: null })),
          } as Block;
      }
    };

    const newBlock = addResponsiveToBlock(createNewBlock(type));

    set((state) => ({
      project: {
        ...state.project,
        blocks: [...state.project.blocks, newBlock],
      },
      selectedBlockId: newBlock.id,
    }));
  },

  addGrid: (columns, rows) => {
    const baseBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      style: {
        margin: '10px 0',
        padding: '10px',
        width: '100%',
      },
    };
    const grid: GridBlock = {
      ...baseBlock,
      type: 'grid',
      settings: {
        columns,
        rows,
        gapX: 12,
        gapY: 12,
        align: 'stretch',
        justify: 'start',
        placementType: 'fraction',
        showCellBorders: false,
        cellBorderColor: '#e0e0e0',
        cellBorderWidth: 1,
      },
      cells: Array.from({ length: columns * rows }, () => ({ block: null })),
    };
    const migratedGrid = addResponsiveToBlock(grid);
    set((state) => ({
      project: { ...state.project, blocks: [...state.project.blocks, migratedGrid] },
      selectedBlockId: migratedGrid.id,
    }));
  },

  addBlockToContainer: (containerId, index, type) => {
    // Добавляем новый базовый блок внутрь контейнера (поддержка вложенности)
    const createNewBlock = (t: BlockType): Block => {
      const baseBlock = {
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: {
          margin: '10px 0',
          padding: '10px',
          width: '100%',
        },
      };
      switch (t) {
        case 'text':
          return { ...baseBlock, type: 'text', content: 'Новый текстовый блок', style: { ...baseBlock.style, color: '#000000', fontSize: '16px', textAlign: 'left' } } as Block;
        case 'image':
          return { ...baseBlock, type: 'image', url: '', style: { ...baseBlock.style, width: '100%' } } as Block;
        case 'button':
          return { ...baseBlock, type: 'button', text: 'Кнопка', link: '#', buttonColor: get().project.theme.accent, style: { ...baseBlock.style, textAlign: 'center' } } as Block;
        case 'video':
          return { ...baseBlock, type: 'video', url: '', style: { ...baseBlock.style, width: '100%' } } as Block;
        case 'container':
          return { ...baseBlock, type: 'container', children: [], style: { ...baseBlock.style, padding: '20px', backgroundColor: '#fafafa' } } as Block;
        case 'grid':
          return {
            ...baseBlock,
            type: 'grid',
            settings: {
              columns: 2,
              rows: 2,
              gapX: 12,
              gapY: 12,
              align: 'stretch',
              justify: 'start',
              placementType: 'fraction',
              showCellBorders: false,
              cellBorderColor: '#e0e0e0',
              cellBorderWidth: 1,
            },
            cells: Array.from({ length: 4 }, () => ({ block: null })),
          } as Block;
        default:
          return { ...baseBlock, type: 'text', content: 'Новый текстовый блок', style: { ...baseBlock.style } } as Block;
      }
    };

    const newChild = addResponsiveToBlock(createNewBlock(type));

    // Вычисляем глубину целевого контейнера (количество уровней контейнеров от корня до него)
    const computeContainerDepth = (blocks: Block[], targetId: string, depth: number = 0): number => {
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
              const d = computeContainerDepth([inner], targetId, depth + (inner.type === 'container' ? 1 : 0));
              if (d > 0) return d;
            }
          }
        }
      }
      return 0;
    };

    // Ограничение: максимум 4 уровня вложенности контейнеров
    if (newChild.type === 'container') {
      const currentDepth = computeContainerDepth(get().project.blocks, containerId);
      if (currentDepth >= 4) {
        return; // превышение лимита — не добавляем
      }
    }

    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function insertIntoContainer(b: Block): Block {
          if (b.id === containerId && b.type === 'container') {
            const children = [...((b as any).children as Block[])];
            const safeIndex = Math.max(0, Math.min(index, children.length));
            children.splice(safeIndex, 0, newChild);
            return { ...(b as any), children } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(insertIntoContainer);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = insertIntoContainer(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
      selectedBlockId: newChild.id,
    }));
  },

  addBlockToGridCell: (gridId, cellIndex, type) => {
    const createNewBlock = (t: BlockType): Block => {
      const baseBlock = {
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        style: {
          margin: '10px 0',
          padding: '10px',
          width: '100%',
        },
      };
      switch (t) {
        case 'text':
          return { ...baseBlock, type: 'text', content: 'Новый текстовый блок', style: { ...baseBlock.style, color: '#000000', fontSize: '16px', textAlign: 'left' } } as Block;
        case 'image':
          return { ...baseBlock, type: 'image', url: '', style: { ...baseBlock.style, width: '100%' } } as Block;
        case 'button':
          return { ...baseBlock, type: 'button', text: 'Кнопка', link: '#', buttonColor: get().project.theme.accent, style: { ...baseBlock.style, textAlign: 'center' } } as Block;
        case 'video':
          return { ...baseBlock, type: 'video', url: '', style: { ...baseBlock.style, width: '100%' } } as Block;
        case 'container':
          return { ...baseBlock, type: 'container', children: [], style: { ...baseBlock.style, padding: '20px', backgroundColor: '#fafafa' } } as Block;
        case 'grid':
          return {
            ...baseBlock,
            type: 'grid',
            settings: {
              columns: 2,
              rows: 2,
              gapX: 12,
              gapY: 12,
              align: 'stretch',
              justify: 'start',
              placementType: 'fraction',
              showCellBorders: false,
              cellBorderColor: '#e0e0e0',
              cellBorderWidth: 1,
            },
            cells: Array.from({ length: 4 }, () => ({ block: null })),
          } as Block;
      }
    };

    const newChild = addResponsiveToBlock(createNewBlock(type));

    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function insertIntoGrid(b: Block): Block {
          if (b.id === gridId && b.type === 'grid') {
            const gb = b as GridBlock;
            const cells = [...gb.cells];
            const idx = Math.max(0, Math.min(cellIndex, cells.length - 1));
            const existing = cells[idx] || { block: null };
            cells[idx] = { ...existing, block: newChild } as GridCell;
            return { ...gb, cells } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(insertIntoGrid);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = insertIntoGrid(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
      selectedBlockId: newChild.id,
    }));
  },

  moveGridItem: (gridId, fromCellIndex, toCellIndex) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function moveInGrid(b: Block): Block {
          if (b.id === gridId && b.type === 'grid') {
            const gb = b as GridBlock;
            const cells = [...gb.cells];
            const from = Math.max(0, Math.min(fromCellIndex, cells.length - 1));
            const to = Math.max(0, Math.min(toCellIndex, cells.length - 1));
            const moving = cells[from]?.block || null;
            cells[from] = { ...(cells[from] || {}), block: null } as GridCell;
            cells[to] = { ...(cells[to] || {}), block: moving } as GridCell;
            return { ...gb, cells } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(moveInGrid);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = moveInGrid(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
    }));
  },

  updateGridSettings: (gridId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function updateGrid(b: Block): Block {
          if (b.id === gridId && b.type === 'grid') {
            const gb = b as GridBlock;
            const newSettings = { ...gb.settings, ...updates };
            const newCellsCount = newSettings.columns * newSettings.rows;
            let newCells = gb.cells;
            if (newCellsCount !== gb.cells.length) {
              newCells = Array.from({ length: newCellsCount }, (_, i) => gb.cells[i] ?? { block: null } as GridCell);
            }
            return { ...gb, settings: newSettings, cells: newCells } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(updateGrid);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = updateGrid(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
    }));
  },

  updateGridCellAlign: (gridId, cellIndex, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function updateCell(b: Block): Block {
          if (b.id === gridId && b.type === 'grid') {
            const gb = b as GridBlock;
            const cells = [...gb.cells];
            const idx = Math.max(0, Math.min(cellIndex, cells.length - 1));
            const existing = cells[idx] || { block: null };
            cells[idx] = { ...existing, ...updates } as GridCell;
            return { ...gb, cells } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(updateCell);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = updateCell(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
    }));
  },

  addTemplateBlocks: (templateBlocks) => {
    // Глубокое копирование блоков шаблона с уникальными ID
    const timestamp = Date.now();
    const makeId = (idx?: number) => `block-${timestamp}-${idx ?? 0}-${Math.random().toString(36).substr(2, 9)}`;

    const cloneDeep = (block: Block, idxHint?: number): Block => {
      const base = { ...block, id: makeId(idxHint) } as Block;
      if (block.type === 'container') {
        const children = ((block as any).children as Block[]).map((child, i) => cloneDeep(child, i));
        return { ...(base as any), children } as Block;
      }
      if (block.type === 'grid') {
        const gb = block as GridBlock;
        const cells = gb.cells.map((cell, i) => {
          if (!cell.block) return { ...cell } as GridCell;
          return { ...cell, block: cloneDeep(cell.block, i) } as GridCell;
        });
        return { ...(base as any), settings: { ...gb.settings }, cells } as Block;
      }
      // нормализуем цвет кнопок из шаблонов: primary -> текущий accent
      if (block.type === 'button') {
        const currentAccent = get().project.theme.accent;
        const btn = base as any;
        const originalColor = (block as any).buttonColor;
        const normalizedColor = originalColor === theme.colors.primary ? currentAccent : originalColor;
        return { ...btn, buttonColor: normalizedColor } as Block;
      }
      return base;
    };

    const newBlocks: Block[] = templateBlocks.map((b, i) => addResponsiveToBlock(cloneDeep(b, i)));

    set((state) => ({
      project: {
        ...state.project,
        blocks: [...state.project.blocks, ...newBlocks],
      },
      selectedBlockId: newBlocks[0]?.id || null,
    }));

    get().saveToLocalStorage();
  },

  addTemplateBlocksAt: (insertIndex, templateBlocks) => {
    // Глубокое копирование блоков шаблона с уникальными ID
    const timestamp = Date.now();
    const makeId = (idx?: number) => `block-${timestamp}-${idx ?? 0}-${Math.random().toString(36).substr(2, 9)}`;

    const cloneDeep = (block: Block, idxHint?: number): Block => {
      const base = { ...block, id: makeId(idxHint) } as Block;
      if (block.type === 'container') {
        const children = ((block as any).children as Block[]).map((child, i) => cloneDeep(child, i));
        return { ...(base as any), children } as Block;
      }
      if (block.type === 'grid') {
        const gb = block as GridBlock;
        const cells = gb.cells.map((cell, i) => {
          if (!cell.block) return { ...cell } as GridCell;
          return { ...cell, block: cloneDeep(cell.block, i) } as GridCell;
        });
        return { ...(base as any), settings: { ...gb.settings }, cells } as Block;
      }
      return base;
    };

    const newBlocks: Block[] = templateBlocks.map((b, i) => addResponsiveToBlock(cloneDeep(b, i)));

    set((state) => {
      const blocks = [...state.project.blocks];
      const safeIndex = Math.max(0, Math.min(insertIndex, blocks.length));
      blocks.splice(safeIndex, 0, ...newBlocks);
      return {
        project: {
          ...state.project,
          blocks,
        },
        selectedBlockId: newBlocks[0]?.id || null,
      };
    });

    get().saveToLocalStorage();
  },

  addTemplateToContainer: (containerId, index, templateBlocks) => {
    const timestamp = Date.now();
    const makeId = (idx?: number) => `block-${timestamp}-${idx ?? 0}-${Math.random().toString(36).substr(2, 9)}`;

    const cloneDeep = (block: Block, idxHint?: number): Block => {
      const base = { ...block, id: makeId(idxHint) } as Block;
      if (block.type === 'container') {
        const children = ((block as any).children as Block[]).map((child, i) => cloneDeep(child, i));
        return { ...(base as any), children } as Block;
      }
      if (block.type === 'grid') {
        const gb = block as GridBlock;
        const cells = gb.cells.map((cell, i) => {
          if (!cell.block) return { ...cell } as GridCell;
          return { ...cell, block: cloneDeep(cell.block, i) } as GridCell;
        });
        return { ...(base as any), settings: { ...gb.settings }, cells } as Block;
      }
      return base;
    };

    const clones = templateBlocks.map((b, i) => addResponsiveToBlock(cloneDeep(b, i)));

    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function insertIntoContainer(b: Block): Block {
          if (b.id === containerId && b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = [...orig];
            const safeIndex = Math.max(0, Math.min(index, children.length));
            children.splice(safeIndex, 0, ...clones);
            return { ...(b as any), children } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(insertIntoContainer);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = insertIntoContainer(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
    }));

    get().saveToLocalStorage();
  },

  addTemplateToGridCell: (gridId, cellIndex, templateBlocks) => {
    const timestamp = Date.now();
    const makeId = (idx?: number) => `block-${timestamp}-${idx ?? 0}-${Math.random().toString(36).substr(2, 9)}`;

    const cloneDeep = (block: Block, idxHint?: number): Block => {
      const base = { ...block, id: makeId(idxHint) } as Block;
      if (block.type === 'container') {
        const children = ((block as any).children as Block[]).map((child, i) => cloneDeep(child, i));
        return { ...(base as any), children } as Block;
      }
      if (block.type === 'grid') {
        const gb = block as GridBlock;
        const cells = gb.cells.map((cell, i) => {
          if (!cell.block) return { ...cell } as GridCell;
          return { ...cell, block: cloneDeep(cell.block, i) } as GridCell;
        });
        return { ...(base as any), settings: { ...gb.settings }, cells } as Block;
      }
      return base;
    };

    // Если в шаблоне несколько блоков, оборачиваем их в контейнер
    const prepared: Block = templateBlocks.length === 1
      ? addResponsiveToBlock(cloneDeep(templateBlocks[0], 0))
      : addResponsiveToBlock({
          id: makeId(0),
          type: 'container',
          style: { margin: '10px 0', padding: '10px', width: '100%', backgroundColor: '#fafafa' },
          children: templateBlocks.map((b, i) => addResponsiveToBlock(cloneDeep(b, i))),
        } as Block);

    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function insertIntoGrid(b: Block): Block {
          if (b.id === gridId && b.type === 'grid') {
            const gb = b as GridBlock;
            const cells = [...gb.cells];
            const idx = Math.max(0, Math.min(cellIndex, cells.length - 1));
            cells[idx] = { ...(cells[idx] || { block: null }), block: prepared } as GridCell;
            return { ...gb, cells } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map(insertIntoGrid);
            if (children !== orig) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = insertIntoGrid(inner);
              if (updated !== inner) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return b;
        }),
      },
    }));

    get().saveToLocalStorage();
  },

  updateBlock: (id, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map(function updateDeep(block: Block): Block {
          if (block.id === id) {
            return { ...block, ...updates } as Block;
          }
          if (block.type === 'container') {
            const orig = (block as any).children as Block[];
            const children = orig.map(updateDeep);
            if (children !== orig) {
              return { ...(block as any), children } as Block;
            }
          }
          if (block.type === 'grid') {
            const gb = block as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const cellBlock = cell?.block;
              if (!cellBlock) return cell;
              const updated = updateDeep(cellBlock);
              if (updated !== cellBlock) return { ...cell, block: updated } as GridCell;
              return cell;
            });
            if (newCells !== gb.cells) {
              return { ...gb, cells: newCells } as Block;
            }
          }
          return block;
        }),
      },
    }));
  },

  deleteBlock: (id) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks
          .map(function removeDeep(block: Block): Block | null {
            if (block.id === id) return null;
            if (block.type === 'container') {
              const orig = (block as any).children as Block[];
              const children: Block[] = [];
              for (const child of orig) {
                const res = removeDeep(child);
                if (res) children.push(res);
              }
              return { ...(block as any), children } as Block;
            }
            if (block.type === 'grid') {
              const gb = block as GridBlock;
              const newCells = gb.cells.map((cell) => {
                const inner = cell.block;
                if (!inner) return cell;
                const res = removeDeep(inner);
                return { ...cell, block: res || null } as GridCell;
              });
              return { ...gb, cells: newCells } as Block;
            }
            return block;
          })
          .filter(Boolean) as Block[],
      },
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    }));
  },

  moveBlock: (fromIndex, toIndex) => {
    set((state) => {
      const blocks = [...state.project.blocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      return {
        project: {
          ...state.project,
          blocks,
        },
      };
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  updateHeader: (updates) => {
    set((state) => ({
      project: {
        ...state.project,
        header: { ...state.project.header, ...updates },
      },
    }));
  },

  updateFooter: (updates) => {
    set((state) => ({
      project: {
        ...state.project,
        footer: { ...state.project.footer, ...updates },
      },
    }));
  },

  updateTheme: (updates) => {
    const prevAccent = get().project.theme.accent;
    set((state) => {
      const newTheme = { ...state.project.theme, ...updates };
      const newAccent = newTheme.accent;

      // если accent изменился, синхронизируем кнопки, использующие предыдущий accent
      const syncButtons = (b: Block): Block => {
        if (b.type === 'container') {
          const children = ((b as any).children as Block[]).map(syncButtons);
          return { ...(b as any), children } as Block;
        }
        if (b.type === 'grid') {
          const gb = b as GridBlock;
          const cells = gb.cells.map((cell) => {
            if (!cell.block) return cell;
            return { ...cell, block: syncButtons(cell.block) } as GridCell;
          });
          return { ...gb, cells } as Block;
        }
        if (b.type === 'button') {
          const btn = b as any;
          if (btn.buttonColor === prevAccent) {
            return { ...btn, buttonColor: newAccent } as Block;
          }
          return b;
        }
        return b;
      };

      const blocks = prevAccent !== newAccent ? state.project.blocks.map(syncButtons) : state.project.blocks;

      return {
        project: {
          ...state.project,
          theme: newTheme,
          blocks,
        },
      };
    });
  },

  clearProject: () => {
    set({
      project: defaultProject,
      selectedBlockId: null,
    });
  },

  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),

  saveToLocalStorage: () => {
    try {
      const { project } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (error) {
      console.error('Ошибка сохранения в LocalStorage:', error);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const project = JSON.parse(stored) as Project;
        // Мигрируем блоки для backward compatibility
        const migratedBlocks = migrateProjectBlocks(project.blocks || []);
        set({
          project: {
            ...defaultProject,
            ...project,
            blocks: migratedBlocks,
            theme: {
              ...defaultProject.theme,
              ...(project as any).theme || {},
            },
          },
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки из LocalStorage:', error);
      // При ошибке создаём новый проект
      set({ project: defaultProject });
    }
  },
}));

