import { describe, expect, it } from 'vitest';

import { getSpeedByScore, getSwipeDirection } from './App';

describe('getSpeedByScore', () => {
  it('keeps the initial speed before reaching the next threshold', () => {
    expect(getSpeedByScore(0)).toBe(176);
    expect(getSpeedByScore(1)).toBe(176);
  });

  it('speeds up every two points', () => {
    expect(getSpeedByScore(2)).toBe(168);
    expect(getSpeedByScore(4)).toBe(160);
  });

  it('caps the speed at the configured minimum', () => {
    expect(getSpeedByScore(100)).toBe(92);
  });
});

describe('getSwipeDirection', () => {
  it('returns null for short swipes', () => {
    expect(getSwipeDirection({ x: 10, y: 10 }, { x: 20, y: 20 })).toBeNull();
  });

  it('detects horizontal swipes by dominant axis', () => {
    expect(getSwipeDirection({ x: 10, y: 10 }, { x: 60, y: 20 })).toBe('right');
    expect(getSwipeDirection({ x: 60, y: 10 }, { x: 10, y: 20 })).toBe('left');
  });

  it('detects vertical swipes by dominant axis', () => {
    expect(getSwipeDirection({ x: 10, y: 10 }, { x: 20, y: 70 })).toBe('down');
    expect(getSwipeDirection({ x: 10, y: 70 }, { x: 20, y: 10 })).toBe('up');
  });
});
