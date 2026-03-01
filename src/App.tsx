import type { TouchEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GRID_SIZE,
  HIGH_SCORE_KEY,
  INITIAL_DIRECTION,
  advanceSnake,
  createInitialState,
  getDirectionFromKey,
  getRandomFood,
  getSpeedLevel,
  getSpeedByScore,
  getSwipeDirection,
  isPauseKey,
  isReverseDirection,
  parseHighScore,
  shouldPersistHighScore,
} from './game';
import type { Cell, Direction, GameStatus } from './game';

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
    setHighScore(parseHighScore(window.localStorage.getItem(HIGH_SCORE_KEY)));
  }, []);

  useEffect(() => {
    if (!shouldPersistHighScore(score, highScore)) {
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

      if (isPauseKey(event.key) && status !== 'gameover') {
        event.preventDefault();
        togglePause();
        return;
      }

      const nextDirection = getDirectionFromKey(event.key);
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
        const result = advanceSnake(currentSnake, directionRef.current, food);

        if (result.type === 'gameover') {
          setStatus('gameover');
          return currentSnake;
        }

        if (result.type === 'eat') {
          setScore((currentScore) => currentScore + 1);
          setFood(getRandomFood(result.snake));
          return result.snake;
        }

        return result.snake;
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
                <strong data-testid="score-value">{score}</strong>
              </div>
              <div className="score-card score-card--secondary">
                <span>最高分</span>
                <strong data-testid="high-score-value">{highScore}</strong>
              </div>
              <div className="score-card score-card--secondary">
                <span>速度</span>
                <strong data-testid="speed-value">{getSpeedLevel(score)}</strong>
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
          aria-label="游戏棋盘"
          className={`board board--${status}`}
          role="grid"
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
                data-testid={kind === 'food' ? 'food-cell' : isHead ? 'snake-head' : undefined}
                data-x={x}
                data-y={y}
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
