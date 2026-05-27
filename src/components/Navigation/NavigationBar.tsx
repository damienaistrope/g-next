import React from 'react';
import { motion } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './NavigationBar.css';
interface NavBarItemProps { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; layoutId?: string; }
export const NavigationBarItem: React.FC<NavBarItemProps> = ({ icon, label, active, onClick, layoutId = 'nav-indicator' }) => (
  <button className={`md-navigation-bar__item ${active ? 'md-navigation-bar__item--active' : ''}`} onClick={onClick}>
    <Ripple />
    <div className="md-navigation-bar__icon-container">
      {active && <motion.div layoutId={layoutId} className="md-navigation-bar__active-indicator" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
      <div className="md-navigation-bar__icon">{typeof icon === 'string' ? <span className="material-symbols-outlined">{icon}</span> : icon}</div>
    </div>
    <span className="md-navigation-bar__label">{label}</span>
  </button>
);
interface NavBarProps { children: React.ReactNode; id?: string; }
export const NavigationBar: React.FC<NavBarProps> = ({ children, id = 'default' }) => (
  <div className="md-navigation-bar">
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<NavBarItemProps>, { layoutId: `nav-indicator-${id}` }) : child
    )}
  </div>
);
