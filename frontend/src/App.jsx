import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useThemeStore from './store/useThemeStore';
import useOnboardingStore from './store/useOnboardingStore';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Laws from './pages/Laws';
import About from './pages/About';
import Admin from './pages/Admin';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import ToastProvider from './components/ui/Toast';

export default function App() {
  const { initTheme } = useThemeStore();
  const { completed, showWizard, completeOnboarding, skipOnboarding, initOnboarding } = useOnboardingStore();

  useEffect(() => {
    initTheme();
    // Small delay so the app renders before wizard appears
    setTimeout(() => initOnboarding(), 600);
  }, [initTheme, initOnboarding]);

  return (
    <BrowserRouter>
      <ToastProvider />

      {/* Onboarding Wizard overlay */}
      <AnimatePresence>
        {showWizard && (
          <OnboardingWizard
            onComplete={completeOnboarding}
            onSkip={skipOnboarding}
          />
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="laws" element={<Laws />} />
          <Route path="about" element={<About />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
