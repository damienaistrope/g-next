import React from 'react';
import './ImageGrid.css';
interface ImageGridItemProps { src: string; alt: string; span?: 'none'|'large'|'tall'|'wide'; }
export const ImageGridItem: React.FC<ImageGridItemProps> = ({ src, alt, span = 'none' }) => (
  <div className={`md-image-grid-item md-image-grid-item--span-${span}`}>
    <img src={src} alt={alt} className="md-image-grid-item__image" referrerPolicy="no-referrer" />
  </div>
);
interface ImageGridProps { children: React.ReactNode; columns?: number; }
export const ImageGrid: React.FC<ImageGridProps> = ({ children, columns = 3 }) => (
  <div className="md-image-grid" style={{ '--md-image-grid-cols': columns } as React.CSSProperties}>{children}</div>
);
