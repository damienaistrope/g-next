import React, { createContext, useContext } from 'react';
import './SegmentedButton.css';
interface CtxVal { selectedIndex?: number | number[]; onChange?: (i: number) => void; registerIndex: (id: string) => number; }
const Ctx = createContext<CtxVal>({ registerIndex: () => 0 });
interface SegmentedButtonProps { children: React.ReactNode; selectedIndex?: number | number[]; onChange?: (i: number) => void; className?: string; }
export const SegmentedButton: React.FC<SegmentedButtonProps> = ({ children, selectedIndex, onChange, className = '' }) => {
  const registry = React.useRef<Map<string, number>>(new Map());
  const counter = React.useRef(0);
  counter.current = 0;
  const registerIndex = (id: string) => {
    if (!registry.current.has(id)) registry.current.set(id, counter.current++);
    return registry.current.get(id)!;
  };
  return <Ctx.Provider value={{ selectedIndex, onChange, registerIndex }}><div className={`md-segmented-button ${className}`}>{children}</div></Ctx.Provider>;
};
let _c = 0;
export const Segment: React.FC<{ label: string; icon?: string; selected?: boolean; onClick?: () => void }> = ({ label, icon, selected: standalone, onClick }) => {
  const { selectedIndex, onChange, registerIndex } = useContext(Ctx);
  const idRef = React.useRef<string | null>(null);
  if (!idRef.current) idRef.current = String(_c++);
  const index = registerIndex(idRef.current);
  const isSelected = selectedIndex !== undefined ? (Array.isArray(selectedIndex) ? selectedIndex.includes(index) : selectedIndex === index) : !!standalone;
  return (
    <button className={`md-segment ${isSelected ? 'md-segment--selected' : ''}`} onClick={() => { onChange?.(index); onClick?.(); }}>
      <div className="md-segment__state-layer" />
      <div className="md-segment__content">
        {isSelected && <span className="material-symbols-outlined md-segment__icon">check</span>}
        {!isSelected && icon && <span className="material-symbols-outlined md-segment__icon">{icon}</span>}
        <span>{label}</span>
      </div>
    </button>
  );
};
