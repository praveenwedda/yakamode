import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { coerce, emptyData, loadData, parseImport, saveData } from './store';
import { db, isFirebaseConfigured, SHARED_DOC } from './firebase';
import { useAuth } from './authContext';
import { uid } from './ids';
import type {
  AppData,
  AppSettings,
  Board,
  Exercise,
  GameSession,
  GymClass,
  Member,
} from '../types';

export type BackendKind = 'firebase' | 'local';

interface StoreContextValue {
  data: AppData;
  backend: BackendKind;
  /** Firestore connection state (firebase backend only). */
  synced: boolean;

  // Members
  addMember: (input: Pick<Member, 'name' | 'displayColor' | 'avatarInitials'>) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  setMemberArchived: (id: string, archived: boolean) => void;

  // Boards
  createBoard: (board: Omit<Board, 'id'>) => Board;
  updateBoard: (id: string, patch: Partial<Board>) => void;
  getBoard: (id: string) => Board | undefined;

  // Classes
  createClass: (input: Omit<GymClass, 'id' | 'createdAt'>) => GymClass;
  updateClass: (id: string, patch: Partial<GymClass>) => void;
  deleteClass: (id: string) => void;
  getClass: (id: string) => GymClass | undefined;

  // Sessions
  getSession: (classId: string) => GameSession | undefined;
  saveSession: (session: GameSession) => void;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;

  // Backup
  importAll: (jsonText: string) => void;
  replaceAll: (next: AppData) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const WRITE_DEBOUNCE_MS = 600;

export function StoreProvider({ children }: { children: ReactNode }) {
  const backend: BackendKind = isFirebaseConfigured ? 'firebase' : 'local';
  const { isAdmin } = useAuth();

  // In local mode we seed from localStorage; in firebase mode we wait for the
  // first Firestore snapshot (start empty).
  const [data, setDataState] = useState<AppData>(() =>
    backend === 'local' ? loadData() : emptyData(),
  );
  const [synced, setSynced] = useState(backend === 'local');

  const dataRef = useRef<AppData>(data);
  dataRef.current = data;

  // ── Persistence plumbing ──────────────────────────────────────────────────
  const pendingWrite = useRef<AppData | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushFirestore = useCallback(async () => {
    const next = pendingWrite.current;
    pendingWrite.current = null;
    if (writeTimer.current) {
      clearTimeout(writeTimer.current);
      writeTimer.current = null;
    }
    if (!next || !db) return;
    try {
      await setDoc(doc(db, SHARED_DOC.collection, SHARED_DOC.id), next);
    } catch (err) {
      console.error('Firestore write failed.', err);
    }
  }, []);

  const persist = useCallback(
    (next: AppData) => {
      if (backend === 'local') {
        saveData(next);
        return;
      }
      // Debounce Firestore writes so rapid gameplay updates batch together.
      pendingWrite.current = next;
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(flushFirestore, WRITE_DEBOUNCE_MS);
    },
    [backend, flushFirestore],
  );

  /** Update local state AND persist to the active backend. */
  const commit = useCallback(
    (next: AppData) => {
      dataRef.current = next;
      setDataState(next);
      persist(next);
    },
    [persist],
  );

  /** Apply data that came FROM the backend (no re-persist). */
  const applyExternal = useCallback((next: AppData) => {
    dataRef.current = next;
    setDataState(next);
  }, []);

  // ── Firestore subscription (firebase backend) ─────────────────────────────
  useEffect(() => {
    if (backend !== 'firebase') return;
    if (!isAdmin || !db) {
      // Not signed in (or signed out): clear data, wait for auth.
      applyExternal(emptyData());
      setSynced(false);
      return;
    }
    const ref = doc(db, SHARED_DOC.collection, SHARED_DOC.id);
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        setSynced(true);
        if (!snap.exists()) {
          // First ever run — seed the shared document.
          const init = emptyData();
          applyExternal(init);
          try {
            await setDoc(ref, init);
          } catch (err) {
            console.error('Failed to initialise shared document.', err);
          }
          return;
        }
        // Skip echoes of our own not-yet-confirmed local writes so rapid edits
        // (e.g. during gameplay) aren't reverted by a stale server snapshot.
        if (snap.metadata.hasPendingWrites) return;
        applyExternal(coerce(snap.data()));
      },
      (err) => {
        console.error('Firestore subscription failed.', err);
        setSynced(false);
      },
    );
    return unsub;
  }, [backend, isAdmin, applyExternal]);

  // Flush any pending Firestore write before the tab unloads.
  useEffect(() => {
    if (backend !== 'firebase') return;
    const onHide = () => {
      if (pendingWrite.current) void flushFirestore();
    };
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [backend, flushFirestore]);

  // ── Members ────────────────────────────────────────────────────────────
  const addMember: StoreContextValue['addMember'] = useCallback(
    (input) => {
      const member: Member = {
        id: uid('mem'),
        name: input.name.trim(),
        displayColor: input.displayColor,
        avatarInitials: input.avatarInitials,
        createdAt: Date.now(),
        archived: false,
      };
      commit({ ...dataRef.current, members: [...dataRef.current.members, member] });
      return member;
    },
    [commit],
  );

  const updateMember: StoreContextValue['updateMember'] = useCallback(
    (id, patch) => {
      commit({
        ...dataRef.current,
        members: dataRef.current.members.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      });
    },
    [commit],
  );

  const setMemberArchived: StoreContextValue['setMemberArchived'] = useCallback(
    (id, archived) => {
      commit({
        ...dataRef.current,
        members: dataRef.current.members.map((m) =>
          m.id === id ? { ...m, archived } : m,
        ),
      });
    },
    [commit],
  );

  // ── Boards ─────────────────────────────────────────────────────────────
  const createBoard: StoreContextValue['createBoard'] = useCallback(
    (board) => {
      const created: Board = { ...board, id: uid('brd') };
      commit({ ...dataRef.current, boards: [...dataRef.current.boards, created] });
      return created;
    },
    [commit],
  );

  const updateBoard: StoreContextValue['updateBoard'] = useCallback(
    (id, patch) => {
      commit({
        ...dataRef.current,
        boards: dataRef.current.boards.map((b) =>
          b.id === id ? { ...b, ...patch } : b,
        ),
      });
    },
    [commit],
  );

  const getBoard: StoreContextValue['getBoard'] = useCallback(
    (id) => data.boards.find((b) => b.id === id),
    [data.boards],
  );

  // ── Classes ────────────────────────────────────────────────────────────
  const createClass: StoreContextValue['createClass'] = useCallback(
    (input) => {
      const created: GymClass = { ...input, id: uid('cls'), createdAt: Date.now() };
      commit({ ...dataRef.current, classes: [...dataRef.current.classes, created] });
      return created;
    },
    [commit],
  );

  const updateClass: StoreContextValue['updateClass'] = useCallback(
    (id, patch) => {
      commit({
        ...dataRef.current,
        classes: dataRef.current.classes.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      });
    },
    [commit],
  );

  const deleteClass: StoreContextValue['deleteClass'] = useCallback(
    (id) => {
      const d = dataRef.current;
      const cls = d.classes.find((c) => c.id === id);
      const sessions = { ...d.sessions };
      delete sessions[id];
      commit({
        ...d,
        classes: d.classes.filter((c) => c.id !== id),
        boards: cls ? d.boards.filter((b) => b.id !== cls.boardId) : d.boards,
        sessions,
      });
    },
    [commit],
  );

  const getClass: StoreContextValue['getClass'] = useCallback(
    (id) => data.classes.find((c) => c.id === id),
    [data.classes],
  );

  // ── Sessions ───────────────────────────────────────────────────────────
  const getSession: StoreContextValue['getSession'] = useCallback(
    (classId) => data.sessions[classId],
    [data.sessions],
  );

  const saveSession: StoreContextValue['saveSession'] = useCallback(
    (session) => {
      commit({
        ...dataRef.current,
        sessions: { ...dataRef.current.sessions, [session.classId]: session },
      });
    },
    [commit],
  );

  // ── Settings ───────────────────────────────────────────────────────────
  const updateSettings: StoreContextValue['updateSettings'] = useCallback(
    (patch) => {
      commit({
        ...dataRef.current,
        settings: { ...dataRef.current.settings, ...patch },
      });
    },
    [commit],
  );

  // ── Backup ─────────────────────────────────────────────────────────────
  const importAll: StoreContextValue['importAll'] = useCallback(
    (jsonText) => {
      commit(parseImport(jsonText));
    },
    [commit],
  );

  const replaceAll: StoreContextValue['replaceAll'] = useCallback(
    (next) => {
      commit(next ?? emptyData());
    },
    [commit],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
      backend,
      synced,
      addMember,
      updateMember,
      setMemberArchived,
      createBoard,
      updateBoard,
      getBoard,
      createClass,
      updateClass,
      deleteClass,
      getClass,
      getSession,
      saveSession,
      updateSettings,
      importAll,
      replaceAll,
    }),
    [
      data,
      backend,
      synced,
      addMember,
      updateMember,
      setMemberArchived,
      createBoard,
      updateBoard,
      getBoard,
      createClass,
      updateClass,
      deleteClass,
      getClass,
      getSession,
      saveSession,
      updateSettings,
      importAll,
      replaceAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}

export type { Exercise };
