import React from 'react';
import { motion } from 'motion/react';
import './Toolbar.css';
interface ToolbarProps { children: React.ReactNode; variant?: 'floating'|'docked'|'vertical'; className?: string; color?: 'surface'|'secondary-container'|'primary'|'surface-container'; }
export const Toolbar: React.FC<ToolbarProps> = ({ children, variant = 'floating', className = '', color = 'surface' }) => {
  const container = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05, type: 'spring', stiffness: 300, damping: 25 } } };
  const item = { hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } };
  return (
    <motion.div className={['md-toolbar', `md-toolbar--${variant}`, variant !== 'vertical' ? 'md-toolbar--horizontal' : '', `md-toolbar--color-${color}`, className].join(' ')} variants={container} initial="hidden" animate="show">
      {React.Children.map(children, child => <motion.div variants={item}>{child}</motion.div>)}
    </motion.div>
  );
};
