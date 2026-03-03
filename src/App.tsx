import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  History, 
  ChevronLeft, 
  ChevronDown,
  Trash2, 
  CheckCircle2, 
  Activity, 
  Target, 
  BarChart3,
  Calendar,
  User,
  ArrowRight,
  AlertTriangle,
  Camera,
  Edit2,
  X,
  Upload,
  Undo2,
  Settings,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { PitchType, PitchOutcome, Pitch, BullpenSession, Pitcher } from './types';
import { cn } from './lib/utils';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function App() {
  const [sessions, setSessions] = useState<BullpenSession[]>([]);
  const [pitchers, setPitchers] = useState<Pitcher[]>([]);
  const [activeSession, setActiveSession] = useState<BullpenSession | null>(null);
  const [view, setView] = useState<'list' | 'active' | 'summary' | 'setup' | 'pitchers' | 'pitcher_detail' | 'settings'>('list');
  const [teamSettings, setTeamSettings] = useState<{ color: string, logo?: string }>({ color: '#059669' });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [summarySource, setSummarySource] = useState<'list' | 'pitcher_detail'>('list');
  const [selectedPitcherName, setSelectedPitcherName] = useState<string | null>(null);
  const [pitcherNameInput, setPitcherNameInput] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [pitcherToDelete, setPitcherToDelete] = useState<Pitcher | null>(null);
  const [editingPitcher, setEditingPitcher] = useState<Pitcher | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showActiveNotes, setShowActiveNotes] = useState(false);
  const [pitchVelocityInput, setPitchVelocityInput] = useState<string>('');
  const [pendingPitch, setPendingPitch] = useState<{ outcome: PitchOutcome, location: { x: number, y: number } } | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('bullpen_sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }

    const savedPitchers = localStorage.getItem('bullpen_pitchers');
    if (savedPitchers) {
      try {
        setPitchers(JSON.parse(savedPitchers));
      } catch (e) {
        console.error('Failed to parse pitchers', e);
      }
    }

    const savedTeamSettings = localStorage.getItem('bullpen_team_settings');
    if (savedTeamSettings) {
      try {
        setTeamSettings(JSON.parse(savedTeamSettings));
      } catch (e) {
        console.error('Failed to parse team settings', e);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('bullpen_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('bullpen_pitchers', JSON.stringify(pitchers));
  }, [pitchers]);

  useEffect(() => {
    localStorage.setItem('bullpen_team_settings', JSON.stringify(teamSettings));
  }, [teamSettings]);

  const startNewSession = () => {
    setPitcherNameInput('');
    setView('setup');
  };

  const confirmStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitcherNameInput.trim()) return;

    const name = pitcherNameInput.trim();
    
    // Ensure pitcher exists in pitchers state
    if (!pitchers.find(p => p.name === name)) {
      const newPitcher: Pitcher = {
        id: crypto.randomUUID(),
        name: name
      };
      setPitchers(prev => [...prev, newPitcher]);
    }

    const newSession: BullpenSession = {
      id: crypto.randomUUID(),
      date: Date.now(),
      pitcherName: pitcherNameInput.trim(),
      pitches: [],
      isCompleted: false
    };
    setActiveSession(newSession);
    setView('active');
  };

  const addPitch = (type: PitchType, outcome: PitchOutcome, location?: { x: number; y: number }, velocity?: number) => {
    if (!activeSession) return;

    const newPitch: Pitch = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      outcome,
      location,
      velocity
    };

    const updatedSession = {
      ...activeSession,
      pitches: [...activeSession.pitches, newPitch]
    };

    setActiveSession(updatedSession);
  };

  const undoLastPitch = () => {
    if (!activeSession || activeSession.pitches.length === 0) return;
    
    const updatedPitches = [...activeSession.pitches];
    updatedPitches.pop();
    
    setActiveSession({
      ...activeSession,
      pitches: updatedPitches
    });
  };

  const finishSession = () => {
    if (!activeSession) return;
    
    const completedSession = { ...activeSession, isCompleted: true };
    setSessions(prev => [completedSession, ...prev]);
    setActiveSession(null);
    setShowFinishConfirmation(false);
    setView('list');
  };

  const deletePitcher = (name: string) => {
    setSessions(prev => prev.filter(s => s.pitcherName !== name));
    setPitchers(prev => prev.filter(p => p.name !== name));
    if (selectedPitcherName === name) {
      setView('pitchers');
      setSelectedPitcherName(null);
    }
  };

  const updatePitcher = (oldName: string, newName: string, profilePicture?: string) => {
    // Update sessions
    setSessions(prev => prev.map(s => s.pitcherName === oldName ? { ...s, pitcherName: newName } : s));
    
    // Update pitchers state
    setPitchers(prev => {
      const existing = prev.find(p => p.name === oldName);
      if (existing) {
        return prev.map(p => p.name === oldName ? { ...p, name: newName, profilePicture } : p);
      } else {
        return [...prev, { id: crypto.randomUUID(), name: newName, profilePicture }];
      }
    });

    if (selectedPitcherName === oldName) {
      setSelectedPitcherName(newName);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId);
  }, [sessions, selectedSessionId]);

  const uniquePitchers = useMemo(() => {
    const pitchersMap: Record<string, { 
      name: string, 
      sessionCount: number, 
      totalPitches: number, 
      lastDate: number,
      strikes: number,
      balls: number,
      pitchTypeCounts: Record<string, number>,
      allPitches: Pitch[],
      sessions: BullpenSession[],
      profilePicture?: string
    }> = {};
    
    sessions.forEach(s => {
      if (!pitchersMap[s.pitcherName]) {
        const existingPitcher = pitchers.find(p => p.name === s.pitcherName);
        pitchersMap[s.pitcherName] = { 
          name: s.pitcherName, 
          sessionCount: 0, 
          totalPitches: 0, 
          lastDate: 0,
          strikes: 0,
          balls: 0,
          pitchTypeCounts: {},
          allPitches: [],
          sessions: [],
          profilePicture: existingPitcher?.profilePicture
        };
      }
      const pData = pitchersMap[s.pitcherName];
      pData.sessionCount++;
      pData.totalPitches += s.pitches.length;
      pData.lastDate = Math.max(pData.lastDate, s.date);
      pData.sessions.push(s);
      
      s.pitches.forEach(p => {
        pData.allPitches.push(p);
        if (p.outcome === PitchOutcome.STRIKE) pData.strikes++;
        else if (p.outcome === PitchOutcome.BALL) pData.balls++;
        
        pData.pitchTypeCounts[p.type] = (pData.pitchTypeCounts[p.type] || 0) + 1;
      });
    });

    // Add pitchers who might not have sessions yet but are in the state
    pitchers.forEach(p => {
      if (!pitchersMap[p.name]) {
        pitchersMap[p.name] = {
          name: p.name,
          sessionCount: 0,
          totalPitches: 0,
          lastDate: 0,
          strikes: 0,
          balls: 0,
          pitchTypeCounts: {},
          allPitches: [],
          sessions: [],
          profilePicture: p.profilePicture
        };
      }
    });

    return Object.values(pitchersMap).map(p => ({
      ...p,
      sessions: p.sessions.sort((a, b) => a.date - b.date),
      trendData: p.sessions.sort((a, b) => a.date - b.date).map(s => {
        const strikes = s.pitches.filter(pitch => pitch.outcome === PitchOutcome.STRIKE).length;
        const total = s.pitches.length;
        const velocities = s.pitches.filter(pitch => pitch.velocity).map(pitch => pitch.velocity as number);
        const avgVelocity = velocities.length > 0 ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length) : null;
        
        return {
          date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          fullDate: new Date(s.date).toLocaleDateString(),
          pitchCount: total,
          strikePercentage: total > 0 ? Math.round((strikes / total) * 100) : 0,
          avgVelocity: avgVelocity,
          ...Object.values(PitchType).reduce((acc, type) => {
            const typeVels = s.pitches.filter(p => p.type === type && p.velocity).map(p => p.velocity as number);
            acc[`avgVelocity_${type}`] = typeVels.length > 0 
              ? Math.round(typeVels.reduce((a, b) => a + b, 0) / typeVels.length) 
              : null;
            return acc;
          }, {} as Record<string, number | null>)
        };
      })
    })).sort((a, b) => b.lastDate - a.lastDate);
  }, [sessions, pitchers]);

  const selectedPitcher = useMemo(() => {
    return uniquePitchers.find(p => p.name === selectedPitcherName);
  }, [uniquePitchers, selectedPitcherName]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10 hidden md:block" style={{ borderTop: `4px solid ${teamSettings.color}` }}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white overflow-hidden"
              style={{ backgroundColor: teamSettings.color }}
            >
              {teamSettings.logo ? (
                <img src={teamSettings.logo} alt="Team Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Activity size={20} />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Bullpen Tracker</h1>
            
            <nav className="ml-8 flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setView('list')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                  view === 'list' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Sessions
              </button>
              <button
                onClick={() => setView('pitchers')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                  (view === 'pitchers' || view === 'pitcher_detail') ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Pitchers
              </button>
              <button
                onClick={() => setView('settings')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-bold transition-all",
                  view === 'settings' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                Settings
              </button>
            </nav>
          </div>
          
          <button 
            onClick={startNewSession}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            {teamSettings.logo && (
              <img src={teamSettings.logo} alt="Logo" className="w-5 h-5 rounded-md object-cover" referrerPolicy="no-referrer" />
            )}
            <Plus size={18} />
            New Session
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50 px-4 py-3 flex items-center justify-between pb-safe">
        <button
          onClick={() => setView('list')}
          className="flex flex-col items-center gap-1 transition-colors"
          style={{ color: view === 'list' ? teamSettings.color : '#a1a1aa' }}
        >
          <History size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Sessions</span>
        </button>
        
        <button
          onClick={() => setView('pitchers')}
          className="flex flex-col items-center gap-1 transition-colors"
          style={{ color: (view === 'pitchers' || view === 'pitcher_detail') ? teamSettings.color : '#a1a1aa' }}
        >
          <User size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Pitchers</span>
        </button>

        <button 
          onClick={startNewSession}
          className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform -mt-8 border-4 border-zinc-50 relative overflow-hidden"
        >
          {teamSettings.logo ? (
            <img src={teamSettings.logo} alt="Logo" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
          ) : (
            <Plus size={24} />
          )}
          {teamSettings.logo && <Plus size={20} className="absolute inset-0 m-auto text-white drop-shadow-md" />}
        </button>

        <button
          onClick={() => setView('settings')}
          className="flex flex-col items-center gap-1 transition-colors"
          style={{ color: view === 'settings' ? teamSettings.color : '#a1a1aa' }}
        >
          <Settings size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
                  <History size={20} />
                  Recent Sessions
                </h2>
              </div>

              {sessions.length === 0 ? (
                <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                    <Activity size={32} />
                  </div>
                  <h3 className="text-zinc-900 font-medium mb-1">No sessions yet</h3>
                  <p className="text-zinc-500 text-sm mb-6">Start your first bullpen session to track your progress.</p>
                  <button 
                    onClick={startNewSession}
                    className="font-semibold text-sm hover:underline flex items-center gap-2 justify-center"
                    style={{ color: teamSettings.color }}
                  >
                    {teamSettings.logo && <img src={teamSettings.logo} alt="Logo" className="w-4 h-4 rounded-sm object-cover" referrerPolicy="no-referrer" />}
                    Start tracking now
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sessions.map(session => (
                    <div 
                      key={session.id}
                      className="bg-white border border-zinc-200 rounded-xl p-4 transition-colors group cursor-pointer"
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = teamSettings.color + '40'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e4e4e7'}
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setSummarySource('list');
                        setView('summary');
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">
                              {session.pitcherName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {session.pitches.length} pitches
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session.id);
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                          {(() => {
                            const strikes = session.pitches.filter(p => p.outcome === PitchOutcome.STRIKE).length;
                            const balls = session.pitches.filter(p => p.outcome === PitchOutcome.BALL).length;
                            const total = session.pitches.length;
                            if (total === 0) return null;
                            return (
                              <>
                                <div style={{ width: `${(strikes/total)*100}%`, backgroundColor: teamSettings.color }} className="h-full" />
                                <div style={{ width: `${(balls/total)*100}%` }} className="bg-red-400 h-full" />
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-xs font-mono font-medium text-zinc-500">
                          {Math.round((session.pitches.filter(p => p.outcome === PitchOutcome.STRIKE).length / (session.pitches.length || 1)) * 100)}% Strike
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
                <button 
                  onClick={() => setView('list')}
                  className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium mb-6"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <h2 className="text-2xl font-black text-zinc-900 mb-2">New Session</h2>
                <p className="text-zinc-500 text-sm mb-8">Enter the pitcher's name to begin tracking.</p>
                
                <form onSubmit={confirmStartSession} className="space-y-6">
                  <div>
                    <label htmlFor="pitcherName" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Pitcher Name
                    </label>
                    <input
                      autoFocus
                      id="pitcherName"
                      type="text"
                      value={pitcherNameInput}
                      onChange={(e) => setPitcherNameInput(e.target.value)}
                      placeholder="e.g. Nolan Ryan"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': teamSettings.color + '33' } as any}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    style={{ backgroundColor: teamSettings.color }}
                  >
                    {teamSettings.logo && <img src={teamSettings.logo} alt="Logo" className="w-5 h-5 rounded-md object-cover" referrerPolicy="no-referrer" />}
                    Start Session
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'active' && activeSession && (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setShowCancelConfirmation(true)}
                  className="text-black hover:text-zinc-900 flex items-center gap-1 text-sm font-medium"
                >
                  <ChevronLeft size={18} />
                  Cancel
                </button>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: teamSettings.color }}>Live Session</p>
                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-black text-black">{activeSession.pitches.length} <span className="text-black font-light">Pitches</span></p>
                    {activeSession.pitches.length > 0 && (
                      <button
                        onClick={undoLastPitch}
                        className="p-2 bg-zinc-100 hover:bg-zinc-200 text-black rounded-full transition-all flex items-center gap-1.5 group"
                        title="Undo Last Pitch"
                      >
                        <Undo2 size={16} className="group-active:-rotate-45 transition-transform" />
                        <span className="text-[10px] font-bold uppercase pr-1">Undo</span>
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setShowFinishConfirmation(true)}
                  className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Finish
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-black uppercase tracking-wider">Record Pitch (Click Zone)</h3>
                      <button 
                        onClick={() => setShowActiveNotes(!showActiveNotes)}
                        className="md:hidden text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg"
                      >
                        {showActiveNotes ? 'Show Zone' : 'Show Notes'}
                      </button>
                    </div>
                    
                    {!showActiveNotes ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div 
                          className="relative w-full aspect-square bg-zinc-200 rounded-2xl border-4 border-zinc-300 overflow-hidden cursor-crosshair group"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            
                            // Strike zone is roughly 25% to 75% on both axes
                            const isStrike = x >= 25 && x <= 75 && y >= 25 && y <= 75;
                            setPendingPitch({ outcome: isStrike ? PitchOutcome.STRIKE : PitchOutcome.BALL, location: { x, y } });
                          }}
                        >
                          {/* Strike Zone Box */}
                          <div className="absolute inset-[25%] border-4 border-white/50 border-dashed rounded-sm pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Strike Zone</span>
                          </div>
                          
                          {/* Grid Lines */}
                          <div className="absolute inset-0 pointer-events-none opacity-30">
                            <div className="absolute inset-y-0 left-1/3 w-px bg-black" />
                            <div className="absolute inset-y-0 left-2/3 w-px bg-black" />
                            <div className="absolute inset-x-0 top-1/3 h-px bg-black" />
                            <div className="absolute inset-x-0 top-2/3 h-px bg-black" />
                          </div>

                          {/* Recent Pitches on Zone */}
                          {activeSession.pitches.map((p) => p.location && (
                            <motion.div
                              key={p.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: [0, 1.2, 1],
                                opacity: [0, 1, 1, 0] 
                              }}
                              transition={{ 
                                duration: 4,
                                times: [0, 0.1, 0.8, 1],
                                ease: "easeOut"
                              }}
                              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white shadow-xl pointer-events-none z-10"
                              style={{ 
                                left: `${p.location.x}%`, 
                                top: `${p.location.y}%`,
                                backgroundColor: p.outcome === PitchOutcome.STRIKE ? teamSettings.color : '#ef4444'
                              }}
                            >
                              <div className="absolute inset-0 rounded-full animate-ping bg-white/30" />
                            </motion.div>
                          ))}
                        </div>
                        <p className="text-[10px] text-black mt-2 text-center uppercase font-bold tracking-widest">Click inside the dashed box for a Strike, outside for a Ball</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm h-[400px] flex flex-col">
                          <textarea
                            placeholder="Record observations about mechanics, effort, or feel..."
                            className="w-full h-full resize-none border-none focus:ring-0 text-black text-sm leading-relaxed placeholder:text-black/30"
                            value={activeSession.notes || ''}
                            onChange={(e) => {
                              const updatedSession = {
                                ...activeSession,
                                notes: e.target.value
                              };
                              setActiveSession(updatedSession);
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-black uppercase font-bold tracking-widest text-center">Notes are saved with the session summary</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="hidden md:block space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wider">Player Notes</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-saving
                    </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm h-full flex flex-col">
                    <textarea
                      placeholder="Record observations about mechanics, effort, or feel..."
                      className="w-full h-[400px] resize-none border-none focus:ring-0 text-black text-sm leading-relaxed placeholder:text-black/30"
                      value={activeSession.notes || ''}
                      onChange={(e) => {
                        const updatedSession = {
                          ...activeSession,
                          notes: e.target.value
                        };
                        setActiveSession(updatedSession);
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-black uppercase font-bold tracking-widest text-center">Notes are saved with the session summary</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'pitchers' && (
            <motion.div 
              key="pitchers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900">Pitchers</h2>
                  <p className="text-zinc-500 text-sm">Manage and view pitcher performance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniquePitchers.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white border border-zinc-200 rounded-3xl">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
                      <User size={32} />
                    </div>
                    <p className="text-zinc-500 font-medium">No pitchers found</p>
                    <p className="text-zinc-400 text-sm">Start a session to add a pitcher</p>
                  </div>
                ) : (
                  uniquePitchers.map((pitcher) => (
                    <div 
                      key={pitcher.name}
                      className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group relative"
                    >
                      <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPitcher({ 
                              id: pitchers.find(p => p.name === pitcher.name)?.id || crypto.randomUUID(),
                              name: pitcher.name,
                              profilePicture: pitcher.profilePicture
                            });
                          }}
                          className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPitcherToDelete({
                              id: pitchers.find(p => p.name === pitcher.name)?.id || crypto.randomUUID(),
                              name: pitcher.name,
                              profilePicture: pitcher.profilePicture
                            });
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div 
                        onClick={() => {
                          setSelectedPitcherName(pitcher.name);
                          setView('pitcher_detail');
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-600 transition-colors overflow-hidden"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = teamSettings.color + '10';
                                e.currentTarget.style.color = teamSettings.color;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#f4f4f5';
                                e.currentTarget.style.color = '#52525b';
                              }}
                            >
                              {pitcher.profilePicture ? (
                                <img src={pitcher.profilePicture} alt={pitcher.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={24} />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-900 text-lg">{pitcher.name}</h3>
                              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                {pitcher.lastDate > 0 ? `Last Session: ${new Date(pitcher.lastDate).toLocaleDateString()}` : 'No sessions yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-50 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Sessions</p>
                            <p className="text-xl font-black text-zinc-900">{pitcher.sessionCount}</p>
                          </div>
                          <div className="bg-zinc-50 rounded-2xl p-3">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Pitches</p>
                            <p className="text-xl font-black text-zinc-900">{pitcher.totalPitches}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'pitcher_detail' && selectedPitcher && (
            <motion.div 
              key="pitcher_detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView('pitchers')}
                  className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium"
                >
                  <ChevronLeft size={18} />
                  Back to Pitchers
                </button>
                <div className="text-right flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center text-zinc-400">
                    {selectedPitcher.profilePicture ? (
                      <img src={selectedPitcher.profilePicture} alt={selectedPitcher.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pitcher Profile</p>
                    <h2 className="text-2xl font-black text-zinc-900">{selectedPitcher.name}</h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total Bullpens</p>
                  <p className="text-2xl md:text-3xl font-black text-zinc-900">{selectedPitcher.sessionCount}</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total Pitches</p>
                  <p className="text-2xl md:text-3xl font-black text-zinc-900">{selectedPitcher.totalPitches}</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Strike %</p>
                  <p className="text-2xl md:text-3xl font-black" style={{ color: teamSettings.color }}>
                    {Math.round((selectedPitcher.strikes / (selectedPitcher.totalPitches || 1)) * 100)}%
                  </p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Strikes / Balls</p>
                  <p className="text-lg md:text-xl font-black text-zinc-900">
                    <span className="text-emerald-600">{selectedPitcher.strikes}</span>
                    <span className="text-zinc-300 mx-1">/</span>
                    <span className="text-red-500">{selectedPitcher.balls}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <BarChart3 size={18} style={{ color: teamSettings.color }} />
                  Performance Trends
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedPitcher.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 800, color: '#18181b', marginBottom: '4px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                      <Line 
                        type="monotone" 
                        dataKey="strikePercentage" 
                        name="Strike %" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pitchCount" 
                        name="Pitch Count" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      {Object.values(PitchType).map((type, idx) => {
                        const dataKey = `avgVelocity_${type}`;
                        if (selectedPitcher.trendData.some(d => (d as any)[dataKey] !== null)) {
                          return (
                            <Line 
                              key={type}
                              type="monotone" 
                              dataKey={dataKey} 
                              name={`${type} Vel`} 
                              stroke={COLORS[(idx + 3) % COLORS.length]} 
                              strokeWidth={2}
                              dot={{ r: 3, fill: COLORS[(idx + 3) % COLORS.length], strokeWidth: 1, stroke: '#fff' }}
                              activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                          );
                        }
                        return null;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <Target size={18} style={{ color: teamSettings.color }} />
                    Aggregate Pitch Map
                  </h3>
                  <div className="relative w-full aspect-square bg-zinc-100 rounded-xl border-2 border-zinc-200 overflow-hidden">
                    <div className="absolute inset-[25%] border-2 border-zinc-300 border-dashed rounded-sm pointer-events-none" />
                    {selectedPitcher.allPitches.map((p, idx) => p.location && (
                      <div
                        key={`${p.id}-${idx}`}
                        className={cn(
                          "absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full border border-white shadow-sm opacity-60",
                          p.outcome === PitchOutcome.STRIKE ? "bg-emerald-500" : "bg-red-500"
                        )}
                        style={{ left: `${p.location.x}%`, top: `${p.location.y}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Strike</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Ball</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                      <History size={18} style={{ color: teamSettings.color }} />
                      Aggregate Pitch Mix
                    </h3>
                    <div className="space-y-4">
                      {(Object.entries(selectedPitcher.pitchTypeCounts) as [string, number][])
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => {
                          const percentage = Math.round((count / (selectedPitcher.totalPitches || 1)) * 100);
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-zinc-100 rounded-full overflow-hidden">
                                  <div 
                                    className="w-full bg-emerald-500 transition-all duration-500" 
                                    style={{ height: `${percentage}%`, marginTop: `${100 - percentage}%` }}
                                  />
                                </div>
                                <span className="font-bold text-zinc-900">{type}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-zinc-900">{count}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{percentage}%</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                      <Calendar size={18} style={{ color: teamSettings.color }} />
                      Recent Bullpens
                    </h3>
                    <div className="space-y-3">
                      {selectedPitcher.sessions.slice(0, 5).map(session => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            setSummarySource('pitcher_detail');
                            setView('summary');
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors group"
                        >
                          <div className="text-left">
                            <p className="text-sm font-bold text-zinc-900">
                              {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{session.pitches.length} Pitches</p>
                          </div>
                          <ArrowRight size={16} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'summary' && selectedSession && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView(summarySource)}
                  className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium"
                >
                  <ChevronLeft size={18} />
                  Back to {summarySource === 'list' ? 'Sessions' : 'Pitcher Profile'}
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Session Summary</p>
                  <p className="text-lg font-bold text-zinc-900">
                    {selectedSession.pitcherName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(selectedSession.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total Pitches</p>
                  <p className="text-2xl md:text-3xl font-black text-zinc-900">{selectedSession.pitches.length}</p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Strike %</p>
                  <p className="text-2xl md:text-3xl font-black text-emerald-600">
                    {Math.round((selectedSession.pitches.filter(p => p.outcome === PitchOutcome.STRIKE).length / (selectedSession.pitches.length || 1)) * 100)}%
                  </p>
                </div>
                <div className="bg-white border border-zinc-200 p-4 md:p-6 rounded-2xl shadow-sm col-span-2 md:col-span-1">
                  <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Top Pitch</p>
                  <p className="text-2xl md:text-3xl font-black text-zinc-900">
                    {(() => {
                      const counts: Record<string, number> = {};
                      selectedSession.pitches.forEach(p => counts[p.type] = (counts[p.type] || 0) + 1);
                      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                      return top ? top[0] : 'N/A';
                    })()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <Activity size={18} style={{ color: teamSettings.color }} />
                    Player Notes
                  </h3>
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed italic">
                      {selectedSession.notes || "No notes recorded for this session."}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <Target size={18} style={{ color: teamSettings.color }} />
                    Pitch Location Map
                  </h3>
                  <div className="relative w-full aspect-square bg-zinc-100 rounded-xl border-2 border-zinc-200 overflow-hidden">
                    {/* Strike Zone Box */}
                    <div className="absolute inset-[25%] border-2 border-zinc-300 border-dashed rounded-sm pointer-events-none" />
                    
                    {/* Pitches */}
                    {selectedSession.pitches.map((p) => p.location && (
                      <div
                        key={p.id}
                        className={cn(
                          "absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border border-white shadow-sm",
                          p.outcome === PitchOutcome.STRIKE ? "bg-emerald-500" : "bg-red-500"
                        )}
                        style={{ left: `${p.location.x}%`, top: `${p.location.y}%` }}
                        title={`${p.type} - ${p.outcome}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Strike</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Ball</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <BarChart3 size={18} style={{ color: teamSettings.color }} />
                    Pitch Distribution
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(() => {
                            const counts: Record<string, number> = {};
                            selectedSession.pitches.forEach(p => counts[p.type] = (counts[p.type] || 0) + 1);
                            const total = selectedSession.pitches.length || 1;
                            return Object.entries(counts).map(([name, value]) => ({ 
                              name, 
                              value,
                              percentage: Math.round((value / total) * 100)
                            }));
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                        >
                          {Object.values(PitchType).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value} pitches (${props.payload.percentage}%)`, 
                            name
                          ]}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry: any) => {
                            const { payload } = entry;
                            return (
                              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                {value}: {payload.value} ({payload.percentage}%)
                              </span>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <Target size={18} className="text-emerald-500" />
                    Accuracy by Pitch Type
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const data: Record<string, { name: string, strike: number, ball: number }> = {};
                          selectedSession.pitches.forEach(p => {
                            if (!data[p.type]) data[p.type] = { name: p.type, strike: 0, ball: 0 };
                            if (p.outcome === PitchOutcome.STRIKE) data[p.type].strike++;
                            else data[p.type].ball++;
                          });
                          return Object.values(data);
                        })()}
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} fontSize={10} fontWeight="bold" />
                        <Tooltip />
                        <Bar dataKey="strike" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="ball" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-900">Pitch Log</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-100">
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Type</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Outcome</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">MPH</th>
                      <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedSession.pitches.map((pitch, idx) => (
                      <tr key={pitch.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-zinc-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-bold text-zinc-900">{pitch.type}</td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                            style={{ 
                              backgroundColor: pitch.outcome === PitchOutcome.STRIKE ? teamSettings.color + '20' : '#fee2e2',
                              color: pitch.outcome === PitchOutcome.STRIKE ? teamSettings.color : '#b91c1c'
                            }}
                          >
                            {pitch.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-zinc-900">
                          {pitch.velocity || <span className="text-zinc-300">--</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">
                          {new Date(pitch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900">Settings</h2>
                  <p className="text-zinc-500 text-sm">Customize your team profile and preferences</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                      <Palette size={18} style={{ color: teamSettings.color }} />
                      Team Branding
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-1">Team Color</label>
                        <div className="flex flex-wrap gap-3">
                          {['#059669', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#18181b'].map(color => (
                            <button
                              key={color}
                              onClick={() => setTeamSettings({ ...teamSettings, color })}
                              className={cn(
                                "w-10 h-10 rounded-full border-2 transition-all",
                                teamSettings.color === color ? "border-zinc-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <div className="relative">
                            <input 
                              type="color" 
                              value={teamSettings.color}
                              onChange={(e) => setTeamSettings({ ...teamSettings, color: e.target.value })}
                              className="w-10 h-10 rounded-full border-2 border-zinc-100 cursor-pointer overflow-hidden p-0"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-1">Team Logo</label>
                        <div className="flex items-center gap-6">
                          <div 
                            className="w-24 h-24 rounded-3xl flex items-center justify-center text-white overflow-hidden border-2 border-zinc-100 shadow-inner"
                            style={{ backgroundColor: teamSettings.color }}
                          >
                            {teamSettings.logo ? (
                              <img src={teamSettings.logo} alt="Team Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Activity size={40} />
                            )}
                          </div>
                          <div className="space-y-3">
                            <label className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm">
                              <Upload size={16} />
                              Upload Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setTeamSettings({ ...teamSettings, logo: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {teamSettings.logo && (
                              <button 
                                onClick={() => setTeamSettings({ ...teamSettings, logo: undefined })}
                                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-1"
                              >
                                Remove Logo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <Activity size={18} style={{ color: teamSettings.color }} />
                    Preview
                  </h3>
                  <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-inner bg-zinc-50 p-4">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="h-10 border-b border-zinc-100 flex items-center px-3 justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white overflow-hidden"
                            style={{ backgroundColor: teamSettings.color }}
                          >
                            {teamSettings.logo ? (
                              <img src={teamSettings.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Activity size={12} />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-900">Bullpen Tracker</span>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-center h-24">
                         <div className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                           {teamSettings.logo && <img src={teamSettings.logo} alt="Logo" className="w-3 h-3 rounded-sm object-cover" referrerPolicy="no-referrer" />}
                           <Plus size={12} />
                           New Session
                         </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-4 text-center font-medium">This is how your branding will appear in the app.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {pendingPitch && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingPitch(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black">Select Pitch Type</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
                    <span className="text-[10px] font-bold text-black uppercase">MPH</span>
                    <input 
                      type="number" 
                      placeholder="--"
                      className="w-12 bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-black placeholder:text-black/30"
                      value={pitchVelocityInput}
                      onChange={(e) => setPitchVelocityInput(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ 
                      backgroundColor: pendingPitch.outcome === PitchOutcome.STRIKE ? teamSettings.color + '20' : '#fee2e2',
                      color: pendingPitch.outcome === PitchOutcome.STRIKE ? teamSettings.color : '#b91c1c'
                    }}
                  >
                    {pendingPitch.outcome}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.values(PitchType).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const velocity = pitchVelocityInput ? parseInt(pitchVelocityInput) : undefined;
                      addPitch(type, pendingPitch.outcome, pendingPitch.location, velocity);
                      setPendingPitch(null);
                      setPitchVelocityInput('');
                    }}
                    className="p-4 rounded-xl text-left border-2 border-zinc-100 bg-zinc-50 hover:border-emerald-500 hover:bg-emerald-50 transition-all font-bold text-black"
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setPendingPitch(null)}
                className="w-full mt-6 px-4 py-2.5 rounded-xl text-sm font-bold text-black hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}

        {editingPitcher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPitcher(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-zinc-900">Edit Pitcher</h3>
                <button onClick={() => setEditingPitcher(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-zinc-100 rounded-3xl overflow-hidden flex items-center justify-center text-zinc-400 border-2 border-zinc-100">
                      {editingPitcher.profilePicture ? (
                        <img src={editingPitcher.profilePicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                      <Camera size={24} className="text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditingPitcher({ ...editingPitcher, profilePicture: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Click to upload photo</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Pitcher Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-bold text-zinc-900"
                    value={editingPitcher.name}
                    onChange={(e) => setEditingPitcher({ ...editingPitcher, name: e.target.value })}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingPitcher(null)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const original = pitchers.find(p => p.id === editingPitcher.id) || uniquePitchers.find(p => p.name === editingPitcher.name);
                      const oldName = original?.name || editingPitcher.name;
                      updatePitcher(oldName, editingPitcher.name, editingPitcher.profilePicture);
                      setEditingPitcher(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {pitcherToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPitcherToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Delete Pitcher?</h3>
                  <p className="text-sm text-zinc-500">This will permanently delete <strong>{pitcherToDelete.name}</strong> and all their associated bullpen sessions.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setPitcherToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deletePitcher(pitcherToDelete.name);
                    setPitcherToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showFinishConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFinishConfirmation(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Finish Session?</h3>
                  <p className="text-sm text-zinc-500">Are you sure you want to end this session and save the results?</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishConfirmation(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Continue Tracking
                </button>
                <button
                  onClick={finishSession}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Yes, Finish
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showCancelConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirmation(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Discard Session?</h3>
                  <p className="text-sm text-zinc-500">All recorded pitches and notes for this session will be lost.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirmation(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  No, Keep It
                </button>
                <button
                  onClick={() => {
                    setActiveSession(null);
                    setView('list');
                    setShowCancelConfirmation(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  Yes, Discard
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {sessionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSessionToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Delete Session?</h3>
                  <p className="text-sm text-zinc-500">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSessionToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (sessionToDelete) {
                      deleteSession(sessionToDelete);
                      setSessionToDelete(null);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
