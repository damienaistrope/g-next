import React, { useState, useEffect, useRef, useId } from 'react';
import { motion } from 'motion/react';
import './Progress.css';
interface ProgressProps { value?: number; indeterminate?: boolean; variant?: 'standard'|'thick'; }
export const LinearProgress: React.FC<ProgressProps> = ({ value = 0, indeterminate = false, variant = 'standard' }) => (
  <div className={`md-linear-progress md-linear-progress--${variant}`}>
    <div className="md-linear-progress__track" />
    {!indeterminate && <motion.div className="md-linear-progress__bar" initial={false} animate={{ width: `${value*100}%` }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} />}
    {indeterminate && <>
      <motion.div className="md-linear-progress__bar" animate={{ left: ['-35%','100%'], width: ['35%','35%'] }} transition={{ repeat: Infinity, duration: 2, ease: [0.65,0.815,0.735,0.395] }} />
      <motion.div className="md-linear-progress__bar" animate={{ left: ['-100%','100%'], width: ['100%','100%'] }} transition={{ repeat: Infinity, duration: 2, delay: 1.15 }} />
    </>}
  </div>
);
export const CircularProgress: React.FC<ProgressProps> = ({ value = 0, indeterminate = false, variant = 'standard' }) => {
  const [pathLength, setPathLength] = useState(0);
  const ref = useRef<SVGPathElement>(null);
  const sw = variant === 'thick' ? 8 : 4;
  const d = `M 24 6 A 18 18 0 1 1 24 42 A 18 18 0 1 1 24 6`;
  useEffect(() => { if (ref.current) setPathLength(ref.current.getTotalLength()); }, [variant]);
  return (
    <motion.div className={`md-circular-progress md-circular-progress--${variant}`} animate={indeterminate ? { rotate: 360 } : { rotate: 0 }} transition={indeterminate ? { repeat: Infinity, duration: 2, ease: 'linear' } : {}}>
      <svg className="md-circular-progress__svg" viewBox="0 0 48 48">
        <path className="md-circular-progress__track" d={d} fill="none" strokeWidth={sw} />
        <motion.path ref={ref} className="md-circular-progress__bar" d={d} fill="none" strokeWidth={sw} strokeLinecap="round"
          initial={false} animate={indeterminate ? { strokeDasharray: [`1 ${pathLength}`,`${pathLength*.75} ${pathLength}`], strokeDashoffset: [0,-pathLength] } : { strokeDasharray: `${pathLength} ${pathLength}`, strokeDashoffset: pathLength*(1-value) }}
          transition={indeterminate ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }} />
      </svg>
    </motion.div>
  );
};
