import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './Chips.css';
interface ChipProps { label: string; icon?: string; trailingIcon?: string; selected?: boolean; onClick?: () => void; variant?: 'assist' | 'filter' | 'input' | 'suggestion'; onRemove?: () => void; }
export const Chip: React.FC<ChipProps> = ({ label, icon, trailingIcon, selected = false, onClick, variant = 'assist', onRemove }) => {
  const showCheckmark = variant === 'filter' && selected;
  return (
    <motion.button className={`md-chip md-chip--${variant} ${selected ? 'md-chip--selected' : ''} ${icon || showCheckmark ? 'md-chip--has-leading' : ''}`}
      onClick={onClick} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
      <div className="md-chip__state-layer" /><Ripple />
      <AnimatePresence mode="popLayout" initial={false}>
        {showCheckmark && <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="material-symbols-outlined md-chip__icon md-chip__icon--checkmark">check</motion.span>}
      </AnimatePresence>
      {!showCheckmark && icon && <span className="material-symbols-outlined md-chip__icon">{icon}</span>}
      <span className="md-chip__label">{label}</span>
      {onRemove ? <span className="material-symbols-outlined md-chip__remove" onClick={e => { e.stopPropagation(); onRemove(); }}>close</span>
               : trailingIcon && <span className="material-symbols-outlined md-chip__icon md-chip__icon--trailing">{trailingIcon}</span>}
    </motion.button>
  );
};
