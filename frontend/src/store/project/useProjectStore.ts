import { create } from 'zustand';
import type {
  Project,
  Block,
  BlockType,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  VideoBlock,
  GridBlock,
  GridCell,
  Theme,
  InputBlock,
} from '../../types';
import { createNewBlock, createGrid } from './blockCreators';
import {
  cloneBlockDeep,
  createIdGenerator,
  computeContainerDepth,
} from './blockUtils';
import {
  getDefaultProject,
  saveToLocalStorage,
  loadFromLocalStorage,
  saveProjectToApi,
  loadProjectFromApi,
} from './persistence';

type UpdatePayload =
  | Partial<TextBlock>
  | Partial<ImageBlock>
  | Partial<ButtonBlock>
  | Partial<VideoBlock>
  | Partial<InputBlock>
  | Partial<Block>;

interface ProjectStore {
  project: Project;
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  currentProjectId: number | null;
  isLibraryDragging: boolean;

  // Actions
  setProject: (project: Project) => void;
  setCurrentProjectId: (id: number | null) => void;
  setLibraryDragging: (flag: boolean) => void;
  addBlock: (type: BlockType) => void;
  addGrid: (columns: number, rows: number) => void;
  addBlockToContainer: (containerId: string, index: number, type: BlockType) => void;
  addBlockToGridCell: (gridId: string, cellIndex: number, type: BlockType) => void;
  moveGridItem: (gridId: string, fromCellIndex: number, toCellIndex: number) => void;
  updateGridSettings: (gridId: string, updates: Partial<GridBlock['settings']>) => void;
  updateGridCellAlign: (
    gridId: string,
    cellIndex: number,
    updates: { align?: GridCell['align']; justify?: GridCell['justify'] }
  ) => void;
  addTemplateBlocks: (blocks: Block[]) => void;
  addTemplateBlocksAt: (index: number, blocks: Block[]) => void;
  addTemplateToContainer: (containerId: string, index: number, blocks: Block[]) => void;
  addTemplateToGridCell: (gridId: string, cellIndex: number, blocks: Block[]) => void;
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
  saveToApi: () => Promise<void>;
  loadProjectFromApi: (id: number) => Promise<void>;
}

// Вспомогательные функции для работы с деревом блоков
const insertIntoContainer = (
  blocks: Block[],
  containerId: string,
  newBlock: Block
): Block[] => {
  return blocks.map((b: Block): Block => {
    if (b.id === containerId && b.type === 'container') {
      const children = [...((b as any).children as Block[])];
      children.push(newBlock);
      return { ...(b as any), children } as Block;
    }
    if (b.type === 'container') {
      const orig = (b as any).children as Block[];
      const children = insertIntoContainer(orig, containerId, newBlock);
      if (children !== orig) {
        return { ...(b as any), children } as Block;
      }
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const inner = cell.block;
        if (!inner) return cell;
        const updated = insertIntoContainer([inner], containerId, newBlock)[0];
        if (updated !== inner) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return b;
  });
};

const insertIntoContainerAt = (
  blocks: Block[],
  containerId: string,
  index: number,
  newBlock: Block
): Block[] => {
  return blocks.map((b: Block): Block => {
    if (b.id === containerId && b.type === 'container') {
      const children = [...((b as any).children as Block[])];
      const safeIndex = Math.max(0, Math.min(index, children.length));
      children.splice(safeIndex, 0, newBlock);
      return { ...(b as any), children } as Block;
    }
    if (b.type === 'container') {
      const orig = (b as any).children as Block[];
      const children = insertIntoContainerAt(orig, containerId, index, newBlock);
      if (children !== orig) {
        return { ...(b as any), children } as Block;
      }
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const inner = cell.block;
        if (!inner) return cell;
        const updated = insertIntoContainerAt([inner], containerId, index, newBlock)[0];
        if (updated !== inner) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return b;
  });
};

const insertIntoGrid = (
  blocks: Block[],
  gridId: string,
  cellIndex: number,
  newBlock: Block
): Block[] => {
  return blocks.map((b: Block): Block => {
    if (b.id === gridId && b.type === 'grid') {
      const gb = b as GridBlock;
      const cells = [...gb.cells];
      const idx = Math.max(0, Math.min(cellIndex, cells.length - 1));
      const existing = cells[idx] || { block: null };
      cells[idx] = { ...existing, block: newBlock } as GridCell;
      return { ...gb, cells } as Block;
    }
    if (b.type === 'container') {
      const orig = (b as any).children as Block[];
      const children = insertIntoGrid(orig, gridId, cellIndex, newBlock);
      if (children !== orig) {
        return { ...(b as any), children } as Block;
      }
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const inner = cell.block;
        if (!inner) return cell;
        const updated = insertIntoGrid([inner], gridId, cellIndex, newBlock)[0];
        if (updated !== inner) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return b;
  });
};

const updateBlockDeep = (blocks: Block[], id: string, updates: UpdatePayload): Block[] => {
  return blocks.map((block: Block): Block => {
    if (block.id === id) {
      // Правильно мержим вложенные объекты, особенно style
      const merged: any = { ...block };
      if (updates.style) {
        if (block.style) {
          // Мержим style объекты
          merged.style = { ...block.style };
          // Мержим все свойства style, кроме responsive
          Object.keys(updates.style).forEach((key) => {
            if (key !== 'responsive') {
              (merged.style as any)[key] = (updates.style as any)[key];
            }
          });
          // Мержим responsive, если он есть
          if (updates.style.responsive) {
            if (block.style.responsive) {
              merged.style.responsive = { ...block.style.responsive, ...updates.style.responsive };
            } else {
              merged.style.responsive = updates.style.responsive;
            }
          }
        } else {
          merged.style = updates.style;
        }
      }
      // Применяем остальные обновления
      Object.keys(updates).forEach((key) => {
        if (key !== 'style') {
          (merged as any)[key] = (updates as any)[key];
        }
      });
      return merged as Block;
    }
    if (block.type === 'container') {
      const orig = (block as any).children as Block[];
      const children = updateBlockDeep(orig, id, updates);
      if (children !== orig) {
        return { ...(block as any), children } as Block;
      }
    }
    if (block.type === 'grid') {
      const gb = block as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const cellBlock = cell?.block;
        if (!cellBlock) return cell;
        const updated = updateBlockDeep([cellBlock], id, updates)[0];
        if (updated !== cellBlock) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return block;
  });
};

const removeBlockDeep = (blocks: Block[], id: string): Block[] => {
  return blocks
    .map((block: Block): Block | null => {
      if (block.id === id) return null;
      if (block.type === 'container') {
        const orig = (block as any).children as Block[];
        const children: Block[] = [];
        for (const child of orig) {
          const res = removeBlockDeep([child], id);
          if (res.length > 0) children.push(res[0]);
        }
        return { ...(block as any), children } as Block;
      }
      if (block.type === 'grid') {
        const gb = block as GridBlock;
        const newCells = gb.cells.map((cell) => {
          const inner = cell.block;
          if (!inner) return cell;
          const res = removeBlockDeep([inner], id);
          return { ...cell, block: res.length > 0 ? res[0] : null } as GridCell;
        });
        return { ...gb, cells: newCells } as Block;
      }
      return block;
    })
    .filter(Boolean) as Block[];
};

const moveInGrid = (
  blocks: Block[],
  gridId: string,
  fromCellIndex: number,
  toCellIndex: number
): Block[] => {
  return blocks.map((b: Block): Block => {
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
      const children = moveInGrid(orig, gridId, fromCellIndex, toCellIndex);
      if (children !== orig) {
        return { ...(b as any), children } as Block;
      }
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const inner = cell.block;
        if (!inner) return cell;
        const updated = moveInGrid([inner], gridId, fromCellIndex, toCellIndex)[0];
        if (updated !== inner) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return b;
  });
};

const updateGrid = (
  blocks: Block[],
  gridId: string,
  updates: Partial<GridBlock['settings']>
): Block[] => {
  return blocks.map((b: Block): Block => {
    if (b.id === gridId && b.type === 'grid') {
      const gb = b as GridBlock;
      const newSettings = { ...gb.settings, ...updates };
      const newCellsCount = newSettings.columns * newSettings.rows;
      let newCells = gb.cells;
      if (newCellsCount !== gb.cells.length) {
        newCells = Array.from(
          { length: newCellsCount },
          (_, i) => gb.cells[i] ?? ({ block: null } as GridCell)
        );
      }
      return { ...gb, settings: newSettings, cells: newCells } as Block;
    }
    if (b.type === 'container') {
      const orig = (b as any).children as Block[];
      const children = updateGrid(orig, gridId, updates);
      if (children !== orig) {
        return { ...(b as any), children } as Block;
      }
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const inner = cell.block;
        if (!inner) return cell;
        const updated = updateGrid([inner], gridId, updates)[0];
        if (updated !== inner) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return b;
  });
};

const updateCell = (
  blocks: Block[],
  gridId: string,
  cellIndex: number,
  updates: { align?: GridCell['align']; justify?: GridCell['justify'] }
): Block[] => {
  return blocks.map((b: Block): Block => {
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
      const children = updateCell(orig, gridId, cellIndex, updates);
      if (children !== orig) {
        return { ...(b as any), children } as Block;
      }
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const newCells = gb.cells.map((cell) => {
        const inner = cell.block;
        if (!inner) return cell;
        const updated = updateCell([inner], gridId, cellIndex, updates)[0];
        if (updated !== inner) return { ...cell, block: updated } as GridCell;
        return cell;
      });
      if (newCells !== gb.cells) {
        return { ...gb, cells: newCells } as Block;
      }
    }
    return b;
  });
};

const syncButtonsWithTheme = (blocks: Block[], prevAccent: string, newAccent: string): Block[] => {
  return blocks.map((b: Block): Block => {
    if (b.type === 'container') {
      const children = ((b as any).children as Block[]).map((child) =>
        syncButtonsWithTheme([child], prevAccent, newAccent)[0]
      );
      return { ...(b as any), children } as Block;
    }
    if (b.type === 'grid') {
      const gb = b as GridBlock;
      const cells = gb.cells.map((cell) => {
        if (!cell.block) return cell;
        return {
          ...cell,
          block: syncButtonsWithTheme([cell.block], prevAccent, newAccent)[0],
        } as GridCell;
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
  });
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: getDefaultProject(),
  selectedBlockId: null,
  isPreviewMode: false,
  currentProjectId: null,
  isLibraryDragging: false,

  setProject: (project) => set({ project }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setLibraryDragging: (flag) => set({ isLibraryDragging: flag }),

  addBlock: (type) => {
    const newBlock = createNewBlock(type, get().project.theme);
    set((state) => ({
      project: {
        ...state.project,
        blocks: [...state.project.blocks, newBlock],
      },
      selectedBlockId: newBlock.id,
    }));
  },

  addGrid: (columns, rows) => {
    const grid = createGrid(columns, rows, get().project.theme);
    set((state) => ({
      project: { ...state.project, blocks: [...state.project.blocks, grid] },
      selectedBlockId: grid.id,
    }));
  },

  addBlockToContainer: (containerId, index, type) => {
    const newChild = createNewBlock(type, get().project.theme);

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
        blocks: insertIntoContainerAt(state.project.blocks, containerId, index, newChild),
      },
      selectedBlockId: newChild.id,
    }));
  },

  addBlockToGridCell: (gridId, cellIndex, type) => {
    const newChild = createNewBlock(type, get().project.theme);
    set((state) => ({
      project: {
        ...state.project,
        blocks: insertIntoGrid(state.project.blocks, gridId, cellIndex, newChild),
      },
      selectedBlockId: newChild.id,
    }));
  },

  moveGridItem: (gridId, fromCellIndex, toCellIndex) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: moveInGrid(state.project.blocks, gridId, fromCellIndex, toCellIndex),
      },
    }));
  },

  updateGridSettings: (gridId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: updateGrid(state.project.blocks, gridId, updates),
      },
    }));
  },

  updateGridCellAlign: (gridId, cellIndex, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: updateCell(state.project.blocks, gridId, cellIndex, updates),
      },
    }));
  },

  addTemplateBlocks: (templateBlocks) => {
    const timestamp = Date.now();
    const makeId = createIdGenerator(timestamp);
    const currentTheme = get().project.theme;

    const newBlocks: Block[] = templateBlocks.map((b, i) =>
      cloneBlockDeep(b, makeId, i, currentTheme)
    );

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
    const timestamp = Date.now();
    const makeId = createIdGenerator(timestamp);
    const currentTheme = get().project.theme;

    const newBlocks: Block[] = templateBlocks.map((b, i) =>
      cloneBlockDeep(b, makeId, i, currentTheme)
    );

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
    const makeId = createIdGenerator(timestamp);

    const currentTheme = get().project.theme;
    const clones = templateBlocks.map((b, i) => cloneBlockDeep(b, makeId, i, currentTheme));

    set((state) => ({
      project: {
        ...state.project,
        blocks: state.project.blocks.map((b: Block): Block => {
          if (b.id === containerId && b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = [...orig];
            const safeIndex = Math.max(0, Math.min(index, children.length));
            children.splice(safeIndex, 0, ...clones);
            return { ...(b as any), children } as Block;
          }
          if (b.type === 'container') {
            const orig = (b as any).children as Block[];
            const children = orig.map((child) => {
              const updated = insertIntoContainerAt([child], containerId, index, clones[0])[0];
              return updated !== child ? updated : child;
            });
            if (children.some((c, i) => c !== orig[i])) {
              return { ...(b as any), children } as Block;
            }
          }
          if (b.type === 'grid') {
            const gb = b as GridBlock;
            const newCells = gb.cells.map((cell) => {
              const inner = cell.block;
              if (!inner) return cell;
              const updated = insertIntoContainerAt([inner], containerId, index, clones[0])[0];
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
    const makeId = createIdGenerator(timestamp);
    const currentTheme = get().project.theme;

    // Если в шаблоне несколько блоков, оборачиваем их в контейнер
    const prepared: Block =
      templateBlocks.length === 1
        ? cloneBlockDeep(templateBlocks[0], makeId, 0, currentTheme)
        : ({
            id: makeId(0),
            type: 'container',
            style: {
              margin: '10px 0',
              padding: '10px',
              width: '100%',
              backgroundColor: currentTheme.surface,
            },
            children: templateBlocks.map((b, i) => cloneBlockDeep(b, makeId, i, currentTheme)),
          } as Block);

    set((state) => ({
      project: {
        ...state.project,
        blocks: insertIntoGrid(state.project.blocks, gridId, cellIndex, prepared),
      },
    }));

    get().saveToLocalStorage();
  },

  updateBlock: (id, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: updateBlockDeep(state.project.blocks, id, updates),
      },
    }));
  },

  deleteBlock: (id) => {
    set((state) => ({
      project: {
        ...state.project,
        blocks: removeBlockDeep(state.project.blocks, id),
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
      const prevTheme = state.project.theme;
      let newTheme = { ...prevTheme, ...updates } as Theme;

      if (updates.mode && updates.mode !== prevTheme.mode) {
        if (updates.mode === 'dark') {
          newTheme = {
            ...prevTheme,
            mode: 'dark',
            accent: '#7c5cff',
            text: '#ffffff',
            heading: '#ffffff',
            background: '#212529',
            surface: '#343a40',
            border: '#495057',
            ...updates,
          } as Theme;
        } else {
          newTheme = {
            ...prevTheme,
            mode: 'light',
            accent: '#4200FF',
            text: '#000000',
            heading: '#000000',
            background: '#ffffff',
            surface: '#f5f5f5',
            border: '#e0e0e0',
            ...updates,
          } as Theme;
        }
      }

      const newAccent = newTheme.accent;

      const blocks =
        prevAccent !== newAccent
          ? syncButtonsWithTheme(state.project.blocks, prevAccent, newAccent)
          : state.project.blocks;

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
      project: getDefaultProject(),
      selectedBlockId: null,
    });
  },

  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),

  saveToLocalStorage: () => {
    const { project } = get();
    saveToLocalStorage(project);
  },

  loadFromLocalStorage: () => {
    const loaded = loadFromLocalStorage();
    if (loaded) {
      set({ project: loaded });
    } else {
      set({ project: getDefaultProject() });
    }
  },

  saveToApi: async () => {
    const { project, currentProjectId } = get();
    await saveProjectToApi(project, currentProjectId);
  },

  loadProjectFromApi: async (id: number) => {
    const loadedProject = await loadProjectFromApi(id);
    set({
      project: loadedProject,
      currentProjectId: id,
    });
    saveToLocalStorage(loadedProject);
  },
}));

