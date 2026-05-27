import React from 'react';
import './Avatar.css';
interface AvatarProps { src?: string; initials?: string; size?: 'small' | 'medium' | 'large'; className?: string; }
export const Avatar: React.FC<AvatarProps> = ({ src, initials, size = 'medium', className = '' }) => (
  <div className={`md-avatar md-avatar--${size} ${className}`}>
    {src ? <img src={src} alt={initials || 'Avatar'} className="md-avatar__image" referrerPolicy="no-referrer" />
         : <span className="md-avatar__initials">{initials || '?'}</span>}
  </div>
);
