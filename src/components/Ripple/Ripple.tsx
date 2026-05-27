import React, { useState, useEffect } from 'react';
import './Ripple.css';
interface RippleCircle { x: number; y: number; size: number; id: number; }
export const Ripple: React.FC<{ color?: string; duration?: number }> = ({ color = 'currentColor', duration = 600 }) => {
  const [ripples, setRipples] = useState<RippleCircle[]>([]);
  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const c = e.currentTarget.getBoundingClientRect();
    const size = Math.max(c.width, c.height) * 2;
    setRipples(p => [...p, { x: e.clientX - c.left - size / 2, y: e.clientY - c.top - size / 2, size, id: Date.now() }]);
  };
  useEffect(() => {
    if (!ripples.length) return;
    const t = setTimeout(() => setRipples(p => p.slice(1)), duration);
    return () => clearTimeout(t);
  }, [ripples, duration]);
  return (
    <div className="md-ripple" onMouseDown={addRipple}>
      {ripples.map(r => <span key={r.id} className="md-ripple__circle" style={{ top: r.y, left: r.x, width: r.size, height: r.size, backgroundColor: color, animationDuration: `${duration}ms` }} />)}
    </div>
  );
};
