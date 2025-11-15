import type { Block, BlockType, GridBlock, Theme } from '../../types';

export const createNewBlock = (type: BlockType, theme?: Theme): Block => {
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
          color: theme?.text || '#000000',
          fontSize: '16px',
          textAlign: 'center',
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
        buttonColor: (theme && theme.accent) || '#4200FF',
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
    case 'input':
      return {
        ...baseBlock,
        type: 'input',
        value: '',
        placeholder: 'Введите текст',
        name: 'input',
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
          backgroundColor: theme?.surface || '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
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
          align: 'center',
          justify: 'center',
          placementType: 'fraction',
          showCellBorders: false,
          cellBorderColor: theme?.border || '#e0e0e0',
          cellBorderWidth: 1,
        },
        cells: Array.from({ length: 4 }, () => ({ block: null, align: 'center', justify: 'center' })),
      } as Block;
  }
};

export const createGrid = (columns: number, rows: number, theme?: Theme): GridBlock => {
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
      align: 'center',
      justify: 'center',
      placementType: 'fraction',
      showCellBorders: false,
      cellBorderColor: theme?.border || '#e0e0e0',
      cellBorderWidth: 1,
    },
    cells: Array.from({ length: columns * rows }, () => ({ block: null, align: 'center', justify: 'center' })),
  };
};




