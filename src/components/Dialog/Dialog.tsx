import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './Dialog.css';
interface DialogProps { isOpen: boolean; onClose: () => void; title?: string; icon?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode; centerHeader?: boolean; scrollable?: boolean; static?: boolean; }
export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, icon, children, actions, centerHeader = false, static: isStatic = false }) => {
  const isCentered = centerHeader || !!icon;
  const content = (
    <motion.div className={`md-dialog ${isStatic ? 'md-dialog--static' : ''}`}
      initial={isStatic ? false : { opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={isStatic ? false : { opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
      <div className={`md-dialog__container ${isCentered ? 'md-dialog__container--centered' : ''}`}>
        {icon && <div className="md-dialog__icon">{icon}</div>}
        {title && <h2 className="md-dialog__title">{title}</h2>}
        <div className="md-dialog__content">{children}</div>
        {actions && <div className="md-dialog__actions">{actions}</div>}
      </div>
    </motion.div>
  );
  if (isStatic) return content;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="md-dialog-root">
          <motion.div className="md-dialog-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          {content}
        </div>
      )}
    </AnimatePresence>
  );
};
