import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Clock, ChevronDown, ChevronUp, Trash2, Download, X } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'danish-legal-checklists';

function loadChecklists() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveChecklists(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const PRESET_CHECKLISTS = [
  {
    id: 'work-permit',
    title: 'Get a Danish Work Permit',
    steps: [
      { id: 1, text: 'Check if you need a work permit (EU/EEA citizens are exempt)',       timeline: 'Day 1',    done: false },
      { id: 2, text: 'Get a job offer from a Danish employer',                              timeline: 'Week 1-4', done: false },
      { id: 3, text: 'Employer submits application via SIRI (on your behalf)',             timeline: 'Day 1',    done: false },
      { id: 4, text: 'Pay application fee (DKK 4,165 for most permits)',                   timeline: 'Day 2',    done: false },
      { id: 5, text: 'Submit biometrics at Danish Embassy or Citizen Service',             timeline: 'Week 1',   done: false },
      { id: 6, text: 'Wait for processing (typically 30-60 days)',                         timeline: '1-2 months', done: false },
      { id: 7, text: 'Receive permit — register at local municipality (folkeregister)',    timeline: 'Day 1',    done: false },
      { id: 8, text: 'Apply for Danish CPR number',                                       timeline: 'Week 1',   done: false },
      { id: 9, text: 'Open Danish bank account and get NemKonto',                         timeline: 'Week 2',   done: false },
      { id: 10, text: 'Get SKAT tax card (skattekortet)',                                  timeline: 'Week 2',   done: false },
    ],
  },
  {
    id: 'start-business',
    title: 'Start a Business in Denmark',
    steps: [
      { id: 1, text: 'Choose your business type (ApS, A/S, enkeltmandsvirksomhed, etc.)', timeline: 'Day 1',    done: false },
      { id: 2, text: 'Check minimum capital requirements (ApS requires DKK 40,000)',       timeline: 'Day 1',    done: false },
      { id: 3, text: 'Register company at virk.dk (takes ~1 day)',                        timeline: 'Day 2',    done: false },
      { id: 4, text: 'Get your CVR (company registration) number',                        timeline: 'Day 3',    done: false },
      { id: 5, text: 'Register for VAT (moms) if turnover exceeds DKK 50,000/year',       timeline: 'Week 1',   done: false },
      { id: 6, text: 'Set up business bank account',                                      timeline: 'Week 1',   done: false },
      { id: 7, text: 'Register for employer tax if hiring employees',                     timeline: 'Week 2',   done: false },
      { id: 8, text: 'Set up accounting system (required by Danish law)',                  timeline: 'Week 2',   done: false },
      { id: 9, text: 'Consult a Danish accountant (revisor) for first filing',            timeline: 'Month 3',  done: false },
    ],
  },
  {
    id: 'tax-registration',
    title: 'Register for Danish Tax',
    steps: [
      { id: 1, text: 'Get your CPR number (required for tax registration)',               timeline: 'Day 1',    done: false },
      { id: 2, text: 'Create NemID / MitID digital identity',                            timeline: 'Day 2',    done: false },
      { id: 3, text: 'Log in to skat.dk and request preliminary tax assessment',          timeline: 'Day 3',    done: false },
      { id: 4, text: 'Set up your tax card (skattekortet) for your employer',             timeline: 'Week 1',   done: false },
      { id: 5, text: 'Understand Danish tax brackets (bottom 12.10%, top 15%)',           timeline: 'Week 1',   done: false },
      { id: 6, text: 'Check eligibility for the researcher/expat tax scheme (26%)',       timeline: 'Week 1',   done: false },
      { id: 7, text: 'File annual tax return by May 1 (or get extension)',               timeline: 'May 1',    done: false },
    ],
  },
];

export default function ChecklistGenerator({ onClose }) {
  const [checklists, setChecklists] = useState(loadChecklists);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'presets'

  useEffect(() => { saveChecklists(checklists); }, [checklists]);

  const addPreset = (preset) => {
    const exists = checklists.find((c) => c.id === preset.id);
    if (exists) { toast.error('Checklist already added!'); return; }
    const newList = { ...preset, steps: preset.steps.map((s) => ({ ...s })), createdAt: Date.now() };
    setChecklists((prev) => [newList, ...prev]);
    setActiveId(newList.id);
    setView('list');
    toast.success(`✅ "${preset.title}" checklist added!`);
  };

  const toggleStep = (checklistId, stepId) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? { ...c, steps: c.steps.map((s) => s.id === stepId ? { ...s, done: !s.done } : s) }
          : c
      )
    );
  };

  const deleteChecklist = (id) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    toast.success('Checklist removed');
  };

  const getProgress = (checklist) => {
    const done = checklist.steps.filter((s) => s.done).length;
    return { done, total: checklist.steps.length, pct: Math.round((done / checklist.steps.length) * 100) };
  };

  const active = checklists.find((c) => c.id === activeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-2xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-navy-500 dark:text-white">Checklist Generator</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Track your legal journey step by step</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'list' ? 'presets' : 'list')}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors"
            >
              {view === 'list' ? '+ Add Checklist' : '← My Checklists'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'presets' ? (
              <motion.div key="presets" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a pre-built checklist to track your progress:</p>
                {PRESET_CHECKLISTS.map((preset) => {
                  const already = checklists.find((c) => c.id === preset.id);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => addPreset(preset)}
                      disabled={!!already}
                      className={clsx(
                        'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                        already
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 cursor-not-allowed'
                          : 'border-gray-200 dark:border-navy-600 hover:border-nordic-300 dark:hover:border-nordic-600 hover:bg-nordic-50 dark:hover:bg-nordic-900/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-navy-500 dark:text-white text-sm">{preset.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{preset.steps.length} steps</p>
                        </div>
                        {already ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Added</span>
                        ) : (
                          <span className="text-xs text-nordic-500 font-medium">+ Add</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            ) : checklists.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-navy-500 dark:text-white font-semibold mb-2">No checklists yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add a pre-built checklist to track your legal journey</p>
                <button
                  onClick={() => setView('presets')}
                  className="px-4 py-2 rounded-xl bg-navy-500 text-white text-sm hover:bg-navy-600 transition-colors"
                >
                  Browse Checklists
                </button>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full">
                {/* Sidebar list */}
                <div className="w-48 border-r border-gray-100 dark:border-navy-700 p-3 space-y-1.5 flex-shrink-0">
                  {checklists.map((c) => {
                    const { done, total, pct } = getProgress(c);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveId(c.id)}
                        className={clsx(
                          'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150',
                          activeId === c.id
                            ? 'bg-navy-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <p className="text-xs font-semibold truncate">{c.title}</p>
                        <p className={clsx('text-xs mt-0.5', activeId === c.id ? 'text-white/70' : 'text-gray-400')}>
                          {done}/{total} · {pct}%
                        </p>
                        <div className="mt-1.5 h-1 rounded-full bg-white/20 dark:bg-navy-600 overflow-hidden">
                          <div
                            className={clsx('h-full rounded-full transition-all', pct === 100 ? 'bg-emerald-400' : activeId === c.id ? 'bg-white' : 'bg-nordic-400')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Steps */}
                {active ? (
                  <div className="flex-1 p-5 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-navy-500 dark:text-white">{active.title}</h3>
                        {(() => { const { done, total, pct } = getProgress(active); return (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{done} of {total} steps done · {pct}%</p>
                        ); })()}
                      </div>
                      <button
                        onClick={() => deleteChecklist(active.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress bar */}
                    {(() => { const { pct } = getProgress(active); return (
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-navy-700 mb-4 overflow-hidden">
                        <motion.div
                          className={clsx('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : 'bg-nordic-500')}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    ); })()}

                    <div className="space-y-2">
                      {active.steps.map((step) => (
                        <button
                          key={step.id}
                          onClick={() => toggleStep(active.id, step.id)}
                          className={clsx(
                            'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200',
                            step.done
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600 hover:border-gray-300 dark:hover:border-navy-500'
                          )}
                        >
                          {step.done ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={clsx('text-sm', step.done && 'line-through text-gray-400 dark:text-gray-500')}>{step.text}</p>
                          </div>
                          {step.timeline && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                              <Clock className="w-3 h-3" />{step.timeline}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    Select a checklist
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
