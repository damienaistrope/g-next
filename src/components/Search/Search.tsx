import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '../Icon/Icon';
import './Search.css';
interface SearchSuggestion { label: string; secondary?: string; type: 'history'|'suggestion'; }
interface SearchProps { placeholder?: string; onSearch?: (v: string) => void; suggestions?: SearchSuggestion[]; staticResults?: boolean; active?: boolean; className?: string; style?: React.CSSProperties; variant?: 'docked'|'full-screen'|'floating'; size?: 'standard'|'compact'; }
export const SearchBar: React.FC<SearchProps> = ({ placeholder = 'Search...', onSearch, suggestions = [], staticResults = false, active = false, className = '', style, variant = 'floating', size = 'standard' }) => {
  const [isExpanded, setIsExpanded] = useState(active);
  const [value, setValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (active) setIsExpanded(true); }, [active]);
  useEffect(() => {
    if (staticResults || !isExpanded) return;
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsExpanded(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [isExpanded, staticResults]);
  const showResults = isExpanded || staticResults;
  return (
    <div ref={containerRef} className={['md-search-container', `md-search-container--${variant}`, showResults ? 'md-search-container--expanded' : '', staticResults ? 'md-search-container--static' : '', className].filter(Boolean).join(' ')} style={style}>
      <motion.div layout className="md-search-bar" onClick={!isExpanded && !staticResults ? () => { setIsExpanded(true); setTimeout(() => inputRef.current?.focus(), 100); } : undefined}>
        <div className="md-search-bar__leading">
          {showResults
            ? <button className="md-search-bar__action-icon" onClick={() => { setIsExpanded(false); setValue(''); }}><Icon name="arrow_back" size={20} /></button>
            : <button className="md-search-bar__action-icon"><Icon name="menu" size={20} /></button>}
        </div>
        <div className="md-search-bar__content">
          <input ref={inputRef} className="md-search-bar__input" placeholder={placeholder} value={value} readOnly={!showResults && !staticResults}
            onFocus={() => setIsExpanded(true)} onChange={e => { setValue(e.target.value); onSearch?.(e.target.value); }} />
        </div>
        <div className="md-search-bar__trailing">
          {showResults ? <><button className="md-search-bar__action-icon" onClick={() => setValue('')}><Icon name="close" size={20} /></button><button className="md-search-bar__action-icon"><Icon name="mic" size={20} /></button></>
                       : <button className="md-search-bar__action-icon"><Icon name="search" size={20} /></button>}
        </div>
      </motion.div>
      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md-search-results">
            {suggestions.map((item, i) => (
              <div key={i} className="md-search-result">
                <div className="md-search-result__icon-container"><Icon name={item.type === 'history' ? 'history' : 'search'} size={20} /></div>
                <div><div className="md-search-result__label">{item.label}</div>{item.secondary && <div style={{ fontSize: '12px', opacity: 0.7 }}>{item.secondary}</div>}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
