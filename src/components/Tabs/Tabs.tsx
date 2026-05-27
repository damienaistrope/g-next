import React from 'react';
import { motion } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './Tabs.css';
interface TabProps { label: string; icon?: string; active?: boolean; onClick?: () => void; variant?: 'primary'|'secondary'; layoutIdPrefix?: string; }
export const Tab: React.FC<TabProps> = ({ label, icon, active, onClick, variant = 'primary', layoutIdPrefix = 'default' }) => (
  <button className={`md-tab md-tab--${variant} ${active ? 'md-tab--active' : ''} ${icon ? 'md-tab--has-icon' : ''}`} onClick={onClick}>
    <Ripple /><div className="md-tab__state-layer" />
    <div className="md-tab__content">{icon && <span className="material-symbols-outlined">{icon}</span>}<span className="md-tab__label">{label}</span></div>
    {active && <motion.div layoutId={`${layoutIdPrefix}-${variant}-indicator`} className="md-tab__indicator" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
  </button>
);
export const Tabs: React.FC<{ children: React.ReactNode; variant?: 'primary'|'secondary'; id?: string }> = ({ children, variant = 'primary', id = 'tabs' }) => (
  <div className={`md-tabs md-tabs--${variant}`}>
    {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { variant, layoutIdPrefix: id }) : child)}
  </div>
);
