import React from 'react';
import { motion } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './List.css';
interface ListItemProps { headline: string; supportingText?: string; overline?: string; leadingContent?: React.ReactNode; trailingContent?: React.ReactNode; onClick?: () => void; className?: string; lines?: 1|2|3; }
export const ListItem: React.FC<ListItemProps> = ({ headline, supportingText, overline, leadingContent, trailingContent, onClick, className = '' }) => (
  <motion.div className={`md-list-item ${onClick ? 'md-list-item--interactive' : ''} ${className}`} onClick={onClick}
    whileTap={onClick ? { scale: 0.995 } : {}} transition={{ duration: 0.1 }}>
    <div className="md-list-item__state-layer" />{onClick && <Ripple />}
    {leadingContent && <div className="md-list-item__leading">{leadingContent}</div>}
    <div className="md-list-item__content">
      {overline && <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--md-sys-color-on-surface-variant)' }}>{overline}</span>}
      <span className="md-list-item__headline">{headline}</span>
      {supportingText && <span className="md-list-item__supporting-text">{supportingText}</span>}
    </div>
    {trailingContent && <div className="md-list-item__trailing">{trailingContent}</div>}
  </motion.div>
);
export const List: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => <div className={`md-list ${className}`}>{children}</div>;
