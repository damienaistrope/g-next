import React, { useState } from 'react';
import './Tooltip.css';
interface TooltipProps { text: string; children?: React.ReactElement; static?: boolean; }
export const Tooltip: React.FC<TooltipProps> = ({ text, children, static: isStatic = false }) => {
  const [visible, setVisible] = useState(false);
  const content = (visible || isStatic) && <div className={`md-tooltip ${isStatic ? 'md-tooltip--static' : ''}`}>{text}</div>;
  if (isStatic) return content;
  return (
    <div className="md-tooltip-container" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}{content}
    </div>
  );
};
