import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Terminal, Cpu } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: "SYS.AUDIO_STREAM_01",
    artist: "AI_NODE_ALPHA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 2,
    title: "DATA_CORRUPTION_LULLABY",
    artist: "NEURAL_NET_BETA",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 3,
    title: "OVERRIDE_SEQUENCE",
    artist: "GHOST_IN_THE_MACHINE",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80"
  }
];

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

function SnakeGame({ onScoreChange }: { onScoreChange: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const snakeRef = useRef(INITIAL_SNAKE);
  const directionRef = useRef(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef(INITIAL_DIRECTION);
  const foodRef = useRef({ x: 5, y: 5 });
  const lastUpdateRef = useRef(0);
  const speedRef = useRef(80);
  const requestRef = useRef<number>();

  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    foodRef.current = newFood;
  }, []);

  const resetGame = () => {
    snakeRef.current = INITIAL_SNAKE;
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    onScoreChange(0);
    setGameOver(false);
    setIsPaused(false);
    speedRef.current = 80;
    generateFood();
  };

  const updateGame = useCallback((time: number) => {
    if (gameOver || isPaused) {
      requestRef.current = requestAnimationFrame(updateGame);
      return;
    }

    if (time - lastUpdateRef.current > speedRef.current) {
      const snake = [...snakeRef.current];
      const head = { ...snake[0] };
      const direction = directionRef.current;
      
      lastProcessedDirectionRef.current = direction;

      head.x += direction.x;
      head.y += direction.y;

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return;
      }

      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return;
      }

      snake.unshift(head);

      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange(newScore);
        speedRef.current = Math.max(30, 80 - Math.floor(newScore / 50) * 5);
        generateFood();
      } else {
        snake.pop();
      }

      snakeRef.current = snake;
      lastUpdateRef.current = time;
    }

    drawGame();
    requestRef.current = requestAnimationFrame(updateGame);
  }, [gameOver, isPaused, score, onScoreChange, generateFood]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(foodRef.current.x * CELL_SIZE + 2, foodRef.current.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    snakeRef.current.forEach((segment, index) => {
      const isHead = index === 0;
      const opacity = isHead ? 1 : Math.max(0.15, 1 - (index / snakeRef.current.length));
      
      ctx.shadowBlur = isHead ? 15 : 12 * opacity;
      ctx.shadowColor = isHead ? '#ffffff' : `rgba(0, 255, 255, ${opacity})`;
      ctx.fillStyle = isHead ? '#ffffff' : `rgba(0, 255, 255, ${opacity})`;
      
      ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      const dir = lastProcessedDirectionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateGame]);

  useEffect(() => {
    generateFood();
  }, [generateFood]);

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative p-2 bg-[#050505] border-2 border-[var(--color-cyan)] shadow-[0_0_20px_rgba(0,255,255,0.2)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="bg-[#050505]"
        />
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 border-2 border-[var(--color-magenta)]">
            <h2 className="text-4xl md:text-5xl font-[family-name:var(--font-pixel)] text-[var(--color-magenta)] mb-6 glitch-text" data-text="SYSTEM_FAILURE">SYSTEM_FAILURE</h2>
            <p className="text-2xl text-[var(--color-cyan)] mb-8 font-[family-name:var(--font-terminal)]">DATA_YIELD: {score}</p>
            <button 
              onClick={resetGame}
              className="px-6 py-3 bg-transparent border-2 border-[var(--color-cyan)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)] hover:text-black transition-all duration-100 flex items-center gap-3 font-[family-name:var(--font-pixel)] text-sm uppercase rgb-split"
            >
              <RefreshCw size={16} />
              <span>INIT_REBOOT</span>
            </button>
          </div>
        )}

        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 border-2 border-[var(--color-cyan)]">
            <h2 className="text-4xl font-[family-name:var(--font-pixel)] text-[var(--color-cyan)] glitch-text" data-text="SYS_HALT">SYS_HALT</h2>
          </div>
        )}
      </div>
      <div className="mt-6 text-[var(--color-cyan)] opacity-70 text-lg flex gap-6 font-[family-name:var(--font-terminal)]">
        <span className="flex items-center gap-2"><kbd className="bg-cyan-900/30 px-2 py-1 border border-[var(--color-cyan)] opacity-50">WASD</kbd> OVERRIDE_VECTOR</span>
        <span className="flex items-center gap-2"><kbd className="bg-cyan-900/30 px-2 py-1 border border-[var(--color-cyan)] opacity-50">SPACE</kbd> SUSPEND_PROCESS</span>
      </div>
    </div>
  );
}

function MusicPlayer({ 
  currentTrackIndex, 
  setCurrentTrackIndex, 
  isPlaying, 
  setIsPlaying 
}: { 
  currentTrackIndex: number, 
  setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>,
  isPlaying: boolean,
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  return (
    <div className="bg-[#050505] border-2 border-[var(--color-magenta)] p-6 w-full max-w-md mx-auto relative overflow-hidden shadow-[0_0_15px_rgba(255,0,255,0.2)]">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-magenta)]"></div>
      
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleTrackEnd}
        onLoadedMetadata={handleTimeUpdate}
      />
      
      <div className="flex items-center gap-6 mb-8">
        <div className="relative w-24 h-24 border-2 border-[var(--color-cyan)] shrink-0 group">
          <img 
            src={currentTrack.cover} 
            alt="Cover" 
            className={`w-full h-full object-cover grayscale contrast-150 ${isPlaying ? 'opacity-80' : 'opacity-40'}`} 
          />
          <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay"></div>
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--color-magenta)] animate-ping opacity-75"></div>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-[family-name:var(--font-pixel)] text-[var(--color-cyan)] truncate tracking-wide mb-2" title={currentTrack.title}>{currentTrack.title}</h3>
          <p className="text-[var(--color-magenta)] text-lg truncate font-[family-name:var(--font-terminal)]">{currentTrack.artist}</p>
          
          <div className="flex items-end gap-[2px] h-6 mt-4">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-[var(--color-cyan)] transition-all duration-75"
                style={{ 
                  height: isPlaying ? `${Math.max(10, Math.random() * 100)}%` : '10%',
                  opacity: isPlaying ? 1 : 0.3
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="group relative h-4 bg-gray-900 border border-cyan-900 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div 
            className="h-full bg-[var(--color-magenta)] pointer-events-none transition-all duration-75"
            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-lg text-[var(--color-cyan)] mt-2 font-[family-name:var(--font-terminal)]">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="text-[var(--color-cyan)] hover:text-[var(--color-magenta)] transition-colors">
            {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <div className="relative h-3 w-24 bg-gray-900 border border-cyan-900 flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setIsMuted(false);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div 
              className="h-full bg-[var(--color-cyan)] pointer-events-none"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={handlePrev} className="text-[var(--color-cyan)] hover:text-[var(--color-magenta)] transition-colors">
            <SkipBack size={28} />
          </button>
          <button 
            onClick={togglePlay} 
            className="w-14 h-14 flex items-center justify-center border-2 border-[var(--color-magenta)] text-[var(--color-magenta)] hover:bg-[var(--color-magenta)] hover:text-black transition-colors"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={handleNext} className="text-[var(--color-cyan)] hover:text-[var(--color-magenta)] transition-colors">
            <SkipForward size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('synthSnakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('synthSnakeHighScore', newScore.toString());
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-cyan)] font-[family-name:var(--font-terminal)] overflow-hidden flex flex-col relative screen-tear">
      {/* Glitch/Retro Overlays */}
      <div className="scanlines"></div>
      <div className="static-noise"></div>

      {/* Header */}
      <header className="w-full p-6 flex flex-col md:flex-row items-center justify-between border-b-2 border-[var(--color-magenta)] bg-[#050505] z-20 relative">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="p-2 bg-[#050505] border-2 border-[var(--color-cyan)]">
            <Terminal className="text-[var(--color-cyan)]" size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-pixel)] text-[var(--color-magenta)] glitch-text" data-text="SYS.SNAKE_PROTOCOL">
            SYS.SNAKE_PROTOCOL
          </h1>
        </div>
        
        <div className="flex items-center gap-8 bg-[#050505] px-6 py-3 border-2 border-[var(--color-cyan)]">
          <div className="flex flex-col items-end">
            <span className="text-sm text-[var(--color-magenta)] font-[family-name:var(--font-pixel)] mb-2">DATA_YIELD</span>
            <span className="text-4xl font-[family-name:var(--font-terminal)] text-[var(--color-cyan)] leading-none rgb-split">{score}</span>
          </div>
          <div className="h-12 w-0.5 bg-[var(--color-magenta)]"></div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-[var(--color-magenta)] font-[family-name:var(--font-pixel)] mb-2">PEAK_EXTRACTION</span>
            <span className="text-4xl font-[family-name:var(--font-terminal)] text-[var(--color-cyan)] leading-none opacity-70">{highScore}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 p-6 relative z-10">
        
        {/* Music Player Section */}
        <div className="w-full lg:w-auto flex flex-col gap-4 z-10 order-2 lg:order-1">
          <div className="flex items-center gap-3 mb-2 px-4">
            <div className="p-1 border border-[var(--color-magenta)]">
              <Cpu className="text-[var(--color-magenta)]" size={20} />
            </div>
            <h2 className="text-lg font-[family-name:var(--font-pixel)] text-[var(--color-magenta)]">AUDIO_STREAM</h2>
          </div>
          <MusicPlayer 
            currentTrackIndex={currentTrackIndex}
            setCurrentTrackIndex={setCurrentTrackIndex}
            isPlaying={isPlayingMusic}
            setIsPlaying={setIsPlayingMusic}
          />
        </div>

        {/* Game Section */}
        <div className="z-10 order-1 lg:order-2">
          <SnakeGame onScoreChange={handleScoreChange} />
        </div>
      </main>
    </div>
  );
}
