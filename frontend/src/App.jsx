import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MealUploadPage from './pages/MealUploadPage.jsx';
import AIChatPage from './pages/AIChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => Boolean(localStorage.getItem('wellbeeingUser')));

  function completeOnboarding() {
    setHasCompletedOnboarding(true);
  }

  function protectedRoute(page) {
    return hasCompletedOnboarding ? page : <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-shell">
      <Navbar hasCompletedOnboarding={hasCompletedOnboarding} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />} />
          <Route
            path="/onboarding"
            element={
              hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <OnboardingPage onComplete={completeOnboarding} />
            }
          />
          <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />
          <Route path="/meal-upload" element={protectedRoute(<MealUploadPage />)} />
          <Route path="/chat" element={protectedRoute(<AIChatPage />)} />
          <Route path="/profile" element={protectedRoute(<ProfilePage />)} />
        </Routes>
      </main>
    </div>
  );
}
