import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Onboarding Wizard State
 * Persisted in localStorage so the wizard only shows once.
 */
const useOnboardingStore = create(
  persist(
    (set, get) => ({
      /** Whether the user has completed or dismissed the wizard */
      completed: false,
      /** Current wizard step (1-3) */
      step: 1,
      /** User profile answers */
      profile: {
        userType: null,       // 'eu' | 'non_eu' | 'resident'
        interests: [],        // ['working', 'studying', 'business', 'tax', 'family']
        situation: null,      // 'already_here' | 'planning' | 'employer'
      },

      setStep: (step) => set({ step }),

      setUserType: (userType) =>
        set((s) => ({ profile: { ...s.profile, userType } })),

      toggleInterest: (interest) =>
        set((s) => {
          const prev = s.profile.interests;
          const next = prev.includes(interest)
            ? prev.filter((i) => i !== interest)
            : [...prev, interest];
          return { profile: { ...s.profile, interests: next } };
        }),

      setSituation: (situation) =>
        set((s) => ({ profile: { ...s.profile, situation } })),

      complete: () => set({ completed: true }),

      reset: () =>
        set({ completed: false, step: 1, profile: { userType: null, interests: [], situation: null } }),

      /** Derived: suggested category based on interests */
      getSuggestedCategory: () => {
        const { interests } = get().profile;
        if (interests.includes('working') || interests.includes('studying')) return 'immigration';
        if (interests.includes('tax')) return 'tax';
        if (interests.includes('business')) return 'business';
        if (interests.includes('family')) return 'immigration';
        return null;
      },

      /** Derived: personalized welcome message */
      getWelcomeContext: () => {
        const { userType, interests, situation } = get().profile;
        const parts = [];
        if (userType === 'non_eu') parts.push('non-EU citizen');
        if (userType === 'eu') parts.push('EU citizen');
        if (userType === 'resident') parts.push('Danish resident');
        if (situation === 'planning') parts.push('planning to move to Denmark');
        if (situation === 'already_here') parts.push('currently in Denmark');
        if (situation === 'employer') parts.push('hiring in Denmark');
        return parts.join(', ');
      },
    }),
    {
      name: 'danish-legal-onboarding',
      partialize: (s) => ({ completed: s.completed, profile: s.profile }),
    }
  )
);

export default useOnboardingStore;
