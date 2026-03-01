import type { TouchEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type Cell = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';
type GameStatus = 'running' | 'paused' | 'gameover' | 'exited';

const GRID_SIZE = 16;
const INITIAL_SNAKE: Cell[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
];
const INITIAL_DIRECTION: Direction = 'right';
const BASE_SPEED_MS = 176;
const MIN_SPEED_MS = 92;
const SPEED_STEP_MS = 8;
const SPEED_UP_EVERY = 2;
const SWIPE_THRESHOLD_PX = 18;
const HIGH_SCORE_KEY = 'snake-high-score';

function getRandomFood(snake: Cell[]): Cell {
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
    return snake[0];
  }

  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

function getNextHead(head: Cell, direction: Direction): Cell {
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

function isReverseDirection(current: Direction, next: Direction): boolean {
  return (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  );
}

function createInitialState() {
  return {
    snake: INITIAL_SNAKE,
    food: getRandomFood(INITIAL_SNAKE),
    direction: INITIAL_DIRECTION,
    score: 0,
    status: 'running' as GameStatus,
  };
}

export function getSpeedByScore(score: number): number {
  const speedBoost = Math.floor(score / SPEED_UP_EVERY) * SPEED_STEP_MS;
  return Math.max(MIN_SPEED_MS, BASE_SPEED_MS - speedBoost);
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

function App() {
  const initialState = useMemo(() => createInitialState(), []);
  const [snake, setSnake] = useState<Cell[]>(initialState.snake);
  const [food, setFood] = useState<Cell>(initialState.food);
  const [direction, setDirection] = useState<Direction>(initialState.direction);
  const [score, setScore] = useState(initialState.score);
  const [status, setStatus] = useState<GameStatus>(initialState.status);
  const [highScore, setHighScore] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const touchStartRef = useRef<Cell | null>(null);
  const resumeStatusRef = useRef<GameStatus | null>(null);
  const currentSpeed = getSpeedByScore(score);

  function resetGame(nextStatus: GameStatus = 'running') {
    const nextState = createInitialState();
    setSnake(nextState.snake);
    setFood(nextState.food);
    setDirection(nextState.direction);
    directionRef.current = nextState.direction;
    setScore(nextState.score);
    setStatus(nextStatus);
  }

  function togglePause() {
    setStatus((currentStatus) => {
      if (currentStatus === 'running') {
        return 'paused';
      }

      if (currentStatus === 'paused') {
        return 'running';
      }

      return currentStatus;
    });
  }

  function updateDirection(nextDirection: Direction) {
    if (status !== 'running') {
      return;
    }

    if (!isReverseDirection(directionRef.current, nextDirection)) {
      setDirection(nextDirection);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchStart = touchStartRef.current;
    if (!touchStart) {
      return;
    }

    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    const swipeDirection = getSwipeDirection(touchStart, { x: touch.clientX, y: touch.clientY });
    if (swipeDirection) {
      updateDirection(swipeDirection);
    }
  }

  function openHelpModal() {
    if (status === 'running') {
      resumeStatusRef.current = 'running';
      setStatus('paused');
    } else {
      resumeStatusRef.current = null;
    }

    setIsHelpOpen(true);
  }

  function closeHelpModal() {
    setIsHelpOpen(false);

    if (resumeStatusRef.current === 'running' && status === 'paused') {
      setStatus('running');
    }

    resumeStatusRef.current = null;
  }

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    const savedHighScore = window.localStorage.getItem(HIGH_SCORE_KEY);
    if (!savedHighScore) {
      return;
    }

    const parsedHighScore = Number.parseInt(savedHighScore, 10);
    if (!Number.isNaN(parsedHighScore)) {
      setHighScore(parsedHighScore);
    }
  }, []);

  useEffect(() => {
    if (score <= highScore) {
      return;
    }

    setHighScore(score);
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }, [highScore, score]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isHelpOpen) {
          closeHelpModal();
          return;
        }

        setStatus('exited');
        return;
      }

      if (event.key === 'Enter') {
        if (isHelpOpen) {
          closeHelpModal();
        }
        resetGame();
        return;
      }

      if ((event.key === ' ' || event.key.toLowerCase() === 'p') && status !== 'gameover') {
        event.preventDefault();
        togglePause();
        return;
      }

      const keyMap: Record<string, Direction> = {
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

      const nextDirection = keyMap[event.key];
      if (!nextDirection || status !== 'running') {
        return;
      }

      event.preventDefault();
      updateDirection(nextDirection);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, status]);

  useEffect(() => {
    if (status !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSnake((currentSnake) => {
        const nextHead = getNextHead(currentSnake[0], directionRef.current);
        const ateFood = nextHead.x === food.x && nextHead.y === food.y;
        const bodyToCheck = ateFood ? currentSnake : currentSnake.slice(0, -1);
        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= GRID_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= GRID_SIZE;

        const hitSelf = bodyToCheck.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
        );

        if (hitWall || hitSelf) {
          setStatus('gameover');
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];

        if (ateFood) {
          setScore((currentScore) => currentScore + 1);
          setFood(getRandomFood(nextSnake));
          return nextSnake;
        }

        nextSnake.pop();
        return nextSnake;
      });
    }, currentSpeed);

    return () => window.clearInterval(timer);
  }, [currentSpeed, food, status]);

  const cellMap = useMemo(() => {
    const map = new Map<string, 'snake' | 'food'>();

    snake.forEach((segment) => {
      map.set(`${segment.x},${segment.y}`, 'snake');
    });

    map.set(`${food.x},${food.y}`, 'food');
    return map;
  }, [food, snake]);

  return (
    <main className="app">
      <section className={`panel panel--${status}`}>
        <div className="panel__topbar">
          <div className="title-block">
            <h1>贪吃蛇</h1>
          </div>
          <button className="info-button" type="button" onClick={openHelpModal}>
            游戏说明
          </button>
        </div>

        <div className="panel__dashboard">
          <div className="score-panel">
            <div className="score-card score-card--primary">
              <span>分数</span>
              <strong>{score}</strong>
            </div>
            <div className="score-card score-card--secondary">
              <span>最高分</span>
              <strong>{highScore}</strong>
            </div>
            <div className="score-card score-card--secondary">
              <span>速度</span>
              <strong>{Math.round((BASE_SPEED_MS - currentSpeed) / SPEED_STEP_MS) + 1}</strong>
            </div>
          </div>

          <div className="controls">
            <button
              className="control-button"
              type="button"
              onClick={togglePause}
              disabled={status === 'gameover' || status === 'exited'}
            >
              {status === 'paused' ? '继续' : '暂停'}
            </button>
            <button className="control-button control-button--ghost" type="button" onClick={() => resetGame()}>
              重新开始
            </button>
          </div>
        </div>

        <div
          className={`board board--${status}`}
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const kind = cellMap.get(`${x},${y}`);
            const isHead = snake[0].x === x && snake[0].y === y;

            return (
              <div
                key={`${x}-${y}`}
                className={[
                  'cell',
                  kind === 'snake' ? 'cell--snake' : '',
                  kind === 'food' ? 'cell--food' : '',
                  isHead ? 'cell--head' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            );
          })}
        </div>

        <div className="panel__footer">
          {status === 'paused' && <p className="status">游戏已暂停，再按一次空格、P 或点击继续。</p>}
          {status === 'exited' && <p className="status">已退出游戏，按 Enter 重新开始。</p>}
        </div>

        {isHelpOpen && (
          <div className="modal-backdrop" role="presentation" onClick={closeHelpModal}>
            <div
              aria-labelledby="help-modal-title"
              aria-modal="true"
              className="modal"
              role="dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal__header">
                <div>
                  <p className="modal__eyebrow">Game Guide</p>
                  <h2 id="help-modal-title">游戏说明</h2>
                </div>
                <button className="modal__close" type="button" onClick={closeHelpModal}>
                  关闭
                </button>
              </div>
              <div className="modal__content">
                <p>方向键、WASD 或在棋盘上滑动控制移动。</p>
                <p>空格或 P 暂停，按 ESC 退出当前游戏，按 Enter 重新开始。</p>
                <p>吃到食物会加分并逐渐提速，尽量刷新最高分。</p>
              </div>
            </div>
          </div>
        )}

        {status === 'gameover' && (
          <div className="modal-backdrop" role="presentation">
            <div aria-labelledby="gameover-modal-title" aria-modal="true" className="modal modal--danger" role="dialog">
              <div className="modal__header">
                <div>
                  <p className="modal__eyebrow">Game Over</p>
                  <h2 id="gameover-modal-title">这一局结束了</h2>
                </div>
              </div>
              <div className="modal__content">
                <p>本局得分：{score}</p>
                <p>当前最高分：{highScore}</p>
                <p>按 Enter 再来一局，或者点击下面按钮立即重开。</p>
              </div>
              <div className="modal__actions">
                <button className="control-button" type="button" onClick={() => resetGame()}>
                  再来一局
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
