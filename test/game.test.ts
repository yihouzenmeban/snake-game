import { describe, expect, it, vi } from 'vitest';

import {
  BASE_SPEED_MS,
  INITIAL_DIRECTION,
  INITIAL_SNAKE,
  MIN_SPEED_MS,
  advanceSnake,
  createInitialState,
  getDirectionFromKey,
  getNextHead,
  getRandomFood,
  getSpeedByScore,
  getSpeedLevel,
  getSwipeDirection,
  isPauseKey,
  isReverseDirection,
  parseHighScore,
  shouldPersistHighScore,
} from '../src/game';

describe('getSpeedByScore', () => {
  it('keeps the initial speed before reaching the next threshold', () => {
    expect(getSpeedByScore(0)).toBe(BASE_SPEED_MS);
    expect(getSpeedByScore(1)).toBe(BASE_SPEED_MS);
  });

  it('speeds up every two points and caps at the minimum speed', () => {
    expect(getSpeedByScore(2)).toBe(168);
    expect(getSpeedByScore(4)).toBe(160);
    expect(getSpeedByScore(100)).toBe(MIN_SPEED_MS);
  });
});

describe('getSpeedLevel', () => {
  it('returns the display level for the current score', () => {
    expect(getSpeedLevel(0)).toBe(1);
    expect(getSpeedLevel(2)).toBe(2);
  });
});

describe('getSwipeDirection', () => {
  it('returns null for short swipes', () => {
    expect(getSwipeDirection({ x: 10, y: 10 }, { x: 20, y: 20 })).toBeNull();
  });

  it('detects horizontal and vertical swipes by dominant axis', () => {
    expect(getSwipeDirection({ x: 10, y: 10 }, { x: 60, y: 20 })).toBe('right');
    expect(getSwipeDirection({ x: 60, y: 10 }, { x: 10, y: 20 })).toBe('left');
    expect(getSwipeDirection({ x: 10, y: 10 }, { x: 20, y: 70 })).toBe('down');
    expect(getSwipeDirection({ x: 10, y: 70 }, { x: 20, y: 10 })).toBe('up');
  });

  it('respects a custom swipe threshold', () => {
    expect(getSwipeDirection({ x: 0, y: 0 }, { x: 12, y: 0 }, 15)).toBeNull();
    expect(getSwipeDirection({ x: 0, y: 0 }, { x: 16, y: 0 }, 15)).toBe('right');
  });
});

describe('getDirectionFromKey', () => {
  it('maps keyboard input to directions', () => {
    expect(getDirectionFromKey('ArrowUp')).toBe('up');
    expect(getDirectionFromKey('a')).toBe('left');
    expect(getDirectionFromKey('D')).toBe('right');
    expect(getDirectionFromKey('x')).toBeNull();
  });
});

describe('isPauseKey', () => {
  it('recognizes pause shortcuts', () => {
    expect(isPauseKey(' ')).toBe(true);
    expect(isPauseKey('p')).toBe(true);
    expect(isPauseKey('P')).toBe(true);
    expect(isPauseKey('x')).toBe(false);
  });
});

describe('parseHighScore', () => {
  it('parses stored scores and falls back to zero for invalid values', () => {
    expect(parseHighScore('12')).toBe(12);
    expect(parseHighScore('0')).toBe(0);
    expect(parseHighScore(null)).toBe(0);
    expect(parseHighScore('oops')).toBe(0);
  });
});

describe('shouldPersistHighScore', () => {
  it('returns true only when the new score is greater than the current high score', () => {
    expect(shouldPersistHighScore(5, 4)).toBe(true);
    expect(shouldPersistHighScore(4, 4)).toBe(false);
  });
});

describe('getNextHead', () => {
  it('returns the next head for each direction', () => {
    expect(getNextHead({ x: 4, y: 4 }, 'up')).toEqual({ x: 4, y: 3 });
    expect(getNextHead({ x: 4, y: 4 }, 'down')).toEqual({ x: 4, y: 5 });
    expect(getNextHead({ x: 4, y: 4 }, 'left')).toEqual({ x: 3, y: 4 });
    expect(getNextHead({ x: 4, y: 4 }, 'right')).toEqual({ x: 5, y: 4 });
  });
});

describe('isReverseDirection', () => {
  it('returns true only for reverse pairs', () => {
    expect(isReverseDirection('up', 'down')).toBe(true);
    expect(isReverseDirection('down', 'up')).toBe(true);
    expect(isReverseDirection('left', 'right')).toBe(true);
    expect(isReverseDirection('right', 'left')).toBe(true);
    expect(isReverseDirection('up', 'left')).toBe(false);
    expect(isReverseDirection('right', 'right')).toBe(false);
  });
});

describe('getRandomFood', () => {
  it('returns a free cell within the grid', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getRandomFood(INITIAL_SNAKE)).toEqual({ x: 0, y: 0 });
  });

  it('returns the only remaining free cell when one is left', () => {
    const almostFullSnake = [];

    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        if (x !== 15 || y !== 15) {
          almostFullSnake.push({ x, y });
        }
      }
    }

    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getRandomFood(almostFullSnake)).toEqual({ x: 15, y: 15 });
  });

  it('returns the head when there are no free cells', () => {
    const fullSnake = [];

    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        fullSnake.push({ x, y });
      }
    }

    expect(getRandomFood(fullSnake)).toEqual(fullSnake[0]);
  });
});

describe('createInitialState', () => {
  it('creates a running game with the default snake and a valid food cell', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const state = createInitialState();

    expect(state.snake).toEqual(INITIAL_SNAKE);
    expect(state.snake).not.toBe(INITIAL_SNAKE);
    expect(state.food).toEqual({ x: 0, y: 0 });
    expect(state.direction).toBe(INITIAL_DIRECTION);
    expect(state.score).toBe(0);
    expect(state.status).toBe('running');
  });
});

describe('advanceSnake', () => {
  it('moves the snake forward when no food is eaten', () => {
    const result = advanceSnake(INITIAL_SNAKE, 'right', { x: 0, y: 0 });

    expect(result).toEqual({
      type: 'move',
      snake: [
        { x: 9, y: 8 },
        { x: 8, y: 8 },
        { x: 7, y: 8 },
      ],
    });
  });

  it('grows the snake when food is eaten', () => {
    const result = advanceSnake(INITIAL_SNAKE, 'right', { x: 9, y: 8 });

    expect(result).toEqual({
      type: 'eat',
      snake: [
        { x: 9, y: 8 },
        { x: 8, y: 8 },
        { x: 7, y: 8 },
        { x: 6, y: 8 },
      ],
    });
  });

  it('returns a wall collision when the next move leaves the board', () => {
    const result = advanceSnake([{ x: 15, y: 0 }], 'right', { x: 0, y: 0 });

    expect(result).toEqual({
      type: 'gameover',
      reason: 'wall',
      snake: [{ x: 15, y: 0 }],
    });
  });

  it('returns a self collision when the next move hits the body', () => {
    const snake = [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
    ];

    const result = advanceSnake(snake, 'down', { x: 0, y: 0 });

    expect(result).toEqual({
      type: 'gameover',
      reason: 'self',
      snake,
    });
  });
});
