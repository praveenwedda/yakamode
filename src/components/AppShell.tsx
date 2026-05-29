import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut } from 'lucide-react';
import { Wordmark } from './Wordmark';
import { useAuth } from '../lib/authContext';
import { cn } from '../lib/cn';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/classes', label: 'Classes', icon: CalendarDays, end: false },
  { to: '/members', label: 'Members', icon: Users, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { logout, email } = useAuth();
  const location = useLocation();

  // The gameplay screen is meant for a big gym display — render it chrome-free
  // so the board/dice get the full viewport.
  const isFullscreen = location.pathname.includes('/play');
  if (isFullscreen) return <>{children}</>;

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-base/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Wordmark />

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand/20 text-text-primary border border-brand/30'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent',
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {email && (
              <span className="hidden lg:inline text-xs text-text-muted max-w-[180px] truncate">
                {email}
              </span>
            )}
            <button
              onClick={() => void logout()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-brand/20 text-text-primary'
                    : 'text-text-muted hover:bg-white/5',
                )
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-border py-5 text-center text-xs text-text-muted">
        Anytime Fitness – Canberra City · Snakes &amp; Ladders workout game ·
        Data stored locally on this device
      </footer>
    </div>
  );
}
