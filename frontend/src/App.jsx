import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MealUploadPage from './pages/MealUploadPage.jsx';
import AIChatPage from './pages/AIChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { useSession } from './context/SessionProvider.jsx';

export default function App() {
  const { status, completeSession } = useSession();
  const hasSession = status === 'authenticated';

  function handleOnboardingComplete(nextUser) {
    completeSession(nextUser);
  }

  function protectedRoute(page) {
    return hasSession ? page : <Navigate to="/onboarding" replace />;
  }

  if (status === 'checking') {
    return (
      <div className="app-shell">
        <main className="app-main narrow-page">
          <p className="soft-note">Restoring session…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar hasCompletedOnboarding={hasSession} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to={hasSession ? '/dashboard' : '/onboarding'} replace />} />
          <Route
            path="/onboarding"
            element={hasSession ? <Navigate to="/dashboard" replace /> : <OnboardingPage onComplete={handleOnboardingComplete} />}
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
