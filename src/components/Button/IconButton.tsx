import React from 'react';
import { motion } from 'motion/react';
import { Icon } from '../Icon/Icon';
import { Ripple } from '../Ripple/Ripple';
import './IconButton.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'standard' | 'filled' | 'filled-tonal' | 'outlined';
  icon: string;
  selected?: boolean;
  toggle?: boolean;
  selectedIcon?: string;
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  shape?: 'round' | 'square';
  width?: 'narrow' | 'default' | 'wide';
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'standard',
  icon,
  selected = false,
  className = '',
  toggle = false,
  selectedIcon,
  size = 'm',
  shape = 'round',
  width = 'default',
  ...props
}) => {
  const currentIcon = (toggle && selected && selectedIcon) ? selectedIcon : icon;
  
  const iconSizes = {
    xs: 18,
    s: 20,
    m: 24,
    l: 28,
    xl: 32
  };

  const classes = [
    'md-icon-button',
    `md-icon-button--${variant}`,
    `md-icon-button--${size}`,
    `md-icon-button--${shape}`,
    `md-icon-button--width-${width}`,
    selected ? 'md-icon-button--selected' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button 
      className={classes}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      <div className="md-icon-button__state-layer" />
      <Ripple />
      <Icon name={currentIcon} size={iconSizes[size]} />
    </motion.button>
  );
};
