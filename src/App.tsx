import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { StoreProvider } from './lib/storeContext';
import { AuthProvider, useAuth } from './lib/authContext';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';

// Eager (lightweight) pages.
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Classes } from './pages/Classes';
import { Settings } from './pages/Settings';
import { ClassDetail } from './pages/ClassDetail';

// Heavy pages are lazy-loaded to keep the initial bundle lean (spec §7.6).
// MemberProfile pulls in Recharts, so it's split off too.
const BoardBuilder = lazy(() =>
  import('./pages/BoardBuilder').then((m) => ({ default: m.BoardBuilder })),
);
const PreGame = lazy(() =>
  import('./pages/PreGame').then((m) => ({ default: m.PreGame })),
);
const Gameplay = lazy(() =>
  import('./pages/Gameplay').then((m) => ({ default: m.Gameplay })),
);
const Results = lazy(() =>
  import('./pages/Results').then((m) => ({ default: m.Results })),
);
const MemberProfile = lazy(() =>
  import('./pages/MemberProfile').then((m) => ({ default: m.MemberProfile })),
);

function PageLoader() {
  return (
    <div className="grid place-items-center py-32 text-text-muted">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );
}

/** Gates the whole app behind the admin login (convenience gate, see §6.1). */
function Protected() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Login />;

  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:memberId" element={<MemberProfile />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassDetail />} />
          <Route path="/classes/:classId/board" element={<BoardBuilder />} />
          <Route path="/classes/:classId/setup" element={<PreGame />} />
          <Route path="/classes/:classId/play" element={<Gameplay />} />
          <Route path="/classes/:classId/results" element={<Results />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <HashRouter>
          <Protected />
        </HashRouter>
      </AuthProvider>
    </StoreProvider>
  );
}
