import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './Snackbar.css';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Ripple } from '../Ripple/Ripple';
interface SnackbarProps { label: string; actionLabel?: string; onAction?: () => void; showCloseIcon?: boolean; onClose?: () => void; isOpen: boolean; duration?: number; static?: boolean; stacked?: boolean; }
export const Snackbar: React.FC<SnackbarProps> = ({ label, actionLabel, onAction, showCloseIcon, onClose, isOpen, duration = 5000, static: isStatic = false }) => {
  useEffect(() => {
    if (isOpen && duration > 0 && !isStatic) { const t = setTimeout(() => onClose?.(), duration); return () => clearTimeout(t); }
  }, [isOpen, duration, onClose, isStatic]);
  const content = (
    <motion.div className={`md-snackbar ${isStatic ? 'md-snackbar--static' : ''}`}
      initial={isStatic ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <div className="md-snackbar__container">
        <div className="md-snackbar__content"><span className="md-snackbar__label">{label}</span></div>
        <div className="md-snackbar__actions">
          {actionLabel && <Button variant="text" onClick={onAction}>{actionLabel}</Button>}
          {showCloseIcon && <button className="md-snackbar__close-button" onClick={onClose}><Ripple /><Icon name="close" size={20} /></button>}
        </div>
      </div>
    </motion.div>
  );
  if (isStatic) return content;
  return <AnimatePresence>{isOpen && content}</AnimatePresence>;
};
