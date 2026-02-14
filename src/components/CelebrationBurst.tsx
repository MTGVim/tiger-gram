import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type CelebrationBurstProps = {
  trigger: number;
};

type Piece = {
  left: number;
  top: number;
  delay: number;
  duration: number;
  dx: number;
  dy: number;
  rotate: number;
  scale: number;
  shape: 'bar' | 'dot';
  color: string;
};

const COLORS = ['#38bdf8', '#34d399', '#f59e0b', '#f43f5e', '#a78bfa', '#f97316', '#fde047', '#22d3ee'];

export function CelebrationBurst({ trigger }: CelebrationBurstProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger <= 0) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, [trigger]);

  const pieces = useMemo<Piece[]>(
    () => {
      const bursts = [
        { left: 50, top: 42, delayOffset: 0 },
        { left: 28, top: 48, delayOffset: 0.1 },
        { left: 72, top: 48, delayOffset: 0.14 }
      ];
      const particlesPerBurst = 42;
      const all: Piece[] = [];

      bursts.forEach((burst, burstIndex) => {
        for (let i = 0; i < particlesPerBurst; i += 1) {
          const angleDeg = (i / particlesPerBurst) * 360 + ((burstIndex * 19) % 30);
          const angle = (angleDeg * Math.PI) / 180;
          const speed = 120 + ((i * 37 + burstIndex * 43) % 170);
          const dx = Math.cos(angle) * speed;
          const dy = Math.sin(angle) * speed - 50;
          all.push({
            left: burst.left,
            top: burst.top,
            delay: burst.delayOffset + (((i * 11) % 110) / 1000),
            duration: 0.9 + ((i * 17 + burstIndex * 13) % 85) / 100,
            dx,
            dy,
            rotate: -300 + ((i * 47) % 600),
            scale: 0.75 + ((i * 23) % 60) / 100,
            shape: (i + burstIndex) % 4 === 0 ? 'dot' : 'bar',
            color: COLORS[(i + burstIndex) % COLORS.length]
          });
        }
      });

      return all;
    },
    []
  );

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={`${trigger}-${index}`}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              top: `${piece.top}%`,
              '--delay': `${piece.delay}s`,
              '--duration': `${piece.duration}s`,
              '--dx': `${piece.dx}px`,
              '--dy': `${piece.dy}px`,
              '--rotate': `${piece.rotate}deg`,
              '--scale': piece.scale,
              '--color': piece.color
            } as CSSProperties
          }
          data-shape={piece.shape}
        />
      ))}
    </div>
  );
}
