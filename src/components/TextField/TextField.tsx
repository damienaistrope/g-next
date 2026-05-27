import React, { useState, useId } from 'react';
import './TextField.css';
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; supportingText?: string; error?: boolean; leadingIcon?: React.ReactNode | string; trailingIcon?: React.ReactNode | string; clearable?: boolean; variant?: 'filled' | 'outlined'; }
export const TextField: React.FC<TextFieldProps> = ({ label, supportingText, error, leadingIcon, trailingIcon, clearable = false, variant = 'filled', className = '', disabled, value: propValue, onChange, onFocus, onBlur, ...props }) => {
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(propValue ?? '');
  const id = useId();
  const value = propValue !== undefined ? propValue : internal;
  const hasValue = value !== '';
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInternal(e.target.value); onChange?.(e); };
  const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); setInternal(''); onChange?.({ target: { value: '' } } as any); };
  const renderIcon = (icon: React.ReactNode | string, isTrailing?: boolean) => {
    if (typeof icon === 'string') {
      const s = <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>;
      if (isTrailing && clearable && hasValue && !disabled) return <button type="button" className="md-text-field__clear-button" onClick={handleClear}>{s}</button>;
      return s;
    }
    return icon;
  };
  return (
    <div className={['md-text-field', `md-text-field--${variant}`, error ? 'md-text-field--error' : '', disabled ? 'md-text-field--disabled' : '', focused ? 'md-text-field--focused' : '', hasValue ? 'md-text-field--has-value' : '', leadingIcon ? 'md-text-field--has-leading' : '', className].filter(Boolean).join(' ')}>
      <div className="md-text-field__container">
        {leadingIcon && <div className="md-text-field__leading-icon">{renderIcon(leadingIcon)}</div>}
        <div className="md-text-field__content">
          <input id={id} className="md-text-field__input" value={value} onChange={handleChange} onFocus={e => { setFocused(true); onFocus?.(e); }} onBlur={e => { setFocused(false); onBlur?.(e); }} disabled={disabled} {...props} />
          {label && <label htmlFor={id} className="md-text-field__label">{label}</label>}
        </div>
        {trailingIcon && <div className="md-text-field__trailing-icon">{renderIcon(trailingIcon, true)}</div>}
        <div className="md-text-field__indicator" />
      </div>
      {supportingText && <div className="md-text-field__supporting-text">{supportingText}</div>}
    </div>
  );
};
