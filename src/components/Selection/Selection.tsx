import React, { useId } from 'react';
import './Selection.css';
import { Icon } from '../Icon/Icon';
interface SelectionProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; indeterminate?: boolean; error?: boolean; }
export const Checkbox: React.FC<SelectionProps> = ({ label, indeterminate, error, disabled, className = '', id: pid, ...props }) => {
  const gid = useId(); const id = pid || gid;
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <div className={`md-selection md-selection--checkbox ${disabled ? 'md-selection--disabled' : ''} ${error ? 'md-selection--error' : ''} ${className}`}>
      <div className="md-selection__container">
        <input ref={ref} id={id} type="checkbox" className="md-selection__input" disabled={disabled} {...props} />
        <div className="md-selection__control"><div className="md-selection__icon"><Icon name={indeterminate ? 'remove' : 'check_small'} size={18} /></div></div>
      </div>
      {label && <label htmlFor={id} className="md-selection__label">{label}</label>}
    </div>
  );
};
export const RadioButton: React.FC<SelectionProps> = ({ label, error, disabled, className = '', id: pid, ...props }) => {
  const gid = useId(); const id = pid || gid;
  return (
    <div className={`md-selection md-selection--radio ${disabled ? 'md-selection--disabled' : ''} ${error ? 'md-selection--error' : ''} ${className}`}>
      <div className="md-selection__container">
        <input id={id} type="radio" className="md-selection__input" disabled={disabled} {...props} />
        <div className="md-selection__control"><div className="md-selection__dot" /></div>
      </div>
      {label && <label htmlFor={id} className="md-selection__label">{label}</label>}
    </div>
  );
};
