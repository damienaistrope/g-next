import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './Switch.css';
interface SwitchProps { selected?: boolean; onChange?: (s: boolean) => void; disabled?: boolean; icons?: boolean; }
export const Switch: React.FC<SwitchProps> = ({ selected = false, onChange, disabled = false, icons = false }) => (
  <button className={`md-switch ${selected ? 'md-switch--selected' : 'md-switch--unselected'} ${disabled ? 'md-switch--disabled' : ''}`}
    onClick={() => !disabled && onChange?.(!selected)} role="switch" aria-checked={selected} disabled={disabled}>
    <div className="md-switch__track">
      <motion.div className="md-switch__thumb"
        initial={false}
        animate={{ left: selected ? 24 : (icons ? 2 : 8), width: (selected || icons) ? 24 : 16, height: (selected || icons) ? 24 : 16 }}
        whileTap={{ width: 28, height: 28, left: selected ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}>
        <AnimatePresence mode="wait">
          {icons && (
            <motion.span key={selected ? 'check' : 'close'}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }} className="material-symbols-outlined md-switch__icon"
              style={{ fontSize: selected ? '16px' : '14px' }}>{selected ? 'check' : 'close'}</motion.span>
          )}
        </AnimatePresence>
        <div className="md-switch__state-layer" />
      </motion.div>
    </div>
  </button>
);
