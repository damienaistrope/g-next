import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '../Icon/Icon';
import './Menu.css';
interface MenuItemProps { label: string; secondaryLabel?: string; icon?: React.ReactNode; trailingIcon?: React.ReactNode; shortcut?: string; badge?: string; selected?: boolean; disabled?: boolean; onClick?: (e: React.MouseEvent) => void; hasSubmenu?: boolean; className?: string; children?: React.ReactNode; }
export const MenuItem: React.FC<MenuItemProps> = ({ label, secondaryLabel, icon, trailingIcon, shortcut, badge, selected, disabled, onClick, hasSubmenu, className = '', children }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  return (
    <div className="md-menu-item-wrapper" onMouseEnter={() => hasSubmenu && setSubmenuOpen(true)} onMouseLeave={() => hasSubmenu && setSubmenuOpen(false)}>
      <button className={`md-menu-item ${selected ? 'md-menu-item--selected' : ''} ${disabled ? 'md-menu-item--disabled' : ''} ${className}`}
        onClick={e => hasSubmenu ? (e.stopPropagation(), setSubmenuOpen(!submenuOpen)) : onClick?.(e)} disabled={disabled} role="menuitem">
        <div className="md-menu-item__state-layer" />
        <div className="md-menu-item__content">
          {(icon || selected) && <div className="md-menu-item__leading">{icon || (selected && <Icon name="check" size={20} />)}</div>}
          <div className="md-menu-item__labels"><span className="md-menu-item__label">{label}</span>{secondaryLabel && <span className="md-menu-item__secondary-label">{secondaryLabel}</span>}</div>
          <div className="md-menu-item__trailing">{badge && <span className="md-menu-item__badge">{badge}</span>}{shortcut && <span className="md-menu-item__shortcut">{shortcut}</span>}{trailingIcon}{hasSubmenu && <Icon name="arrow_right" size={20} />}</div>
        </div>
      </button>
      {hasSubmenu && children && <AnimatePresence>{submenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md-menu-submenu">{children}</motion.div>}</AnimatePresence>}
    </div>
  );
};
export const MenuSection: React.FC<{ title?: string; children: React.ReactNode; showDivider?: boolean }> = ({ children, showDivider }) => (
  <div className={`md-menu-section ${showDivider ? 'md-menu-section--with-divider' : ''}`}>{children}</div>
);
interface MenuProps { isOpen: boolean; onClose?: (e?: MouseEvent) => void; children: React.ReactNode; static?: boolean; className?: string; variant?: 'standard'|'brand'; }
export const Menu: React.FC<MenuProps> = ({ isOpen, onClose, children, static: isStatic, className = '', variant = 'standard' }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isStatic || !isOpen) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose?.(e); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen, onClose, isStatic]);
  const content = <div ref={ref} className={`md-menu md-menu--${variant} ${className}`} role="menu">{children}</div>;
  if (isStatic) return content;
  return (
    <AnimatePresence>
      {isOpen && <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', zIndex: 100 }}>{content}</motion.div>}
    </AnimatePresence>
  );
};
