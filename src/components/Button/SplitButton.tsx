import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Icon } from '../Icon/Icon';
import { motion } from 'motion/react';
import { Menu, MenuItem } from '../Menu/Menu';
import './SplitButton.css';

interface SplitButtonMenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface SplitButtonProps {
  label: string;
  icon?: string;
  onMainClick?: () => void;
  variant?: 'elevated' | 'filled' | 'tonal' | 'outlined';
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  shape?: 'round' | 'square';
  menuItems?: SplitButtonMenuItem[];
  disabled?: boolean;
  mainRadius?: string;
  secondaryRadius?: string;
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  label,
  icon,
  onMainClick,
  variant = 'filled',
  size = 'm',
  shape = 'round',
  menuItems = [],
  disabled = false,
  mainRadius,
  secondaryRadius,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const secondaryButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    if (!disabled) setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    setIsMenuOpen(false);
  };

  const sizeMap = {
    xs: { main: 18, second: 18 },
    s: { main: 18, second: 20 },
    m: { main: 20, second: 22 },
    l: { main: 24, second: 24 },
    xl: { main: 24, second: 26 },
  };

  const currentIconSizes = sizeMap[size as keyof typeof sizeMap] || sizeMap.m;

  // Determine radii defaults
  const baseRadii = {
    xs: '4px',
    s: '4px',
    m: '4px',
    l: '8px',
    xl: '12px',
  };

  let effMain = mainRadius;
  let effSecondary = secondaryRadius;

  if (!effMain) {
    if (shape === 'round') {
      effMain = '9999px 12px 12px 9999px';
    } else {
      // Square defaults
      effMain = '56px 12px 12px 56px'; 
    }
  }

  if (!effSecondary) {
    if (shape === 'round') {
      effSecondary = '12px 9999px 9999px 12px';
    } else {
      // Square defaults
      effSecondary = '12px 56px 56px 12px';
    }
  }

  return (
    <div 
      className={`md-split-button md-split-button--${variant} md-split-button--${size} md-split-button--${shape} ${disabled ? 'md-split-button--disabled' : ''} ${isMenuOpen ? 'md-split-button--menu-open' : ''}`}
      ref={containerRef}
    >
      <div className="md-split-button__inner">
        <Button 
          variant={variant} 
          size={size} 
          icon={icon ? <Icon name={icon} size={currentIconSizes.main} /> : undefined}
          onClick={onMainClick}
          disabled={disabled}
          className="md-split-button__main"
          style={{ '--md-button-radius': effMain } as React.CSSProperties}
        >
          {label}
        </Button>
        <Button 
          variant={variant} 
          size={size} 
          onClick={toggleMenu}
          disabled={disabled}
          ref={secondaryButtonRef}
          icon={
            <motion.div
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: currentIconSizes.second,
                height: currentIconSizes.second,
              }}
            >
              <Icon name="keyboard_arrow_down" size={currentIconSizes.second} />
            </motion.div>
          }
          className={`md-split-button__secondary ${isMenuOpen ? 'md-split-button__secondary--open' : ''}`}
          style={{ '--md-button-radius': isMenuOpen ? '9999px' : effSecondary } as React.CSSProperties}
        />
      </div>

      <div className="md-split-button__menu-container">
        <Menu 
          isOpen={isMenuOpen} 
          onClose={(event) => {
            // Prevent closure if clicking the secondary button toggle
            if (event?.target && secondaryButtonRef.current?.contains(event.target as Node)) {
              return;
            }
            setIsMenuOpen(false);
          }}
          className="md-split-button__menu-override"
        >
          {menuItems.map((item, index) => (
            <MenuItem 
              key={index}
              label={item.label}
              icon={item.icon ? <Icon name={item.icon} size={20} /> : undefined}
              onClick={() => handleMenuItemClick(item.onClick)}
            />
          ))}
        </Menu>
      </div>
    </div>
  );
};
