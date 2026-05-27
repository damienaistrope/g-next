import React, { useState } from 'react';
import { FAB } from './FAB';
import { motion, AnimatePresence } from 'motion/react';
import './FABMenu.css';

interface FABAction {
  icon: string;
  label: string;
  onClick?: () => void;
  variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
}

interface FABMenuProps {
  mainIcon: string;
  activeIcon?: string;
  actions: FABAction[];
  variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
}

export const FABMenu: React.FC<FABMenuProps> = ({
  mainIcon,
  activeIcon,
  actions,
  variant = 'primary',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md-fab-menu">
      <AnimatePresence>
        {isOpen && (
          <div className="md-fab-menu__actions">
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                transition={{ delay: (actions.length - 1 - index) * 0.05 }}
                className="md-fab-menu__action-wrapper"
              >
                <span className="md-fab-menu__action-label">{action.label}</span>
                <FAB 
                  size="small" 
                  icon={action.icon} 
                  variant={action.variant || 'secondary'} 
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <FAB 
        icon={isOpen && activeIcon ? activeIcon : mainIcon} 
        variant={variant}
        onClick={() => setIsOpen(!isOpen)}
        className={isOpen ? 'md-fab--active' : ''}
      />
    </div>
  );
};
