import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './DatePicker.css';
interface DatePickerProps { onDateSelect?: (d: any) => void; onCancel?: () => void; onConfirm?: (d: any) => void; initialDate?: Date; mode?: 'single'|'range'; }
const fmt = (d: Date|null) => { if (!d) return ''; const m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0'); return `${m}/${dd}/${d.getFullYear()}`; };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DatePicker: React.FC<DatePickerProps> = ({ onDateSelect, onCancel, onConfirm, initialDate = new Date(), mode = 'single' }) => {
  const [sel, setSel] = useState(initialDate);
  const [view, setView] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [viewMode, setViewMode] = useState<'calendar'|'year'>('calendar');
  const [confirmed, setConfirmed] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (viewMode === 'year' && yearRef.current) { const el = yearRef.current.querySelector('.is-selected') as HTMLElement; el?.scrollIntoView({ block: 'center', behavior: 'instant' }); } }, [viewMode]);
  const days = useMemo(() => {
    const y = view.getFullYear(), m = view.getMonth(), fd = new Date(y,m,1).getDay(), ld = new Date(y,m+1,0).getDate(), prev = new Date(y,m,0).getDate();
    const arr = [];
    for (let i=fd-1; i>=0; i--) arr.push({ day: prev-i, cur: false });
    for (let i=1; i<=ld; i++) arr.push({ day: i, cur: true });
    while (arr.length < 42) arr.push({ day: arr.length - (fd+ld) + 1, cur: false });
    return arr;
  }, [view]);
  const isToday = (d: number, cur: boolean) => { if (!cur) return false; const t = new Date(); return t.getDate()===d && t.getMonth()===view.getMonth() && t.getFullYear()===view.getFullYear(); };
  const isSel = (d: number, cur: boolean) => { if (!cur) return false; const dt = new Date(view.getFullYear(),view.getMonth(),d); dt.setHours(0,0,0,0); const s = new Date(sel); s.setHours(0,0,0,0); return dt.getTime()===s.getTime(); };
  const handleDay = (d: number, cur: boolean) => { if (!cur) return; const nd = new Date(view.getFullYear(),view.getMonth(),d); setSel(nd); onDateSelect?.(nd); };
  const handleConfirm = () => { if (onConfirm) { onConfirm(sel); } else { setConfirmed(true); setTimeout(() => setConfirmed(false), 1500); } };
  const formattedDate = sel.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="md-datepicker">
      <div className="md-datepicker__header">
        <div className="md-datepicker__header-text"><span className="md-datepicker__label">Select date</span><h2 className="md-datepicker__selected-date">{formattedDate}</h2></div>
        <button className="md-datepicker__edit-btn" onClick={() => setViewMode('calendar')}><span className="material-symbols-outlined">calendar_today</span></button>
      </div>
      <div className="md-datepicker__content">
        {viewMode !== 'input' && (
          <div className="md-datepicker__controls">
            <button className="md-datepicker__month-selector" onClick={() => setViewMode(viewMode === 'calendar' ? 'year' : 'calendar')}>
              {MONTHS[view.getMonth()]} {view.getFullYear()} <span className="material-symbols-outlined">{viewMode === 'year' ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
            </button>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="md-datepicker__nav-btn" onClick={() => setView(new Date(view.getFullYear(),view.getMonth()-1,1))}><span className="material-symbols-outlined">chevron_left</span></button>
              <button className="md-datepicker__nav-btn" onClick={() => setView(new Date(view.getFullYear(),view.getMonth()+1,1))}><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        )}
        <div className="md-datepicker__body">
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div key="cal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="md-datepicker__weekdays">{['S','M','T','W','T','F','S'].map((d,i) => <span key={i}>{d}</span>)}</div>
                <div className="md-datepicker__days">
                  {days.map((d,i) => (
                    <button key={i} className={`md-datepicker__day ${!d.cur ? 'is-outside' : ''} ${isToday(d.day,d.cur) ? 'is-today' : ''} ${isSel(d.day,d.cur) ? 'is-selected' : ''}`} onClick={() => handleDay(d.day, d.cur)} disabled={!d.cur}>
                      <Ripple /><span className="md-datepicker__day-label">{d.day}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="year" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="md-datepicker__year-selector" ref={yearRef}>
                {Array.from({ length: 151 }, (_,i) => 1900+i).map(y => (
                  <button key={y} className={`md-datepicker__year-item ${y === view.getFullYear() ? 'is-selected' : ''}`} onClick={() => { setView(new Date(y,view.getMonth(),1)); setViewMode('calendar'); }}>
                    <Ripple /><span>{y}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="md-datepicker__actions">
        <button className="md-datepicker__action-btn" onClick={() => onCancel?.()}>Cancel</button>
        <button className="md-datepicker__action-btn" onClick={handleConfirm}>{confirmed ? '✓ Saved' : 'OK'}</button>
      </div>
    </div>
  );
};
