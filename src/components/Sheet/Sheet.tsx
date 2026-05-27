import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import './Sheet.css';
interface SheetProps { isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode; footer?: React.ReactNode; type?: 'side'|'bottom'; static?: boolean; }
export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children, footer, type = 'side', static: isStatic = false }) => {
  const isSide = type === 'side';
  const variants = isSide ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } } : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
  const content = (
    <motion.div className={`md-sheet md-sheet--${type} ${isStatic ? 'md-sheet--static' : ''}`}
      variants={isStatic ? undefined : variants} initial={isStatic ? false : 'initial'} animate="animate" exit={isStatic ? false : 'exit'}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
      {!isSide && <div className="md-sheet__handle" />}
      <header className="md-sheet__header"><div className="md-sheet__header-content">
        {title && <h2 className="md-sheet__title">{title}</h2>}
        {!isStatic && <button className="md-sheet__close" onClick={onClose}><X size={24} /></button>}
      </div></header>
      <div className="md-sheet__body">{children}</div>
      {footer && <footer className="md-sheet__footer">{footer}</footer>}
    </motion.div>
  );
  if (isStatic) return content;
  return (
    <AnimatePresence>
      {isOpen && (<><motion.div className="md-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />{content}</>)}
    </AnimatePresence>
  );
};
