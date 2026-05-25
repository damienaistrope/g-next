/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, 
  Volume2, 
  VolumeX, 
  Compass, 
  BrainCircuit, 
  CloudRain, 
  Clock, 
  Bell, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingModalProps {
  googleUser: any;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  
  ambientSound: 'none' | 'brown' | 'binaural' | 'rain';
  setAmbientSound: (v: 'none' | 'brown' | 'binaural' | 'rain') => void;
  
  timerDuration: number;
  setTimerDuration: (v: number) => void;
  
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  
  onClose: () => void;
  isDarkMode: boolean;
}

export default function OnboardingModal({
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  soundEnabled,
  setSoundEnabled,
  ambientSound,
  setAmbientSound,
  timerDuration,
  setTimerDuration,
  notificationsEnabled,
  setNotificationsEnabled,
  onClose,
  isDarkMode
}: OnboardingModalProps) {
  const [step, setStep] = React.useState<number>(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      localStorage.setItem('upnext_onboarding_done', 'true');
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isDarkMode 
            ? 'bg-[#181818] border-neutral-800 text-neutral-100' 
            : 'bg-white border-neutral-200 text-neutral-800'
        }`}
      >
        {/* Header Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-neutral-900/60 border-neutral-800/40' : 'bg-neutral-50 border-neutral-200/40'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-white bg-sky-600 px-1.5 py-0.5 rounded font-black text-[10px] tracking-tighter">G→N</span>
            <span className="font-extrabold text-xs tracking-wider uppercase text-sky-500">
              G-Next Workspace
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-xs font-medium text-neutral-400 hover:text-sky-500 cursor-pointer transition-colors px-3 py-1.5 rounded-xl"
          >
            Skip for now
          </button>
        </div>

        {/* Dynamic content rendering with slide animation */}
        <div className="p-6 md:p-8 flex-1 min-h-[360px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Timeline & Connect Calendar</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Connect your account to allow synchronization of live corporate calendar items, and activate real-time meeting chime alarms directly in your macOS menu bar.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border text-center space-y-4 ${
                  isDarkMode ? 'bg-neutral-950/40 border-neutral-800/40' : 'bg-neutral-50 border-neutral-200/40'
                }`}>
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto border border-sky-500/25">
                    <Calendar className="w-6 h-6" />
                  </div>

                  {googleUser ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2 bg-sky-500/10 text-sky-500 py-1.5 px-3 rounded-lg text-xs font-bold inline-flex border border-sky-500/20">
                        <UserCheck className="w-4 h-4" />
                        <span>Connected: {googleUser.email}</span>
                      </div>
                      <p className="text-[11px] text-neutral-405">
                        Meetings will update dynamically. Your timeline is ready!
                      </p>
                      <div className="flex items-center justify-center space-x-3 mt-1 pt-1 border-t border-neutral-500/5">
                        <button
                          onClick={onGoogleSignIn}
                          className="px-3 py-1.5 bg-neutral-500/10 hover:bg-neutral-500/20 text-[10px] font-bold rounded-lg cursor-pointer text-sky-500 transition-colors"
                        >
                          Connect Another Account
                        </button>
                        <button
                          onClick={onGoogleSignOut}
                          className="px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer text-neutral-400 hover:text-rose-500 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-404">
                        No calendar linked yet. Ready to synchronize your work days?
                      </p>
                      <button
                        onClick={onGoogleSignIn}
                        className="w-full max-w-xs mx-auto py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer shadow-md shadow-sky-500/15 transition-transform active:scale-95"
                      >
                        <span>Connect Google Calendar</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Sound & Acoustic Preferences</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Set up your acoustic workspace. You can select your background focus track and toggle chime completion sound effects.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setAmbientSound('none')}
                    className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 cursor-pointer transition-all ${
                      ambientSound === 'none' 
                        ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/10' 
                        : isDarkMode ? 'border-neutral-800/40 bg-neutral-950/20 hover:bg-neutral-900/60' : 'border-neutral-200/40 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <VolumeX className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-normal font-mono">Silent Focus</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Absolute focus without ambient feedback streams.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAmbientSound('brown')}
                    className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 cursor-pointer transition-all ${
                      ambientSound === 'brown' 
                        ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/10' 
                        : isDarkMode ? 'border-neutral-800/40 bg-neutral-950/20 hover:bg-neutral-900/60' : 'border-neutral-200/40 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <Compass className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-normal font-mono">Deep Brown Space</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Lower-frequency rumble block representing cozy cabin focus.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAmbientSound('binaural')}
                    className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 cursor-pointer transition-all ${
                      ambientSound === 'binaural' 
                        ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/10' 
                        : isDarkMode ? 'border-neutral-800/40 bg-neutral-950/20 hover:bg-neutral-900/60' : 'border-neutral-200/40 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <BrainCircuit className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-normal font-mono">40Hz Theta Binaural</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Cognitive frequency locks for memory mapping and focus triggers.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAmbientSound('rain')}
                    className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 cursor-pointer transition-all ${
                      ambientSound === 'rain' 
                        ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/10' 
                        : isDarkMode ? 'border-neutral-800/40 bg-neutral-950/20 hover:bg-neutral-900/60' : 'border-neutral-200/40 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <CloudRain className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-normal font-mono">Atmospheric Rain</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Gentle atmospheric ticking drops for relaxing spatial noise.</p>
                    </div>
                  </button>
                </div>

                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'border-neutral-800/40 bg-neutral-950/20' : 'border-neutral-200/40 bg-neutral-50'
                }`}>
                  <div className="flex flex-col text-left space-y-0.5">
                    <span className="text-xs font-bold">Chimes Completion Notification alerts</span>
                    <span className="text-[10px] text-neutral-400">Plays an F-major arpeggiated melodic chime on completion loops.</span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-10 h-6 rounded-full transition-all flex items-center cursor-pointer px-1 relative ${
                      soundEnabled ? 'bg-sky-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Focus Timers & Interface</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Choose your default workspace configuration. You can change these preferences at any time in the desktop app's Settings menu.
                  </p>
                </div>

                {/* Default Timer Presets */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                    Default Work Timers (Minutes)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 25, 45].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setTimerDuration(mins)}
                        className={`py-2 text-xs font-normal font-mono rounded-xl border cursor-pointer transition-all ${
                          timerDuration === mins
                            ? 'bg-sky-500/10 border-sky-500 text-sky-500'
                            : isDarkMode ? 'bg-neutral-950/20 border-neutral-800/40 hover:bg-neutral-800 text-neutral-405' : 'bg-white border-neutral-200/40 hover:bg-neutral-50 text-neutral-600'
                        }`}
                      >
                        {mins} Min
                      </button>
                    ))}
                  </div>
                </div>

                {/* macOS Notification preferences */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDarkMode ? 'border-neutral-800/40 bg-neutral-950/20' : 'border-neutral-200/40 bg-neutral-50'
                }`}>
                  <div className="flex flex-col text-left space-y-0.5">
                    <span className="text-xs font-bold">macOS-Style Toast Notifications</span>
                    <span className="text-[10px] text-neutral-405">Displays interactive translucent Sonoma banner cards matching calendar sync loops.</span>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-10 h-6 rounded-full transition-all flex items-center cursor-pointer px-1 relative ${
                      notificationsEnabled ? 'bg-sky-500 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                  </button>
                </div>

                <div className="bg-sky-500/10 rounded-2xl p-4 border border-sky-500/15 flex items-start space-x-3 text-sky-500">
                  <Bell className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-left">
                    <h5 className="text-xs font-bold">Interactive Deck Activated</h5>
                    <p className="text-[10.5px] text-sky-500/80 leading-normal mt-0.5">
                      Your space is custom fitted. You can access Settings directly from the sidebar or application menu for fine tuning!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav Controls Footer bar */}
          <div className={`mt-8 pt-4 border-t flex items-center justify-between ${
            isDarkMode ? 'border-neutral-800/80' : 'border-neutral-200'
          }`}>
            <span className="text-xs text-neutral-400 font-mono">
              Step {step} of {totalSteps}
            </span>

            <div className="flex space-x-2">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors ${
                    isDarkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-sky-500 hover:bg-sky-600 text-white flex items-center space-x-1 cursor-pointer shadow-md shadow-sky-500/15 transition-transform active:scale-95"
              >
                <span>{step === totalSteps ? 'Enter Workspace' : 'Continue'}</span>
                {step < totalSteps && <ChevronRight className="w-4 h-4" />}
                {step === totalSteps && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
