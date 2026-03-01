import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';
import { BASE_SPEED_MS, HIGH_SCORE_KEY } from '../src/game';

const FOOD_AHEAD_RANDOM = 0.532;

function mockRandomSequence(...values: number[]) {
  const randomSpy = vi.spyOn(Math, 'random');

  if (values.length === 0) {
    randomSpy.mockReturnValue(0);
    return randomSpy;
  }

  values.forEach((value) => {
    randomSpy.mockReturnValueOnce(value);
  });
  randomSpy.mockReturnValue(values[values.length - 1]);
  return randomSpy;
}

function renderApp(options?: { highScore?: number; randomValues?: number[] }) {
  if (typeof options?.highScore === 'number') {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(options.highScore));
  }

  mockRandomSequence(...(options?.randomValues ?? [0]));
  render(<App />);
}

function advanceGame(ms = BASE_SPEED_MS) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function getHeadCell() {
  return screen.getByTestId('snake-head');
}

function getValue(testId: string) {
  return screen.getByTestId(testId).textContent;
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders the initial scoreboard and controls', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: '贪吃蛇' })).toBeInTheDocument();
    expect(getValue('score-value')).toBe('0');
    expect(getValue('high-score-value')).toBe('0');
    expect(getValue('speed-value')).toBe('1');
    expect(screen.getByRole('button', { name: '游戏说明' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暂停' })).toBeEnabled();
    expect(screen.queryByRole('dialog', { name: '游戏说明' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '这一局结束了' })).not.toBeInTheDocument();
  });

  it('opens help while running, pauses the game, and resumes on close', () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: '游戏说明' }));
    expect(screen.getByRole('dialog', { name: '游戏说明' })).toBeInTheDocument();
    expect(screen.getByText('游戏已暂停，再按一次空格、P 或点击继续。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(screen.queryByRole('dialog', { name: '游戏说明' })).not.toBeInTheDocument();
    expect(screen.queryByText('游戏已暂停，再按一次空格、P 或点击继续。')).not.toBeInTheDocument();

    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '9');
    expect(getHeadCell()).toHaveAttribute('data-y', '8');
  });

  it('keeps the game paused when help opens from a non-running state', () => {
    renderApp();
    const board = screen.getByLabelText('游戏棋盘');

    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    fireEvent.click(screen.getByRole('button', { name: '游戏说明' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    fireEvent.touchStart(board, { changedTouches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(board, { changedTouches: [{ clientX: 100, clientY: 20 }] });

    expect(screen.getByText('游戏已暂停，再按一次空格、P 或点击继续。')).toBeInTheDocument();
    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
  });

  it('closes help with Escape instead of exiting the current game', () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: '游戏说明' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: '游戏说明' })).not.toBeInTheDocument();
    expect(screen.queryByText('已退出游戏，按 Enter 重新开始。')).not.toBeInTheDocument();
  });

  it('closes help when clicking the backdrop', () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: '游戏说明' }));
    fireEvent.click(screen.getByRole('presentation'));

    expect(screen.queryByRole('dialog', { name: '游戏说明' })).not.toBeInTheDocument();
  });

  it('restarts the game with Enter while help is open', () => {
    renderApp({ randomValues: [FOOD_AHEAD_RANDOM, 0, 0] });

    advanceGame();
    expect(getValue('score-value')).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: '游戏说明' }));
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.queryByRole('dialog', { name: '游戏说明' })).not.toBeInTheDocument();
    expect(getValue('score-value')).toBe('0');
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
  });

  it('supports pause and resume from keyboard shortcuts', () => {
    renderApp();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByText('游戏已暂停，再按一次空格、P 或点击继续。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'p' });
    expect(screen.queryByText('游戏已暂停，再按一次空格、P 或点击继续。')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'P' });
    expect(screen.getByText('游戏已暂停，再按一次空格、P 或点击继续。')).toBeInTheDocument();
  });

  it('ignores unrelated keys and blocks direction changes when paused', () => {
    renderApp();

    fireEvent.keyDown(window, { key: 'x' });
    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: ' ' });

    expect(screen.queryByText('游戏已暂停，再按一次空格、P 或点击继续。')).not.toBeInTheDocument();
    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '9');
    expect(getHeadCell()).toHaveAttribute('data-y', '8');
  });

  it('changes direction from keyboard without allowing immediate reversal', () => {
    renderApp();

    fireEvent.keyDown(window, { key: 'ArrowUp' });
    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
    expect(getHeadCell()).toHaveAttribute('data-y', '7');

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
    expect(getHeadCell()).toHaveAttribute('data-y', '6');
  });

  it('changes direction from swipe gestures and ignores invalid swipe endings', () => {
    renderApp();
    const board = screen.getByLabelText('游戏棋盘');

    fireEvent.touchEnd(board, { changedTouches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchStart(board, { changedTouches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(board, { changedTouches: [{ clientX: 108, clientY: 108 }] });
    fireEvent.touchStart(board, { changedTouches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(board, { changedTouches: [{ clientX: 100, clientY: 20 }] });
    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
    expect(getHeadCell()).toHaveAttribute('data-y', '7');

    fireEvent.touchStart(board, { changedTouches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(board, { changedTouches: [{ clientX: 100, clientY: 180 }] });

    advanceGame();
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
    expect(getHeadCell()).toHaveAttribute('data-y', '6');
  });

  it('updates score, speed, snake length, and food position after eating', () => {
    renderApp({ randomValues: [FOOD_AHEAD_RANDOM, 0] });

    expect(screen.getByTestId('food-cell')).toHaveAttribute('data-x', '9');
    advanceGame();

    expect(getValue('score-value')).toBe('1');
    expect(getValue('speed-value')).toBe('1');
    expect(document.querySelectorAll('.cell--snake')).toHaveLength(4);
    expect(screen.getByTestId('food-cell')).toHaveAttribute('data-x', '0');
    expect(screen.getByTestId('food-cell')).toHaveAttribute('data-y', '0');
  });

  it('reads and updates the high score from localStorage', () => {
    renderApp({ highScore: 1, randomValues: [FOOD_AHEAD_RANDOM, FOOD_AHEAD_RANDOM] });

    expect(getValue('high-score-value')).toBe('1');
    advanceGame();
    expect(getValue('high-score-value')).toBe('1');
    advanceGame();

    expect(getValue('score-value')).toBe('2');
    expect(getValue('high-score-value')).toBe('2');
    expect(getValue('speed-value')).toBe('2');
    expect(window.localStorage.getItem(HIGH_SCORE_KEY)).toBe('2');
  });

  it('shows game over state and blocks pause shortcuts when the snake hits a wall', () => {
    renderApp();

    advanceGame(BASE_SPEED_MS * 8);
    expect(screen.getByRole('dialog', { name: '这一局结束了' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暂停' })).toBeDisabled();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByRole('dialog', { name: '这一局结束了' })).toBeInTheDocument();
  });

  it('restarts from the game over dialog button', () => {
    renderApp();

    advanceGame(BASE_SPEED_MS * 8);
    fireEvent.click(screen.getByRole('button', { name: '再来一局' }));

    expect(screen.queryByRole('dialog', { name: '这一局结束了' })).not.toBeInTheDocument();
    expect(getValue('score-value')).toBe('0');
    expect(getHeadCell()).toHaveAttribute('data-x', '8');
  });

  it('exits with Escape, keeps exited state on pause, and restarts from keyboard and button', () => {
    renderApp();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('已退出游戏，按 Enter 重新开始。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '暂停' })).toBeDisabled();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByText('已退出游戏，按 Enter 重新开始。')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.queryByText('已退出游戏，按 Enter 重新开始。')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: '重新开始' }));
    expect(screen.queryByText('已退出游戏，按 Enter 重新开始。')).not.toBeInTheDocument();
  });
});
