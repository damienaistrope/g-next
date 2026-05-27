import React from 'react';
import './BottomAppBar.css';
interface BottomAppBarProps { actions: React.ReactNode; fab?: React.ReactNode; }
export const BottomAppBar: React.FC<BottomAppBarProps> = ({ actions, fab }) => (
  <div className="md-bottom-app-bar">
    <div className="md-bottom-app-bar__actions">{actions}</div>
    {fab && <div className="md-bottom-app-bar__fab">{fab}</div>}
  </div>
);
