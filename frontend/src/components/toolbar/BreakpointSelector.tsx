import { Box, HStack, NativeSelect } from '@chakra-ui/react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import type { Breakpoint } from '../../store/useResponsiveStore';

interface BreakpointSelectorProps {
  currentBreakpoint: Breakpoint;
  setBreakpoint: (breakpoint: Breakpoint) => void;
}

export const BreakpointSelector = ({
  currentBreakpoint,
  setBreakpoint,
}: BreakpointSelectorProps) => {
  const breakpointIcon =
    currentBreakpoint === 'desktop' ? (
      <Monitor size={16} />
    ) : currentBreakpoint === 'tablet' ? (
      <Tablet size={16} />
    ) : (
      <Smartphone size={16} />
    );

  return (
    <Box>
      <HStack gap="8px" align="center">
        {breakpointIcon}
        <NativeSelect.Root size="sm" width="140px" backgroundColor="#fff">
          <NativeSelect.Field
            value={currentBreakpoint}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setBreakpoint(e.target.value as Breakpoint)
            }
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>
    </Box>
  );
};



