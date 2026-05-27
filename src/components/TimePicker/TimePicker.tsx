import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ripple } from '../Ripple/Ripple';
import './TimePicker.css';
interface TimePickerProps { onCancel?: () => void; onConfirm?: (h: number, m: number) => void; initialHours?: number; initialMinutes?: number; }
export const TimePicker: React.FC<TimePickerProps> = ({ onCancel, onConfirm, initialHours = 9, initialMinutes = 30 }) => {
  const [hours, setHours] = useState(initialHours % 12 || 12);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [activePart, setActivePart] = useState<'hours'|'minutes'>('hours');
  const [period, setPeriod] = useState<'AM'|'PM'>(initialHours >= 12 ? 'PM' : 'AM');
  const [isDragging, setIsDragging] = useState(false);
  const hourValues = [12,1,2,3,4,5,6,7,8,9,10,11];
  const minuteValues = [0,5,10,15,20,25,30,35,40,45,50,55];
  const readAngle = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let deg = (Math.atan2(e.clientY-(rect.top+rect.height/2), e.clientX-(rect.left+rect.width/2)) * 180/Math.PI) + 90;
    return deg < 0 ? deg + 360 : deg;
  };
  const applyAngle = (deg: number) => {
    if (activePart === 'hours') { let v = Math.round(deg/30) % 12; setHours(v === 0 ? 12 : v); }
    else { let v = Math.round(deg/6) % 60; setMinutes(v < 0 ? v+60 : v); }
  };
  const handDeg = activePart === 'hours' ? (hours%12)*30 : minutes*6;
  const displayH = hours.toString().padStart(2,'0'), displayM = minutes.toString().padStart(2,'0');
  return (
    <div className="md-timepicker">
      <div className="md-timepicker__header">
        <span className="md-timepicker__label">Select time</span>
        <div className="md-timepicker__display">
          <div className="md-timepicker__time-inputs">
            <button className={`md-timepicker__time-btn${activePart==='hours'?' is-active':''}`} onClick={() => setActivePart('hours')}>{displayH}</button>
            <span className="md-timepicker__separator">:</span>
            <button className={`md-timepicker__time-btn${activePart==='minutes'?' is-active':''}`} onClick={() => setActivePart('minutes')}>{displayM}</button>
          </div>
          <div className="md-timepicker__period-selector">
            <button className={`md-timepicker__period-btn${period==='AM'?' is-selected':''}`} onClick={() => setPeriod('AM')}>AM</button>
            <button className={`md-timepicker__period-btn${period==='PM'?' is-selected':''}`} onClick={() => setPeriod('PM')}>PM</button>
          </div>
        </div>
      </div>
      <div className="md-timepicker__content">
        <div className="md-timepicker__clock"
          onPointerDown={e => { setIsDragging(true); applyAngle(readAngle(e)); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={e => { if (isDragging) applyAngle(readAngle(e)); }}
          onPointerUp={() => { setIsDragging(false); if (activePart==='hours') setActivePart('minutes'); }}>
          <div className="md-timepicker__clock-center" />
          <div className="md-timepicker__clock-hand" style={{ transform: `rotate(${handDeg}deg)`, transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.2,0,0,1)' }}>
            <div className="md-timepicker__clock-hand-end" />
          </div>
          {(activePart === 'hours' ? hourValues : minuteValues).map((val, i) => {
            const rad = (i*30-90) * (Math.PI/180), x = Math.cos(rad)*100, y = Math.sin(rad)*100;
            const isSel = activePart === 'hours' ? hours%12 === val%12 : minutes === val;
            return (
              <div key={i} className={`md-timepicker__clock-val${isSel?' is-selected':''}`} style={{ top: `calc(50% + ${y}px - 24px)`, left: `calc(50% + ${x}px - 24px)` }}>
                <Ripple duration={400} /><span>{val === 0 && activePart === 'minutes' ? '00' : val}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="md-timepicker__actions">
        <button className="md-timepicker__action-btn" onClick={() => onCancel?.()}>Cancel</button>
        <button className="md-timepicker__action-btn" onClick={() => { let h = hours%12; if (period==='PM') h+=12; onConfirm ? onConfirm(h,minutes) : setActivePart('hours'); }}>OK</button>
      </div>
    </div>
  );
};
