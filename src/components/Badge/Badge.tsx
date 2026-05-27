import React from 'react';
import './Badge.css';
interface BadgeProps { label?: string | number; variant?: 'large' | 'small'; color?: 'error' | 'primary' | 'secondary'; children?: React.ReactNode; }
export const Badge: React.FC<BadgeProps> = ({ label, variant = 'large', color = 'error', children }) => {
  const isSmall = variant === 'small' || !label;
  // Don't render a floating badge if there's no content and no children
  if (!children && !label && variant !== 'small') return null;
  return (
    <div className="md-badge-wrapper">
      {children}
      {(label !== undefined || variant === 'small') && (
        <span className={['md-badge', isSmall ? 'md-badge--small' : 'md-badge--large', `md-badge--${color}`].join(' ')}>
          {!isSmall && label}
        </span>
      )}
    </div>
  );
};
