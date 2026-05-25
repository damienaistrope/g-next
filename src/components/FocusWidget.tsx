/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  AlertCircle,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Check,
  BrainCircuit,
  CloudRain,
  Compass,
  Square
} from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FocusWidgetProps {
  activeTask?: Task;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  isDarkMode: boolean;
  onBack?: () => void;
  onAddTaskDirectly?: (title: string, priority: 'low' | 'medium' | 'high', duration: number) => void;
}

type AmbientSoundType = 'none' | 'brown' | 'binaural' | 'rain';

export default function FocusWidget({
  activeTask,
  onComplete,
  onSnooze,
  isDarkMode,
  onBack,
  onAddTaskDirectly
}: FocusWidgetProps) {
  const [minutes, setMinutes] = React.useState<number>(25);
  const [seconds, setSeconds] = React.useState<number>(0);
  const [isActive, setIsActive] = React.useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = React.useState<string>('25');
  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(true);
  const [completedCycles, setCompletedCycles] = React.useState<number>(0);

  // New inline task input states for empty queue cases
  const [newTitle, setNewTitle] = React.useState<string>('');
  const [newPriority, setNewPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [newDuration, setNewDuration] = React.useState<number>(25);
  
  // Ambient Sound Generator State
  const [activeAmbient, setActiveAmbient] = React.useState<AmbientSoundType>('none');
  const [ambientVolume, setAmbientVolume] = React.useState<number>(0.05);
  
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const noiseNodeRef = React.useRef<AudioNode | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);

  // Sound preview toggle states
  const [playingSample, setPlayingSample] = React.useState<AmbientSoundType>('none');
  const previewStopRef = React.useRef<(() => void) | null>(null);

  // Play short 5.0 second temporary high-fidelity sound sample preview
  const playShortSample = (type: AmbientSoundType) => {
    if (playingSample === type) {
      previewStopRef.current?.();
      setPlayingSample('none');
      return;
    }

    // Stop any previous playing preview sample first
    previewStopRef.current?.();

    if (type === 'none') return;
    setPlayingSample(type);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const tCtx = new AudioContextClass();
      const tGain = tCtx.createGain();
      
      const now = tCtx.currentTime;
      tGain.gain.setValueAtTime(0, now);
      tGain.gain.linearRampToValueAtTime(ambientVolume * 2.0, now + 0.1);
      tGain.gain.setValueAtTime(ambientVolume * 2.0, now + 4.5);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 4.9);
      tGain.connect(tCtx.destination);

      let sourceNode: any = null;

      if (type === 'brown') {
        const bufferSize = 5.0 * tCtx.sampleRate;
        const noiseBuffer = tCtx.createBuffer(1, bufferSize, tCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
        const srcInstance = tCtx.createBufferSource();
        srcInstance.buffer = noiseBuffer;
        srcInstance.connect(tGain);
        srcInstance.start(0);
        sourceNode = srcInstance;
      } else if (type === 'binaural') {
        const oscL = tCtx.createOscillator();
        const oscR = tCtx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.value = 200;
        oscR.type = 'sine';
        oscR.frequency.value = 240;
        
        const pL = tCtx.createStereoPanner ? tCtx.createStereoPanner() : null;
        const pR = tCtx.createStereoPanner ? tCtx.createStereoPanner() : null;
        if (pL && pR) {
          pL.pan.value = -1;
          pR.pan.value = 1;
          oscL.connect(pL).connect(tGain);
          oscR.connect(pR).connect(tGain);
        } else {
          oscL.connect(tGain);
          oscR.connect(tGain);
        }
        oscL.start(0);
        oscR.start(0);
        
        sourceNode = {
          stop() {
            try { oscL.stop(); oscR.stop(); } catch(e){}
          }
        };
      } else if (type === 'rain') {
        const bufferSize = 5 * tCtx.sampleRate;
        const noiseBuffer = tCtx.createBuffer(1, bufferSize, tCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = white * 0.15;
          if (Math.random() > 0.9992) {
            output[i] += (Math.random() > 0.5 ? 1 : -1) * 0.65;
          }
        }
        const srcInstance = tCtx.createBufferSource();
        srcInstance.buffer = noiseBuffer;
        srcInstance.connect(tGain);
        srcInstance.start(0);
        sourceNode = srcInstance;
      }

      const stopAll = () => {
        try {
          sourceNode?.stop?.();
          tCtx.close();
        } catch (e) {}
        setPlayingSample(prev => prev === type ? 'none' : prev);
      };

      previewStopRef.current = stopAll;

      const timeoutId = setTimeout(() => {
        stopAll();
      }, 5000);

      const origStop = stopAll;
      previewStopRef.current = () => {
        clearTimeout(timeoutId);
        origStop();
      };
    } catch (err) {
      console.warn('Preview sound error:', err);
      setPlayingSample('none');
    }
  };

  // Sync core preferences from central storage
  React.useEffect(() => {
    const savedAmbient = localStorage.getItem('upnext_ambient_sound');
    if (savedAmbient !== null) {
      setActiveAmbient(savedAmbient as any);
    }
    const savedVolume = localStorage.getItem('upnext_ambient_volume');
    if (savedVolume !== null) {
      setAmbientVolume(parseFloat(savedVolume));
    } else {
      setAmbientVolume(0.05);
    }
    const savedSound = localStorage.getItem('upnext_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
    const savedTimer = localStorage.getItem('upnext_timer_duration');
    if (savedTimer !== null) {
      const parsed = parseInt(savedTimer, 10);
      if (parsed) {
        setMinutes(parsed);
        setCustomMinutes(parsed.toString());
      }
    }
  }, []);

  // Clean-up on task swap
  React.useEffect(() => {
    if (activeTask) {
      const est = activeTask.estimatedMinutes || 25;
      setMinutes(est);
      setSeconds(0);
      setCustomMinutes(est.toString());
      setIsActive(false);
    }
  }, [activeTask?.id]);

  // Pomodoro Countdown Logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Finished interval
          setIsActive(false);
          setCompletedCycles(prev => prev + 1);
          if (soundEnabled) {
            playCompletionSound();
          }
          if (activeTask) {
            onComplete(activeTask.id);
          }
        }
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, activeTask]);

  // Handle ambient sound generator node changes
  React.useEffect(() => {
    stopAmbientAudio();
    if (activeAmbient !== 'none' && isActive) {
      startAmbientAudio(activeAmbient);
    }
    return () => {
      stopAmbientAudio();
    };
  }, [activeAmbient, isActive]);

  // Live Volume Controller Adjustment
  React.useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(ambientVolume, audioContextRef.current.currentTime);
    }
  }, [ambientVolume]);

  const stopAmbientAudio = () => {
    try {
      if (noiseNodeRef.current) {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping ambient node:', e);
    }
  };

  const startAmbientAudio = (type: AmbientSoundType) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(ambientVolume, ctx.currentTime);
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      // 1. Cozy Deep Space Brown Noise
      if (type === 'brown') {
        const bufferSize = 10 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }

        const brownNoiseNode = ctx.createBufferSource();
        brownNoiseNode.buffer = noiseBuffer;
        brownNoiseNode.loop = true;
        brownNoiseNode.connect(gainNode);
        brownNoiseNode.start(0);
        noiseNodeRef.current = brownNoiseNode;
      } 
      // 2. 40Hz Memory Theta Binaural Beats
      else if (type === 'binaural') {
        // Binaural beats need two slightly offset oscillators in left and right ear
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        
        oscLeft.type = 'sine';
        oscLeft.frequency.value = 200; // Base carrier (Hz)
        
        oscRight.type = 'sine';
        oscRight.frequency.value = 240; // Carrier offset (40Hz binaural peak)

        // Stereo split configuration
        const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        if (pannerLeft && pannerRight) {
          pannerLeft.pan.value = -1; // hard left
          pannerRight.pan.value = 1; // hard right
          oscLeft.connect(pannerLeft).connect(gainNode);
          oscRight.connect(pannerRight).connect(gainNode);
        } else {
          oscLeft.connect(gainNode);
          oscRight.connect(gainNode);
        }

        oscLeft.start(0);
        oscRight.start(0);

        // Save a mock source object that implements stop()
        noiseNodeRef.current = {
          disconnect() {
            oscLeft.disconnect();
            oscRight.disconnect();
            pannerLeft?.disconnect();
            pannerRight?.disconnect();
          },
          stop() {
            try {
              oscLeft.stop();
              oscRight.stop();
            } catch (e) {}
          }
        } as any;
      }
      // 3. Ambient Gentle Rain Drops Ticking Waves
      else if (type === 'rain') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Rain bandpass profile (mostly high frequencies with random pop accents)
          output[i] = white * 0.15;
          if (Math.random() > 0.9992) {
            // Accent drop pop
            output[i] += (Math.random() > 0.5 ? 1 : -1) * 0.65;
          }
        }

        const rainNode = ctx.createBufferSource();
        rainNode.buffer = noiseBuffer;
        rainNode.loop = true;
        rainNode.connect(gainNode);
        rainNode.start(0);
        noiseNodeRef.current = rainNode;
      }
    } catch (e) {
      console.warn('Failed to start Web Audio ambient generator:', e);
    }
  };

  const playCompletionSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1109, ctx.currentTime + 0.15); // C#6
      osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.3); // E6
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.log('Audio Context blocked or not supported yet: ', e);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    const est = activeTask?.estimatedMinutes || 25;
    setMinutes(est);
    setSeconds(0);
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val) && val > 0 && val <= 300) {
      setMinutes(val);
      setSeconds(0);
      setIsActive(false);
    }
  };

  const totalDurationSeconds = (activeTask?.estimatedMinutes || 25) * 60;
  const currentRemainingSeconds = minutes * 60 + seconds;
  const progressRatio = totalDurationSeconds > 0 
    ? (totalDurationSeconds - currentRemainingSeconds) / totalDurationSeconds 
    : 0;

  return (
    <div className={`w-full h-full flex flex-col md:flex-row h-[680px] ${
      isDarkMode ? 'bg-[#161616]' : 'bg-white'
    }`}>
      
      {/* LEFT COLUMN: Sonoma Sidebar & Ambient Synthesizer Deck - No border divide */}
      <div className={`w-full md:w-64 flex flex-col justify-between p-4 ${
        isDarkMode ? 'bg-[#161616]' : 'bg-white'
      }`}>
        <div className="space-y-6">
          {/* Sonoma App Traffic Lights */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={onBack}
              className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity flex items-center justify-center group"
              title="Close Focus Chamber (Return to Desktop)"
            >
              <span className="text-[7px] text-rose-950 font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
            </button>
            <span className="w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 hover:opacity-80 transition-opacity" />
          </div>

          {/* Core Info banner */}
          <div className="space-y-1">
            <button 
              onClick={onBack}
              className="text-neutral-400 dark:text-neutral-500 hover:text-sky-500 transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Focus Chamber</span>
            </button>
            <div className={`text-[11px] p-2 mt-2 rounded bg-neutral-500/5 leading-relaxed ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Focus parameters active. Traffic alerts and notification sidebars are locked down.
            </div>
          </div>

          {/* Interactive Ambient Audio Block */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block px-1">
              sounds
            </span>
            
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveAmbient('none')}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-150 border ${
                  activeAmbient === 'none' 
                    ? 'bg-sky-500/15 border-sky-500/45 text-sky-400 font-extrabold' 
                    : 'border-transparent hover:bg-neutral-500/10 text-neutral-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span>Silent (No Background)</span>
                </div>
                {activeAmbient === 'none' && <Check className="w-3 h-3 text-sky-450" />}
              </button>

              <div className="flex items-center space-x-1.5 w-full">
                <button
                  onClick={() => setActiveAmbient(activeAmbient === 'brown' ? 'none' : 'brown')}
                  className={`grow text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-150 border ${
                    activeAmbient === 'brown' 
                      ? 'bg-sky-500/15 border-sky-500/45 text-sky-400 font-extrabold' 
                      : 'border-transparent hover:bg-neutral-500/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4" />
                    <span>Deep Brown Space</span>
                  </div>
                  {activeAmbient === 'brown' && <Check className="w-3 h-3 text-sky-450" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playShortSample('brown');
                  }}
                  title={playingSample === 'brown' ? "Stop Preview" : "Play Sound Sample Preview"}
                  className="p-2 rounded-xl border border-neutral-500/10 hover:bg-neutral-500/15 hover:border-neutral-500/20 text-neutral-400 hover:text-sky-500 flex items-center justify-center cursor-pointer transition-all shrink-0 w-8 h-8"
                >
                  {playingSample === 'brown' ? (
                    <Square className="w-2.5 h-2.5 fill-current text-rose-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-sky-500" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-1.5 w-full">
                <button
                  onClick={() => setActiveAmbient(activeAmbient === 'binaural' ? 'none' : 'binaural')}
                  className={`grow text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-150 border ${
                    activeAmbient === 'binaural' 
                      ? 'bg-sky-500/15 border-sky-500/45 text-sky-400 font-extrabold' 
                      : 'border-transparent hover:bg-neutral-500/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BrainCircuit className="w-4 h-4" />
                    <span>40Hz Binaural Peak</span>
                  </div>
                  {activeAmbient === 'binaural' && <Check className="w-3 h-3 text-sky-450" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playShortSample('binaural');
                  }}
                  title={playingSample === 'binaural' ? "Stop Preview" : "Play Sound Sample Preview"}
                  className="p-2 rounded-xl border border-neutral-500/10 hover:bg-neutral-500/15 hover:border-neutral-500/20 text-neutral-400 hover:text-sky-500 flex items-center justify-center cursor-pointer transition-all shrink-0 w-8 h-8"
                >
                  {playingSample === 'binaural' ? (
                    <Square className="w-2.5 h-2.5 fill-current text-rose-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-sky-500" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-1.5 w-full">
                <button
                  onClick={() => setActiveAmbient(activeAmbient === 'rain' ? 'none' : 'rain')}
                  className={`grow text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-150 border ${
                    activeAmbient === 'rain' 
                      ? 'bg-sky-500/15 border-sky-500/45 text-sky-400 font-extrabold' 
                      : 'border-transparent hover:bg-neutral-500/10 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CloudRain className="w-4 h-4" />
                    <span>Gentle Rain</span>
                  </div>
                  {activeAmbient === 'rain' && <Check className="w-3 h-3 text-sky-450" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playShortSample('rain');
                  }}
                  title={playingSample === 'rain' ? "Stop Preview" : "Play Sound Sample Preview"}
                  className="p-2 rounded-xl border border-neutral-500/10 hover:bg-neutral-500/15 hover:border-neutral-500/20 text-neutral-400 hover:text-sky-500 flex items-center justify-center cursor-pointer transition-all shrink-0 w-8 h-8"
                >
                  {playingSample === 'rain' ? (
                    <Square className="w-2.5 h-2.5 fill-current text-rose-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-sky-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Ambient Audio Deck Volume Controller */}
            {activeAmbient !== 'none' && (
              <div className="px-1 pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">
                  <span>Volume</span>
                  <span>{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmbientVolume(val);
                    localStorage.setItem('upnext_ambient_volume', String(val));
                  }}
                  className="w-full h-1 bg-neutral-500/25 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Bottom Status - Styled like Settings Exit Button */}
        <div className="space-y-2">
          <button
            onClick={onBack}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-neutral-500/10 cursor-pointer transition-all duration-150 ${
              isDarkMode 
                ? 'bg-neutral-900/65 hover:bg-neutral-800/80 text-neutral-350' 
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <ArrowLeft className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Exit Focus Chamber</span>
            </div>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: The High-Status Pomodoro Timer Control Panel - Fits Tightly without scrolling */}
      <div className={`grow flex-1 flex flex-col justify-center items-center overflow-y-auto p-4 md:p-6 ${
        isDarkMode ? 'bg-[#161616]' : 'bg-white'
      }`}>
        <AnimatePresence mode="wait">
          {!activeTask ? (
            <motion.div 
              key="add-task-focus-pane"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-2xl text-center space-y-4 transition-all duration-150 ${
                isDarkMode 
                  ? 'bg-[#1e1e1e]/60 border border-neutral-800/60 shadow-lg shadow-black/25' 
                  : 'bg-white border border-neutral-200/50 shadow-md shadow-gray-200/50'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto border border-sky-500/20">
                <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-md font-bold tracking-tight">Create Focus</h3>
                <p className="text-[10px] text-neutral-400 mt-1">
                  You have nothing scheduled. Set an immediate objective to focus on right now to kick off the timer.
                </p>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    Task Title / Objective
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Code CSS visual transition states..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-bold ${
                      isDarkMode ? 'bg-neutral-900/60 border-neutral-800 text-white placeholder-neutral-600' : 'bg-white border-neutral-200 text-neutral-800 placeholder-neutral-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      Priority Level
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none font-bold ${
                        isDarkMode ? 'bg-neutral-900/60 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-800'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={newDuration}
                      onChange={(e) => setNewDuration(parseInt(e.target.value, 15) || 25)}
                      min="1"
                      max="300"
                      className={`w-full px-2.5 py-1.5 text-xs text-center font-mono rounded-xl border outline-none font-bold ${
                        isDarkMode ? 'bg-neutral-900/60 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-800'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (newTitle.trim() && onAddTaskDirectly) {
                      onAddTaskDirectly(newTitle.trim(), newPriority, newDuration);
                    }
                  }}
                  disabled={!newTitle.trim()}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-none mt-2"
                >
                  Create and Start Session
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTask.id}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="w-full max-w-xl flex flex-col items-center mx-auto text-center"
            >
              {/* Task Header */}
              <div className="mb-3">
                <div className="inline-flex items-center space-x-2 bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeTask.priority === 'high' ? 'bg-rose-500' : activeTask.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span>{activeTask.priority} Priority Task</span>
                </div>
                <h2 className={`text-xl md:text-2xl font-bold tracking-tight max-w-md mx-auto leading-tight ${
                  isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                }`}>
                  {activeTask.title}
                </h2>
                {activeTask.subtitle && (
                  <p className={`mt-0.5 text-xs max-w-md mx-auto font-medium ${
                    isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
                  }`}>
                    {activeTask.subtitle}
                  </p>
                )}
              </div>

              {/* Progress and Ring Pomodoro Display */}
              <div className="relative w-44 h-44 md:w-48 md:h-48 flex items-center justify-center my-2">
                {/* Background Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="44" 
                    className="stroke-neutral-500/25" 
                    strokeWidth="3.5" 
                    fill="transparent" 
                  />
                  {/* Dynamic Ring */}
                  <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="44" 
                    className="stroke-sky-500" 
                    strokeWidth="3.5" 
                    fill="transparent" 
                    strokeDasharray="276"
                    animate={{ strokeDashoffset: 276 * (1 - progressRatio) }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Digital timer content */}
                <div className="flex flex-col items-center justify-center z-13">
                  <span className={`text-3xl md:text-4xl font-normal tracking-tighter font-mono ${
                    isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                  }`}>
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                  </span>
                  <span className={`text-[10px] font-bold tracking-wider uppercase mt-1 flex items-center space-x-1 ${
                    isDarkMode ? 'text-neutral-305' : 'text-neutral-600'
                  }`}>
                    <Clock className="w-3 h-3 text-sky-500" />
                    <span className="text-sky-500">{isActive ? 'FLOW SESSION' : 'PAUSED'}</span>
                  </span>
                </div>
              </div>

              {/* Quick Play Pause Reset Controls */}
              <div className="flex items-center space-x-3 mb-3">
                <button
                  onClick={resetTimer}
                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'border-neutral-800 bg-neutral-800/40 hover:bg-neutral-800 text-neutral-300' 
                      : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                  title="Reset focal timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleTimer}
                  className="w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 transition-all cursor-pointer transform hover:scale-105 active:scale-95 duration-150"
                  title={isActive ? "Pause Focus Loop" : "Start Focus Loop"}
                >
                  {isActive ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />}
                </button>

                <button
                  onClick={() => onComplete(activeTask.id)}
                  className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all cursor-pointer transform hover:scale-105"
                  title="Mark Task Complete"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Context Note Block */}
              {activeTask.notes && (
                <div className={`w-full max-w-sm p-2.5 mb-2 rounded-xl text-left text-[11px] max-h-[80px] overflow-y-auto ${
                  isDarkMode 
                    ? 'bg-neutral-950/40 text-neutral-300' 
                    : 'bg-neutral-100/70 text-neutral-600'
                }`}>
                  <span className="text-[9px] font-extrabold tracking-wider text-sky-500 uppercase block mb-0.5">
                    Workspace Context Instructions
                  </span>
                  <p className="italic leading-normal select-text">
                    "{activeTask.notes}"
                  </p>
                </div>
              )}

              {/* Pro Feature: Adjust Duration Inline */}
              <form onSubmit={handleCustomTimeSubmit} className="flex items-center justify-center space-x-2 mt-2">
                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Presets:</span>
                <input 
                  type="number" 
                  value={customMinutes} 
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className={`w-12 px-1.5 py-0.5 text-xs rounded text-center font-mono ${
                    isDarkMode 
                      ? 'bg-neutral-900 text-neutral-100' 
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                  min="1" 
                  max="300" 
                />
                <button 
                  type="submit"
                  className="bg-neutral-500/5 hover:bg-neutral-500/10 text-[10px] py-1 px-2.5 rounded font-extrabold cursor-pointer text-sky-400 hover:text-sky-500 transition-colors"
                >
                  Set Minutes
                </button>
                <button
                  type="button"
                  onClick={() => onSnooze(activeTask.id)}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-extrabold ml-2 cursor-pointer flex items-center space-x-0.5"
                >
                  <span>Snooze Tasks</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
