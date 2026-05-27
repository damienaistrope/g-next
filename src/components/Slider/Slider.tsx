import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Slider.css';
interface SliderProps { type?: 'standard'|'centered'|'range'; size?: 'xsmall'|'small'|'medium'|'large'|'xlarge'; min?: number; max?: number; step?: number; value?: number | [number,number]; onChange?: (v: any) => void; disabled?: boolean; label?: string; className?: string; }
export const Slider: React.FC<SliderProps> = ({ type = 'standard', size = 'medium', min = 0, max = 100, step = 1, value: controlled, onChange, disabled = false, label, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState<number|[number,number]>(controlled ?? (type === 'range' ? [min, max] : min));
  const [dragging, setDragging] = useState<'none'|'value'|'min'|'max'>('none');
  const current = controlled !== undefined ? controlled : internal;
  const getVal = useCallback((cx: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
    return Math.round((min + pct * (max - min)) / step) * step;
  }, [min, max, step]);
  const update = (newVal: number, target: 'value'|'min'|'max') => {
    let next: number|[number,number];
    if (type === 'range') {
      const [vMin, vMax] = current as [number,number];
      next = target === 'min' ? [Math.min(newVal, vMax), vMax] : [vMin, Math.max(newVal, vMin)];
    } else { next = newVal; }
    setInternal(next); onChange?.(next);
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const val = getVal(e.clientX);
    let target: 'value'|'min'|'max' = 'value';
    if (type === 'range') { const [vMin, vMax] = current as [number,number]; target = Math.abs(val - vMin) < Math.abs(val - vMax) ? 'min' : 'max'; }
    setDragging(target); update(val, target); (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  useEffect(() => {
    if (dragging === 'none') return;
    const move = (e: PointerEvent) => update(getVal(e.clientX), dragging as any);
    const up = () => setDragging('none');
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [dragging, getVal]);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const val = Array.isArray(current) ? current[0] : current as number;
  const val2 = Array.isArray(current) ? current[1] : undefined;
  const p = pct(val); const p2 = val2 !== undefined ? pct(val2) : 100;
  return (
    <div className={`md-slider md-slider--horizontal md-slider--size-${size} ${disabled ? 'md-slider--disabled' : ''} ${className}`}>
      {label && <label className="md-slider__label">{label}</label>}
      <div ref={containerRef} className="md-slider__container" onPointerDown={handlePointerDown}>
        {type === 'range' ? <>
          <div className="md-slider__track-inactive round-left" style={{ left: 0, width: `calc(${p}% - 4px)` }} />
          <div className="md-slider__track-active" style={{ left: `calc(${p}% + 4px)`, width: `calc(${p2 - p}% - 8px)` }} />
          <div className="md-slider__track-inactive round-right" style={{ left: `calc(${p2}% + 4px)`, width: `calc(${100-p2}% - 4px)` }} />
          <div className="md-slider__thumb" style={{ left: `${p}%` }} />
          <div className="md-slider__thumb" style={{ left: `${p2}%` }} />
        </> : <>
          <div className="md-slider__track-active round-left" style={{ left: 0, width: `calc(${p}% - 4px)` }} />
          <div className="md-slider__track-inactive round-right" style={{ left: `calc(${p}% + 4px)`, width: `calc(${100-p}% - 4px)` }} />
          <div className="md-slider__thumb" style={{ left: `${p}%` }} />
        </>}
        <div className="md-slider__input-area" />
      </div>
    </div>
  );
};
