import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useProjectStore } from '../store/useProjectStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useLibraryStore } from '../store/useLibraryStore';
import type { BlockType } from '../types';

interface DndProviderProps {
  children: ReactNode;
}

export const DndProvider = ({ children }: DndProviderProps) => {
  const { project, moveBlock, addBlock, addBlockToContainer, addBlockToGridCell, moveGridItem, addTemplateBlocksAt, addTemplateToContainer, addTemplateToGridCell } = useProjectStore();
  const { getTemplate } = useTemplatesStore();
  const { systemBlocks, communityBlocks, userBlocks } = useLibraryStore();
  const { blocks } = project;

  const [keyboardEnabled, setKeyboardEnabled] = useState(true);

  useEffect(() => {
    const update = () => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName.toLowerCase();
      const isEditing = !!el && (el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
      setKeyboardEnabled(!isEditing);
    };
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    update();
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
    keyboardCodes: keyboardEnabled
      ? undefined
      : {
          start: [],
          cancel: [],
          end: [],
          move: { horizontal: [], vertical: [] },
        },
  });
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const getTargetIndexForWorkspace = (overId: string): number => {
    let targetIndex = blocks.length > 0 ? blocks.length : 0;

    if (blocks.length === 0) {
      return 0;
    }

    if (overId.startsWith('workspace-drop-zone-')) {
      const idxStr = overId.replace('workspace-drop-zone-', '');
      const parsed = parseInt(idxStr, 10);
      if (!Number.isNaN(parsed)) {
        targetIndex = parsed;
      }
    } else {
      const foundIndex = useProjectStore.getState().project.blocks.findIndex((b) => b.id === overId);
      if (foundIndex >= 0) {
        targetIndex = foundIndex;
      }
    }

    return targetIndex;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id.toString().startsWith('template-')) {
      const templateId = active.data.current?.templateId as string;
      if (templateId) {
        const template = getTemplate(templateId);
        if (!template) return;

        const overId = over.id.toString();
        if (overId.startsWith('container-drop-zone-')) {
          const parts = overId.replace('container-drop-zone-', '').split('-');
          const containerId = parts.slice(0, -1).join('-');
          const idxStr = parts[parts.length - 1];
          const insertIndex = parseInt(idxStr, 10);
          if (!Number.isNaN(insertIndex)) {
            addTemplateToContainer(containerId, insertIndex, template.blocks);
          }
        } else if (overId.startsWith('grid-cell-')) {
          const [gridId, cellIdxStr] = (() => {
            const parts = overId.replace('grid-cell-', '').split('-');
            const id = parts.slice(0, -1).join('-');
            const idx = parts[parts.length - 1];
            return [id, idx];
          })();
          const cellIndex = parseInt(cellIdxStr, 10);
          if (!Number.isNaN(cellIndex) && template.blocks.length > 0) {
            addTemplateToGridCell(gridId, cellIndex, template.blocks);
          }
        } else if (overId === 'workspace-drop-zone' || blocks.length === 0 || overId.startsWith('workspace-drop-zone-')) {
          const targetIndex = getTargetIndexForWorkspace(overId);
          addTemplateBlocksAt(targetIndex, template.blocks);
        }
      }
      return;
    }

    if (active.id.toString().startsWith('library-block-')) {
      const libraryBlockId = active.data.current?.libraryBlockId as string;
      if (libraryBlockId) {
        const all = [...systemBlocks, ...communityBlocks, ...userBlocks];
        const lib = all.find((b) => b.id === libraryBlockId);
        if (!lib) return;

        const overId = over.id.toString();
        if (overId.startsWith('container-drop-zone-')) {
          const parts = overId.replace('container-drop-zone-', '').split('-');
          const containerId = parts.slice(0, -1).join('-');
          const idxStr = parts[parts.length - 1];
          const insertIndex = parseInt(idxStr, 10);
          if (!Number.isNaN(insertIndex)) {
            addTemplateToContainer(containerId, insertIndex, lib.blocks ?? []);
          }
        } else if (overId.startsWith('grid-cell-')) {
          const parts = overId.replace('grid-cell-', '').split('-');
          const gridId = parts.slice(0, -1).join('-');
          const idxStr = parts[parts.length - 1];
          const cellIndex = parseInt(idxStr, 10);
          if (!Number.isNaN(cellIndex)) {
            addTemplateToGridCell(gridId, cellIndex, lib.blocks ?? []);
          }
        } else if (overId === 'workspace-drop-zone' || blocks.length === 0 || overId.startsWith('workspace-drop-zone-')) {
          const targetIndex = getTargetIndexForWorkspace(overId);
          addTemplateBlocksAt(targetIndex, lib.blocks ?? []);
        } else {
          const targetIndex = getTargetIndexForWorkspace(overId);
          addTemplateBlocksAt(targetIndex, lib.blocks ?? []);
        }
      }
      return;
    }

    if (active.id.toString().startsWith('new-block-')) {
      const blockType = active.data.current?.type as BlockType;
      if (!blockType) return;

      const overId = over.id.toString();

      if (overId.startsWith('container-drop-zone-')) {
        const parts = overId.replace('container-drop-zone-', '').split('-');
        const containerId = parts.slice(0, -1).join('-');
        const idxStr = parts[parts.length - 1];
        const insertIndex = parseInt(idxStr, 10);
        if (!Number.isNaN(insertIndex)) {
          addBlockToContainer(containerId, insertIndex, blockType);
        }
      } else if (overId.startsWith('grid-cell-')) {
        const parts = overId.replace('grid-cell-', '').split('-');
        const gridId = parts.slice(0, -1).join('-');
        const idxStr = parts[parts.length - 1];
        const cellIndex = parseInt(idxStr, 10);
        if (!Number.isNaN(cellIndex)) {
          addBlockToGridCell(gridId, cellIndex, blockType);
        }
      } else {
        addBlock(blockType);

        let targetIndex = blocks.length;

        if (overId.startsWith('workspace-drop-zone-')) {
          const idxStr = overId.replace('workspace-drop-zone-', '');
          const parsed = parseInt(idxStr, 10);
          if (!Number.isNaN(parsed)) {
            targetIndex = parsed;
          }
        } else {
          const foundIndex = useProjectStore.getState().project.blocks.findIndex((b) => b.id === overId);
          if (foundIndex >= 0) {
            targetIndex = foundIndex;
          }
        }

        const latestBlocks = useProjectStore.getState().project.blocks;
        const lastIndex = latestBlocks.length - 1;
        if (lastIndex >= 0) {
          moveBlock(lastIndex, targetIndex);
        }
      }
      return;
    }

    if (over && active.id !== over.id && !active.id.toString().startsWith('new-block-') && !active.id.toString().startsWith('template-')) {
      const overId = over.id.toString();
      if (active.id.toString().startsWith('nested-block-') && overId.startsWith('grid-cell-')) {
        const activeData = active.data.current as { gridId: string; cellIndex: number } | undefined;
        if (activeData) {
          const parts = overId.replace('grid-cell-', '').split('-');
          const idxStr = parts[parts.length - 1];
          const toIndex = parseInt(idxStr, 10);
          if (!Number.isNaN(toIndex)) {
            moveGridItem(activeData.gridId, activeData.cellIndex, toIndex);
          }
        }
      } else {
        const oldIndex = blocks.findIndex((block) => block.id === active.id);
        let newIndex = blocks.findIndex((block) => block.id === over.id);
        if (newIndex === -1 && overId.startsWith('workspace-drop-zone-')) {
          const idxStr = overId.replace('workspace-drop-zone-', '');
          const parsed = parseInt(idxStr, 10);
          if (!Number.isNaN(parsed)) {
            newIndex = parsed;
          }
        }
        if (oldIndex !== -1 && newIndex !== -1) {
          moveBlock(oldIndex, newIndex);
        }
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
};

