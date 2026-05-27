import React from 'react';
import { motion } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './Button.css';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text';
  icon?: React.ReactNode | string; size?: 'xs' | 's' | 'm' | 'l' | 'xl'; shape?: 'round' | 'square'; selected?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'filled', icon, size = 'm', shape = 'round', selected = false, children, className = '', ...props }, ref) => {
  const isIconString = typeof icon === 'string';
  const classes = ['md-button', `md-button--${variant}`, `md-button--${size}`, `md-button--${shape}`, icon ? 'md-button--has-icon' : '', className].filter(Boolean).join(' ');
  return (
    <motion.button ref={ref} className={classes} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} {...props}>
      <div className="md-button__state-layer" />
      <Ripple />
      {icon && <span className="md-button__icon">{isIconString ? <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span> : icon}</span>}
      {children && <span className="md-button__label">{children}</span>}
    </motion.button>
  );
});
Button.displayName = 'Button';
