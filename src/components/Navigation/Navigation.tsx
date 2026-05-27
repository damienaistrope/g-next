import React from 'react';
import './Navigation.css';
interface NavRailItemProps { icon: React.ReactNode | string; label: string; active?: boolean; onClick?: () => void; }
export const NavigationRailItem: React.FC<NavRailItemProps> = ({ icon, label, active, onClick }) => (
  <button className={`md-nav-rail-item ${active ? 'md-nav-rail-item--active' : ''}`} onClick={onClick}>
    <div className="md-nav-rail-item__icon-container">
      <div className="md-nav-rail-item__active-indicator" />
      <div className="md-nav-rail-item__icon">{typeof icon === 'string' ? <span className="material-symbols-outlined">{icon}</span> : icon}</div>
    </div>
    <span className="md-nav-rail-item__label">{label}</span>
  </button>
);
interface NavRailProps { children: React.ReactNode; fab?: React.ReactNode; }
export const NavigationRail: React.FC<NavRailProps> = ({ children, fab }) => (
  <nav className="md-nav-rail"><div className="md-nav-rail__content">{fab && <div>{fab}</div>}{children}</div></nav>
);
interface TopAppBarProps { title: string; navigationIcon?: React.ReactNode; actions?: React.ReactNode; variant?: 'center-aligned'|'small'|'medium'|'large'; children?: React.ReactNode; }
export const TopAppBar: React.FC<TopAppBarProps> = ({ title, navigationIcon, actions, variant = 'small', children }) => (
  <header className={`md-top-app-bar md-top-app-bar--${variant}`}>
    <div className="md-top-app-bar__row">
      {navigationIcon && <div>{navigationIcon}</div>}
      <div style={{ flex: 1, padding: '0 12px' }}>{children || <h1 className="md-top-app-bar__title">{title}</h1>}</div>
      {actions && <div className="md-top-app-bar__actions">{actions}</div>}
    </div>
  </header>
);
