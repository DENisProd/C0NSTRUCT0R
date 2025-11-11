import { Box, Text, Icon } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';

interface SelectionRect {
  userId: string;
  color: string;
  rect: { x: number; y: number; width: number; height: number };
}

export const CursorsOverlay = () => {
  const { cursors, userId: selfId, getColorForUser } = useWebSocketStore();
  const [selections, setSelections] = useState<SelectionRect[]>([]);

  const entries = useMemo(() => Array.from(cursors.values()), [cursors]);

  useEffect(() => {
    const computeRects = () => {
      const rects: SelectionRect[] = [];
      for (const c of entries) {
        if (c.userId === selfId) continue;
        if (!c.blockId) continue;
        const el = document.querySelector(`[data-block-id="${c.blockId}"]`) as HTMLElement | null;
        if (!el) continue;
        const r = el.getBoundingClientRect();
        rects.push({
          userId: c.userId,
          color: getColorForUser(c.userId),
          rect: { x: r.left, y: r.top, width: r.width, height: r.height },
        });
      }
      setSelections(rects);
    };

    computeRects();

    const recompute = () => computeRects();
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);

    const interval = setInterval(computeRects, 200);

    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
      clearInterval(interval);
    };
  }, [entries, selfId, getColorForUser]);

  return (
    <>
      {entries.map((c) => {
        if (c.userId === selfId) return null;
        const color = getColorForUser(c.userId);
        return (
          <Box
            key={`cursor-${c.userId}`}
            position="fixed"
            left={c.x}
            top={c.y}
            transform="translate(2px, 2px)"
            zIndex={2000}
            pointerEvents="none"
          >
            <Icon viewBox="0 0 24 24" boxSize="16px" color={color} overflow="visible">
              <path d="M3 2 L18 12 L12 12 L14 22 L11 21 L9 12 L4 13 Z" fill="currentColor" stroke="#fff" strokeWidth="1" />
            </Icon>
            <Text fontSize="10px" marginTop="2px" color="#333" backgroundColor="#fff" padding="2px 4px" border="1px solid #ddd" borderRadius="4px" boxShadow="0 1px 2px rgba(0,0,0,0.06)">
              {c.userName ?? 'Участник'}
            </Text>
          </Box>
        );
      })}

      {selections.map((s) => (
        <Box
          key={`sel-${s.userId}`}
          position="fixed"
          left={s.rect.x}
          top={s.rect.y}
          width={`${s.rect.width}px`}
          height={`${s.rect.height}px`}
          border={`2px solid ${s.color}`}
          boxShadow={`0 0 0 2px ${s.color}55 inset`}
          borderRadius="6px"
          pointerEvents="none"
          zIndex={1500}
        />
      ))}
    </>
  );
};