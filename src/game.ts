export type Cell = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'running' | 'paused' | 'gameover' | 'exited';

export const GRID_SIZE = 16;
export const INITIAL_SNAKE: Cell[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
];
export const INITIAL_DIRECTION: Direction = 'right';
export const BASE_SPEED_MS = 176;
export const MIN_SPEED_MS = 92;
export const SPEED_STEP_MS = 8;
export const SPEED_UP_EVERY = 2;
export const SWIPE_THRESHOLD_PX = 18;
export const HIGH_SCORE_KEY = 'snake-high-score';

const KEY_DIRECTION_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

export function getRandomFood(snake: Cell[]): Cell {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const freeCells: Cell[] = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return { ...snake[0] };
  }

  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

export function getNextHead(head: Cell, direction: Direction): Cell {
  switch (direction) {
    case 'up':
      return { x: head.x, y: head.y - 1 };
    case 'down':
      return { x: head.x, y: head.y + 1 };
    case 'left':
      return { x: head.x - 1, y: head.y };
    case 'right':
      return { x: head.x + 1, y: head.y };
  }
}

export function isReverseDirection(current: Direction, next: Direction): boolean {
  return (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  );
}

export function createInitialState() {
  const snake = INITIAL_SNAKE.map((segment) => ({ ...segment }));

  return {
    snake,
    food: getRandomFood(snake),
    direction: INITIAL_DIRECTION,
    score: 0,
    status: 'running' as GameStatus,
  };
}

export function getSpeedByScore(score: number): number {
  const speedBoost = Math.floor(score / SPEED_UP_EVERY) * SPEED_STEP_MS;
  return Math.max(MIN_SPEED_MS, BASE_SPEED_MS - speedBoost);
}

export function getSpeedLevel(score: number): number {
  return Math.round((BASE_SPEED_MS - getSpeedByScore(score)) / SPEED_STEP_MS) + 1;
}

export function getSwipeDirection(start: Cell, end: Cell, threshold = SWIPE_THRESHOLD_PX): Direction | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (Math.max(absX, absY) < threshold) {
    return null;
  }

  if (absX > absY) {
    return deltaX > 0 ? 'right' : 'left';
  }

  return deltaY > 0 ? 'down' : 'up';
}

export function getDirectionFromKey(key: string): Direction | null {
  return KEY_DIRECTION_MAP[key] ?? null;
}

export function isPauseKey(key: string): boolean {
  return key === ' ' || key.toLowerCase() === 'p';
}

export function parseHighScore(value: string | null): number {
  const parsedHighScore = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedHighScore) ? 0 : parsedHighScore;
}

export function shouldPersistHighScore(score: number, highScore: number): boolean {
  return score > highScore;
}

export type AdvanceSnakeResult =
  | { type: 'gameover'; reason: 'wall' | 'self'; snake: Cell[] }
  | { type: 'move'; snake: Cell[] }
  | { type: 'eat'; snake: Cell[] };

export function advanceSnake(snake: Cell[], direction: Direction, food: Cell): AdvanceSnakeResult {
  const nextHead = getNextHead(snake[0], direction);
  const ateFood = nextHead.x === food.x && nextHead.y === food.y;
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);
  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= GRID_SIZE ||
    nextHead.y < 0 ||
    nextHead.y >= GRID_SIZE;

  if (hitWall) {
    return { type: 'gameover', reason: 'wall', snake };
  }

  const hitSelf = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitSelf) {
    return { type: 'gameover', reason: 'self', snake };
  }

  const nextSnake = [nextHead, ...snake];

  if (ateFood) {
    return { type: 'eat', snake: nextSnake };
  }

  nextSnake.pop();
  return { type: 'move', snake: nextSnake };
}
