import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Briefcase, Home, Check, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  {
    id: 'who',
    title: 'Who are you?',
    subtitle: 'Help us personalize your experience',
    emoji: '👋',
    options: [
      { id: 'eu_citizen',       label: 'EU Citizen',       desc: 'Living or working in the EU', icon: '🇪🇺' },
      { id: 'non_eu_citizen',   label: 'Non-EU Citizen',   desc: 'Coming from outside the EU',  icon: '🌍' },
      { id: 'danish_resident',  label: 'Danish Resident',  desc: 'Already living in Denmark',   icon: '🇩🇰' },
      { id: 'employer',         label: 'Employer / HR',    desc: 'Hiring someone in Denmark',   icon: '🏢' },
    ],
  },
  {
    id: 'interest',
    title: 'What are you interested in?',
    subtitle: 'Select all that apply',
    emoji: '🎯',
    multi: true,
    options: [
      { id: 'working',          label: 'Working',           desc: 'Work permits, employment',   icon: '💼' },
      { id: 'studying',         label: 'Studying',          desc: 'Student visas, education',   icon: '📚' },
      { id: 'business',         label: 'Starting Business', desc: 'Company setup, regulations', icon: '🚀' },
      { id: 'tax',              label: 'Tax & Finance',     desc: 'Income tax, VAT, deductions', icon: '💰' },
      { id: 'family',           label: 'Family',            desc: 'Family reunification',       icon: '👨‍👩‍👧' },
    ],
  },
  {
    id: 'situation',
    title: 'Your current situation?',
    subtitle: 'This helps us tailor recommendations',
    emoji: '📍',
    options: [
      { id: 'already_in_dk',   label: 'Already in Denmark', desc: 'Need info for current life',   icon: '🏠' },
      { id: 'planning_move',   label: 'Planning to Move',   desc: 'Preparing for relocation',     icon: '✈️' },
      { id: 'just_arrived',    label: 'Just Arrived',       desc: 'Recently moved, need help',    icon: '🆕' },
      { id: 'remote_planning', label: 'Researching',        desc: 'Exploring my options',         icon: '🔍' },
    ],
  },
];

/** Maps user profile → category priorities for personalization */
export function getPersonalizationContext(profile) {
  if (!profile) return null;
  const lines = [];

  const whoMap = {
    eu_citizen:      'EU citizen',
    non_eu_citizen:  'non-EU citizen',
    danish_resident: 'Danish resident',
    employer:        'employer/HR professional',
  };
  if (profile.who) lines.push(`User type: ${whoMap[profile.who] || profile.who}`);

  if (profile.interests?.length) {
    lines.push(`Interests: ${profile.interests.join(', ')}`);
  }

  const situationMap = {
    already_in_dk:   'already living in Denmark',
    planning_move:   'planning to move to Denmark',
    just_arrived:    'recently arrived in Denmark',
    remote_planning: 'researching from abroad',
  };
  if (profile.situation) lines.push(`Situation: ${situationMap[profile.situation] || profile.situation}`);

  return lines.length ? lines.join('. ') + '.' : null;
}

export function getPersonalizedCategories(profile) {
  if (!profile) return null;
  const cats = new Set();

  const interestCatMap = {
    working:  'immigration',
    studying: 'immigration',
    business: 'business',
    tax:      'tax',
    family:   'immigration',
  };

  (profile.interests || []).forEach((i) => {
    if (interestCatMap[i]) cats.add(interestCatMap[i]);
  });

  if (profile.who === 'employer') cats.add('labor');
  return cats.size ? [...cats] : null;
}

export default function OnboardingWizard({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ who: null, interests: [], situation: null });
  const [direction, setDirection] = useState(1);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleSelect = (optId) => {
    if (current.multi) {
      setAnswers((a) => {
        const list = a.interests.includes(optId)
          ? a.interests.filter((x) => x !== optId)
          : [...a.interests, optId];
        return { ...a, interests: list };
      });
    } else {
      setAnswers((a) => ({ ...a, [current.id]: optId }));
    }
  };

  const isSelected = (optId) => {
    if (current.multi) return answers.interests.includes(optId);
    return answers[current.id] === optId;
  };

  const canNext = current.multi
    ? answers.interests.length > 0
    : !!answers[current.id];

  const handleNext = () => {
    if (!canNext) return;
    if (isLast) {
      onComplete(answers);
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const variants = {
    enter:  (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{    scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-lg bg-white dark:bg-navy-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step  ? 'w-6 bg-nordic-500' :
                  i <  step   ? 'w-3 bg-nordic-300 dark:bg-nordic-700' :
                                'w-3 bg-gray-200 dark:bg-navy-600'
                )}
              />
            ))}
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700"
            aria-label="Skip onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* Title */}
              <div className="text-center mb-6 pt-2">
                <div className="text-4xl mb-3">{current.emoji}</div>
                <h2 className="text-xl font-bold text-navy-500 dark:text-white mb-1">
                  {current.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {current.subtitle}
                </p>
              </div>

              {/* Options grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {current.options.map((opt) => {
                  const selected = isSelected(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      className={clsx(
                        'relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border-2 text-left',
                        'transition-all duration-200 group',
                        selected
                          ? 'border-nordic-500 bg-nordic-50 dark:bg-nordic-900/30'
                          : 'border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 hover:border-gray-300 dark:hover:border-navy-500'
                      )}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-nordic-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <p className={clsx(
                          'text-sm font-semibold',
                          selected ? 'text-nordic-700 dark:text-nordic-300' : 'text-navy-500 dark:text-white'
                        )}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-navy-700 bg-gray-50 dark:bg-navy-900/50">
          <button
            onClick={step === 0 ? onSkip : handleBack}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {step === 0 ? 'Skip for now' : '← Back'}
          </button>

          <button
            onClick={handleNext}
            disabled={!canNext}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              canNext
                ? 'bg-navy-500 dark:bg-nordic-600 text-white hover:bg-navy-600 dark:hover:bg-nordic-700 shadow-sm hover:shadow-md'
                : 'bg-gray-200 dark:bg-navy-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            )}
          >
            {isLast ? (
              <>Personalize my experience <Check className="w-4 h-4" /></>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
