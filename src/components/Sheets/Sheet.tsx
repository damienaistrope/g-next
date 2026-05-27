import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../Button/Button';
import './Sheets.css';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  static?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const BottomSheet: React.FC<SheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  static: isStatic = false,
  className = '',
  style
}) => {
  const content = (
    <motion.div 
      className={`md-bottom-sheet ${isStatic ? 'md-bottom-sheet--static' : ''} ${className}`}
      style={style}
      initial={isStatic ? false : { y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <div className="md-bottom-sheet__drag-handle-container">
        <div className="md-bottom-sheet__drag-handle" />
      </div>
      
      {title && (
        <div className="md-bottom-sheet__header">
          {typeof title === 'string' ? (
            <h2 className="md-bottom-sheet__title">{title}</h2>
          ) : (
            <div className="md-bottom-sheet__title flex-1 mr-4">{title}</div>
          )}
          <Button variant="text" onClick={onClose} icon="close" className="md-bottom-sheet__close-btn" />
        </div>
      )}
      
      <div className="md-bottom-sheet__content">
        {children}
      </div>
    </motion.div>
  );

  if (isStatic) return content;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="md-bottom-sheet-root">
          <motion.div 
            className="md-bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {content}
        </div>
      )}
    </AnimatePresence>
  );
};

export const SideSheet: React.FC<SheetProps & { position?: 'left' | 'right' }> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  position = 'right',
  static: isStatic = false,
  className = '',
  style
}) => {
  const content = (
    <motion.div 
      className={`md-side-sheet md-side-sheet--${position} ${isStatic ? 'md-side-sheet--static' : ''} ${className}`}
      style={style}
      initial={isStatic ? false : { x: position === 'right' ? '100%' : '-100%' }}
      animate={{ x: 0 }}
      exit={isStatic ? false : { x: position === 'right' ? '100%' : '-100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <div className="md-side-sheet__header">
        {title && (
          typeof title === 'string' ? (
            <h2 className="md-side-sheet__title">{title}</h2>
          ) : (
            <div className="md-side-sheet__title flex-1 mr-4">{title}</div>
          )
        )}
        <Button variant="text" onClick={onClose} icon="close" className="md-side-sheet__close-btn" />
      </div>
      <div className="md-side-sheet__content">
        {children}
      </div>
    </motion.div>
  );

  if (isStatic) return content;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="md-side-sheet-root">
          <motion.div 
            className="md-side-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {content}
        </div>
      )}
    </AnimatePresence>
  );
};
