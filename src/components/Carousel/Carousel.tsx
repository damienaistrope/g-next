import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Icon } from '../Icon/Icon';
import './Carousel.css';
interface CarouselItemData { image: string; title: string; subtitle?: string; }
interface CarouselProps { items: CarouselItemData[]; variant?: 'multi-browse'|'hero'|'uncontained'|'full-screen'; title?: string; height?: number; }
const GAP = 8;
export const Carousel: React.FC<CarouselProps> = ({ items, variant = 'multi-browse', title, height }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [outerW, setOuterW] = useState(0);
  useEffect(() => {
    const el = outerRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setOuterW(e.contentRect.width));
    ro.observe(el); setOuterW(el.clientWidth); return () => ro.disconnect();
  }, []);
  const updateArrows = useCallback(() => {
    const el = trackRef.current; if (!el) return;
    setCanLeft(el.scrollLeft > 4); setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);
  useEffect(() => {
    const el = trackRef.current; if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true }); updateArrows();
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows, outerW]);
  const trackH = height ?? (variant === 'full-screen' ? 320 : 240);
  const w = outerW || 600;
  const getItemW = (i: number) => {
    if (variant === 'uncontained' || variant === 'full-screen') return Math.round(w * 0.55);
    if (i === 0) return w - Math.round(w * 0.3) - Math.max(48, Math.round(w * 0.11)) - GAP * 2;
    if (i === 1 && variant === 'multi-browse') return Math.round(w * 0.3);
    return Math.max(48, Math.round(w * 0.11));
  };
  const scrollBy = (dir: 'left'|'right') => trackRef.current?.scrollBy({ left: dir === 'left' ? -(getItemW(0) + GAP) : (getItemW(0) + GAP), behavior: 'smooth' });
  return (
    <div className={`md-carousel md-carousel--${variant}`}>
      {title && <h3 style={{ fontSize: 'var(--md-sys-typescale-title-large-size)', fontWeight: 400, color: 'var(--md-sys-color-on-surface)' }}>{title}</h3>}
      <div style={{ position: 'relative', width: '100%' }} ref={outerRef}>
        {canLeft && <button className="md-carousel__nav md-carousel__nav--left" onClick={() => scrollBy('left')}><Icon name="chevron_left" size={24} /></button>}
        <div className="md-carousel__track" ref={trackRef} style={{ height: trackH }}>
          {items.map((item, i) => (
            <div key={i} className={`md-carousel-item md-carousel-item--${i === 0 ? 'large' : i === 1 && variant === 'multi-browse' ? 'medium' : 'small'}`}
              style={{ width: getItemW(i), height: trackH, flexShrink: 0 }}>
              <img src={item.image} alt={item.title} className="md-carousel-item__image" referrerPolicy="no-referrer" draggable={false} />
              <div className="md-carousel-item__overlay"><span className="md-carousel-item__title">{item.title}</span>{item.subtitle && <span style={{ fontSize: '12px', opacity: 0.85 }}>{item.subtitle}</span>}</div>
            </div>
          ))}
        </div>
        {canRight && <button className="md-carousel__nav md-carousel__nav--right" onClick={() => scrollBy('right')}><Icon name="chevron_right" size={24} /></button>}
      </div>
    </div>
  );
};
