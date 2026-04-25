import { useCallback, useRef, useState } from "react";

export interface UsePinchZoomOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface PinchZoomHandlers {
  zoom: number;
  setZoom: (value: number) => void;
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: () => void;
  isPinching: boolean;
}

const distanceBetweenTouches = (touches: TouchList) => {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const usePinchZoom = ({
  initialZoom = 1,
  minZoom = 1,
  maxZoom = 5,
}: UsePinchZoomOptions = {}): PinchZoomHandlers => {
  const [zoom, setZoomState] = useState(initialZoom);
  const [isPinching, setIsPinching] = useState(false);
  const initialDistanceRef = useRef(0);
  const initialZoomRef = useRef(initialZoom);

  const setZoom = useCallback(
    (value: number) => {
      const clamped = Math.max(minZoom, Math.min(maxZoom, value));
      setZoomState(clamped);
    },
    [minZoom, maxZoom]
  );

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 2) {
        setIsPinching(true);
        initialDistanceRef.current = distanceBetweenTouches(event.touches);
        initialZoomRef.current = zoom;
      }
    },
    [zoom]
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!isPinching || event.touches.length !== 2) return;
      const distance = distanceBetweenTouches(event.touches);
      if (initialDistanceRef.current <= 0) return;
      const scale = distance / initialDistanceRef.current;
      setZoom(initialZoomRef.current * scale);
    },
    [isPinching, setZoom]
  );

  const onTouchEnd = useCallback(() => {
    setIsPinching(false);
    initialDistanceRef.current = 0;
  }, []);

  return {
    zoom,
    setZoom,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPinching,
  };
};
