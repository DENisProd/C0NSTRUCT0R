import { Button, HStack, Box } from '@chakra-ui/react';
import { Brain, WandSparkles } from 'lucide-react';
import './AIGenerateButton.css';

interface AIGenerateButtonProps {
  onClick: () => void;
}

export const AIGenerateButton = ({ onClick }: AIGenerateButtonProps) => {
  return (
    <Button onClick={onClick} size="sm" className="ai-generate-button">
      <HStack className="ai-generate-button__content">
        <WandSparkles size={16} className="ai-generate-button__icon"/>
        <Box as="span">AI</Box>
      </HStack>
    </Button>
  );
};