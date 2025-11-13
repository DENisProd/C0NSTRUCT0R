import type { Block, BlockType, GridBlock, Theme } from '../../types';

export const createNewBlock = (type: BlockType, themeAccent?: string): Block => {
  const baseBlock = {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    style: {
      margin: '10px 0',
      padding: '10px',
      width: '100%',
    },
  };

  switch (type) {
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
        buttonColor: themeAccent || '#007bff',
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

export const createGrid = (columns: number, rows: number): GridBlock => {
  const baseBlock = {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    style: {
      margin: '10px 0',
      padding: '10px',
      width: '100%',
    },
  };
  
  return {
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
};

