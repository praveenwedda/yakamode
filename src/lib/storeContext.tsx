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
import {
  emptyData,
  loadData,
  parseImport,
  saveData,
} from './store';
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

interface StoreContextValue {
  data: AppData;

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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  // Persist on every change (debounced via microtask coalescing is overkill
  // here; writes are tiny and infrequent relative to gameplay frames).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveData(data);
  }, [data]);

  // ── Members ────────────────────────────────────────────────────────────
  const addMember: StoreContextValue['addMember'] = useCallback((input) => {
    const member: Member = {
      id: uid('mem'),
      name: input.name.trim(),
      displayColor: input.displayColor,
      avatarInitials: input.avatarInitials,
      createdAt: Date.now(),
      archived: false,
    };
    setData((d) => ({ ...d, members: [...d.members, member] }));
    return member;
  }, []);

  const updateMember: StoreContextValue['updateMember'] = useCallback(
    (id, patch) => {
      setData((d) => ({
        ...d,
        members: d.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [],
  );

  const setMemberArchived: StoreContextValue['setMemberArchived'] = useCallback(
    (id, archived) => {
      setData((d) => ({
        ...d,
        members: d.members.map((m) => (m.id === id ? { ...m, archived } : m)),
      }));
    },
    [],
  );

  // ── Boards ─────────────────────────────────────────────────────────────
  const createBoard: StoreContextValue['createBoard'] = useCallback((board) => {
    const created: Board = { ...board, id: uid('brd') };
    setData((d) => ({ ...d, boards: [...d.boards, created] }));
    return created;
  }, []);

  const updateBoard: StoreContextValue['updateBoard'] = useCallback(
    (id, patch) => {
      setData((d) => ({
        ...d,
        boards: d.boards.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      }));
    },
    [],
  );

  const getBoard: StoreContextValue['getBoard'] = useCallback(
    (id) => data.boards.find((b) => b.id === id),
    [data.boards],
  );

  // ── Classes ────────────────────────────────────────────────────────────
  const createClass: StoreContextValue['createClass'] = useCallback((input) => {
    const created: GymClass = { ...input, id: uid('cls'), createdAt: Date.now() };
    setData((d) => ({ ...d, classes: [...d.classes, created] }));
    return created;
  }, []);

  const updateClass: StoreContextValue['updateClass'] = useCallback(
    (id, patch) => {
      setData((d) => ({
        ...d,
        classes: d.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [],
  );

  const deleteClass: StoreContextValue['deleteClass'] = useCallback((id) => {
    setData((d) => {
      const cls = d.classes.find((c) => c.id === id);
      const sessions = { ...d.sessions };
      delete sessions[id];
      return {
        ...d,
        classes: d.classes.filter((c) => c.id !== id),
        // Orphan the board too (boards are 1:1 with classes here).
        boards: cls ? d.boards.filter((b) => b.id !== cls.boardId) : d.boards,
        sessions,
      };
    });
  }, []);

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
      setData((d) => ({
        ...d,
        sessions: { ...d.sessions, [session.classId]: session },
      }));
    },
    [],
  );

  // ── Settings ───────────────────────────────────────────────────────────
  const updateSettings: StoreContextValue['updateSettings'] = useCallback(
    (patch) => {
      setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    },
    [],
  );

  // ── Backup ─────────────────────────────────────────────────────────────
  const importAll: StoreContextValue['importAll'] = useCallback((jsonText) => {
    const next = parseImport(jsonText);
    setData(next);
  }, []);

  const replaceAll: StoreContextValue['replaceAll'] = useCallback((next) => {
    setData(next ?? emptyData());
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
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

// Exercise type re-export convenience for consumers building boards.
export type { Exercise };
