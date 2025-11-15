import type { Block } from '../../types';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { ButtonBlock } from './ButtonBlock';
import { VideoBlock } from './VideoBlock';
import { useProjectStore } from '../../store/useProjectStore';
import { ContainerBlock } from './ContainerBlock';
import { GridBlock } from './GridBlock';
import { InputBlock } from './InputBlock';

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
  interactionsEnabled?: boolean;
}

export const BlockRenderer = ({ block, isPreview = false, interactionsEnabled = true }: BlockRendererProps) => {
  const { selectedBlockId } = useProjectStore();
  const isSelected = selectedBlockId === block.id;

  switch (block.type) {
    case 'text':
      return <TextBlock block={block} isSelected={isSelected} isPreview={isPreview} interactionsEnabled={interactionsEnabled} />;
    case 'image':
      return <ImageBlock block={block} isSelected={isSelected} isPreview={isPreview} interactionsEnabled={interactionsEnabled} />;
    case 'button':
      return <ButtonBlock block={block} isSelected={isSelected} isPreview={isPreview} interactionsEnabled={interactionsEnabled} />;
    case 'video':
      return <VideoBlock block={block} isSelected={isSelected} isPreview={isPreview} />;
    case 'input':
      return <InputBlock block={block} isSelected={isSelected} isPreview={isPreview} />;
    case 'container':
      return <ContainerBlock block={block} isSelected={isSelected} isPreview={isPreview} />;
    case 'grid':
      return <GridBlock block={block} isSelected={isSelected} isPreview={isPreview} />;
    default:
      return null;
  }
};


