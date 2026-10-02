export const PHOTO_VIEWER_MIN_SCALE = 1;
export const PHOTO_VIEWER_MAX_SCALE = 4;
export const PHOTO_VIEWER_DOUBLE_TAP_SCALE = 2.4;
export const PHOTO_VIEWER_HIDE_CONTROLS_MS = 3000;
export const PHOTO_VIEWER_CLOSE_SWIPE_PX = 110;
export const PHOTO_VIEWER_CLOSE_VELOCITY = 900;

export type PhotoPoint = { x: number; y: number };
export type PhotoSize = { width: number; height: number };

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampScale(scale: number): number {
  return clampNumber(scale, PHOTO_VIEWER_MIN_SCALE, PHOTO_VIEWER_MAX_SCALE);
}

export function nextDoubleTapScale(scale: number): number {
  return scale > 1.05 ? PHOTO_VIEWER_MIN_SCALE : PHOTO_VIEWER_DOUBLE_TAP_SCALE;
}

export function pointerDistance(a: PhotoPoint, b: PhotoPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function containedImageSize(
  naturalWidth: number,
  naturalHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): PhotoSize {
  if (naturalWidth <= 0 || naturalHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: Math.max(viewportWidth, 0), height: Math.max(viewportHeight, 0) };
  }
  const scale = Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight);
  return { width: naturalWidth * scale, height: naturalHeight * scale };
}

export function maxPan(scale: number, image: PhotoSize, viewport: PhotoSize): PhotoPoint {
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    x: Math.max(0, (width - viewport.width) / 2),
    y: Math.max(0, (height - viewport.height) / 2),
  };
}

export function clampPan(
  x: number,
  y: number,
  scale: number,
  image: PhotoSize,
  viewport: PhotoSize,
): PhotoPoint {
  const limit = maxPan(scale, image, viewport);
  return {
    x: clampNumber(x, -limit.x, limit.x),
    y: clampNumber(y, -limit.y, limit.y),
  };
}

export function shouldCloseOnSwipe(offsetY: number, velocityY: number, scale: number): boolean {
  if (scale > 1.02) return false;
  return offsetY > PHOTO_VIEWER_CLOSE_SWIPE_PX || velocityY > PHOTO_VIEWER_CLOSE_VELOCITY;
}
