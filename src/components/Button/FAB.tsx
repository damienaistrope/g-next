import React from 'react';
import { motion } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './FAB.css';
interface FABProps { icon: string; label?: string; onClick?: () => void; variant?: 'surface' | 'primary' | 'secondary' | 'tertiary'; size?: 'small' | 'medium' | 'large' | 'extended'; className?: string; }
export const FAB: React.FC<FABProps> = ({ icon, label, onClick, variant = 'primary', size = 'medium', className = '' }) => (
  <motion.button className={`md-fab md-fab--${variant} md-fab--${size} ${className}`} onClick={onClick}
    whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
    <div className="md-fab__state-layer" /><Ripple />
    <span className="material-symbols-outlined md-fab__icon">{icon}</span>
    {size === 'extended' && label && <span className="md-fab__label">{label}</span>}
  </motion.button>
);
