import { NavLink } from 'react-router-dom';

const appLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/meal-upload', label: 'Meal Upload' },
  { to: '/chat', label: 'AI Chat' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar({ hasCompletedOnboarding }) {
  const links = hasCompletedOnboarding ? appLinks : [{ to: '/onboarding', label: 'Onboarding' }];

  return (
    <header className="navbar">
      <NavLink to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} className="brand">
        <span className="brand-mark">W</span>
        <span>WellBeeing</span>
      </NavLink>
      <nav className="nav-links" aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
