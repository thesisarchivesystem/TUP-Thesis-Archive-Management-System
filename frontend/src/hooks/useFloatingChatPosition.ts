import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

type FloatingChatPosition = {
  right: number;
  bottom: number;
};

type DragState = {
  startX: number;
  startY: number;
  startRight: number;
  startBottom: number;
  moved: boolean;
};

const DEFAULT_RIGHT = 28;
const DEFAULT_BOTTOM = 28;
const DEFAULT_FAB_SIZE = 74;
const DEFAULT_PANEL_WIDTH = 360;
const DEFAULT_PANEL_HEIGHT = 520;
const DEFAULT_GAP = 16;
const DEFAULT_MARGIN = 16;
const DESKTOP_BREAKPOINT = 768;

const getIsDesktop = () =>
  typeof window === 'undefined' ? true : window.innerWidth > DESKTOP_BREAKPOINT;

export function useFloatingChatPosition() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressFabClickRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);
  const [position, setPosition] = useState<FloatingChatPosition>({
    right: DEFAULT_RIGHT,
    bottom: DEFAULT_BOTTOM,
  });

  const clampPosition = useCallback((nextPosition: FloatingChatPosition) => {
    if (typeof window === 'undefined') return nextPosition;

    const fabRect = fabRef.current?.getBoundingClientRect();
    const fabWidth = fabRect?.width ?? DEFAULT_FAB_SIZE;
    const fabHeight = fabRect?.height ?? DEFAULT_FAB_SIZE;
    const maxRight = Math.max(DEFAULT_MARGIN, window.innerWidth - DEFAULT_MARGIN - fabWidth);
    const maxBottom = Math.max(DEFAULT_MARGIN, window.innerHeight - DEFAULT_MARGIN - fabHeight);

    return {
      right: Math.min(maxRight, Math.max(DEFAULT_MARGIN, nextPosition.right)),
      bottom: Math.min(maxBottom, Math.max(DEFAULT_MARGIN, nextPosition.bottom)),
    };
  }, []);

  const startDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDesktop || event.button !== 0) return;

    const clamped = clampPosition(position);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRight: clamped.right,
      startBottom: clamped.bottom,
      moved: false,
    };
    suppressFabClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [clampPosition, isDesktop, position]);

  const consumeDragClick = useCallback(() => {
    if (!suppressFabClickRef.current) return false;

    suppressFabClickRef.current = false;
    return true;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const desktop = getIsDesktop();
      setIsDesktop(desktop);
      setPosition((current) => (desktop ? clampPosition(current) : {
        right: DEFAULT_RIGHT,
        bottom: DEFAULT_BOTTOM,
      }));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const nextPosition = clampPosition({
        right: drag.startRight - (event.clientX - drag.startX),
        bottom: drag.startBottom - (event.clientY - drag.startY),
      });
      const movedDistance = Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY);
      if (movedDistance > 4) {
        drag.moved = true;
      }

      setPosition(nextPosition);
      event.preventDefault();
    };

    const endDrag = () => {
      const drag = dragRef.current;
      suppressFabClickRef.current = Boolean(drag?.moved);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [clampPosition]);

  const panelStyle = useMemo<CSSProperties | undefined>(() => {
    if (!isDesktop || typeof window === 'undefined') return undefined;

    const panelRect = panelRef.current?.getBoundingClientRect();
    const fabRect = fabRef.current?.getBoundingClientRect();
    const panelWidth = panelRect?.width ?? DEFAULT_PANEL_WIDTH;
    const panelHeight = panelRect?.height ?? DEFAULT_PANEL_HEIGHT;
    const fabWidth = fabRect?.width ?? DEFAULT_FAB_SIZE;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const fabLeft = viewportWidth - position.right - fabWidth;
    const iconOnLeftSide = fabLeft + (fabWidth / 2) < viewportWidth / 2;
    const rawPanelLeft = iconOnLeftSide
      ? fabLeft + fabWidth + DEFAULT_GAP
      : fabLeft - panelWidth - DEFAULT_GAP;
    const maxPanelLeft = Math.max(DEFAULT_MARGIN, viewportWidth - DEFAULT_MARGIN - panelWidth);
    const maxPanelBottom = Math.max(DEFAULT_MARGIN, viewportHeight - DEFAULT_MARGIN - panelHeight);

    return {
      left: `${Math.min(maxPanelLeft, Math.max(DEFAULT_MARGIN, rawPanelLeft))}px`,
      right: 'auto',
      bottom: `${Math.min(maxPanelBottom, Math.max(DEFAULT_MARGIN, position.bottom))}px`,
    };
  }, [isDesktop, position]);

  const fabStyle = useMemo<CSSProperties | undefined>(() => {
    if (!isDesktop) return undefined;

    return {
      right: `${position.right}px`,
      bottom: `${position.bottom}px`,
    };
  }, [isDesktop, position]);

  return {
    panelRef,
    fabRef,
    panelStyle,
    fabStyle,
    isDesktop,
    startDrag,
    consumeDragClick,
    clampPosition,
  };
}
