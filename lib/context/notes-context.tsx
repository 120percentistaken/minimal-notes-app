import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

export interface Note {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: "note" | "todo" | null;
  tags: string[] | null;
  folderId?: number | null;
  isArchived: boolean | null;
  isPinned: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date | null;
}

export interface Task {
  id: number;
  noteId: number;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  parentTaskId?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesState {
  notes: Note[];
  tasks: Record<number, Task[]>;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

interface NotesContextType extends NotesState {
  createNote: (title: string, content: string, type?: "note" | "todo") => Promise<void>;
  updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  archiveNote: (id: number) => Promise<void>;
  pinNote: (id: number, isPinned: boolean) => Promise<void>;
  searchNotes: (query: string) => Note[];
  createTask: (noteId: number, title: string, priority?: "low" | "medium" | "high") => Promise<void>;
  updateTask: (id: number, noteId: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number, noteId: number) => Promise<void>;
  reorderTasks: (noteId: number, taskOrder: Array<{ id: number; order: number }>) => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

type NotesAction =
  | { type: "SET_NOTES"; payload: Note[] }
  | { type: "SET_TASKS"; payload: Record<number, Task[]> }
  | { type: "ADD_NOTE"; payload: Note }
  | { type: "UPDATE_NOTE"; payload: Note }
  | { type: "DELETE_NOTE"; payload: number }
  | { type: "ADD_TASK"; payload: { noteId: number; task: Task } }
  | { type: "UPDATE_TASK"; payload: { noteId: number; task: Task } }
  | { type: "DELETE_TASK"; payload: { noteId: number; taskId: number } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LAST_SYNC"; payload: Date };

const initialState: NotesState = {
  notes: [],
  tasks: {},
  loading: false,
  error: null,
  lastSync: null,
};

function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "SET_TASKS":
      return { ...state, tasks: action.payload };
    case "ADD_NOTE":
      return { ...state, notes: [action.payload, ...state.notes] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.payload.id ? action.payload : n)),
      };
    case "DELETE_NOTE":
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.payload),
        tasks: Object.fromEntries(
          Object.entries(state.tasks).filter(([noteId]) => Number(noteId) !== action.payload)
        ),
      };
    case "ADD_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.noteId]: [
            ...(state.tasks[action.payload.noteId] || []),
            action.payload.task,
          ],
        },
      };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.noteId]: (state.tasks[action.payload.noteId] || []).map((t) =>
            t.id === action.payload.task.id ? action.payload.task : t
          ),
        },
      };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.noteId]: (state.tasks[action.payload.noteId] || []).filter(
            (t) => t.id !== action.payload.taskId
          ),
        },
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_LAST_SYNC":
      return { ...state, lastSync: action.payload };
    default:
      return state;
  }
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const notesQuery = trpc.notes.list.useQuery();
  const createNoteMutation = trpc.notes.create.useMutation();
  const updateNoteMutation = trpc.notes.update.useMutation();
  const deleteNoteMutation = trpc.notes.delete.useMutation();
  const archiveNoteMutation = trpc.notes.archive.useMutation();
  const pinNoteMutation = trpc.notes.pin.useMutation();
  const searchNotesQuery = trpc.notes.search.useQuery({ query: "" });

  // Load notes from server on mount
  useEffect(() => {
    if (notesQuery.data) {
      dispatch({ type: "SET_NOTES", payload: notesQuery.data });
      saveNotesToStorage(notesQuery.data);
    }
  }, [notesQuery.data]);

  // Load notes from storage on mount
  useEffect(() => {
    loadNotesFromStorage();
  }, []);

  const saveNotesToStorage = useCallback(async (notes: Note[]) => {
    try {
      await AsyncStorage.setItem("@notes_app/notes", JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save notes to storage:", error);
    }
  }, []);

  const loadNotesFromStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("@notes_app/notes");
      if (stored) {
        dispatch({ type: "SET_NOTES", payload: JSON.parse(stored) });
      }
    } catch (error) {
      console.error("Failed to load notes from storage:", error);
    }
  }, []);

  const createNote = useCallback(
    async (title: string, content: string, type: "note" | "todo" = "note") => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        await createNoteMutation.mutateAsync({
          title,
          content,
          type,
          tags: [],
        });

        // Refetch notes
        await notesQuery.refetch();
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to create note",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [createNoteMutation, notesQuery]
  );

  const updateNote = useCallback(
    async (id: number, updates: Partial<Note>) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const updatePayload: any = { id };
        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.content !== undefined) updatePayload.content = updates.content;
        if (updates.tags !== undefined) updatePayload.tags = updates.tags || [];
        if (updates.isArchived !== undefined) updatePayload.isArchived = updates.isArchived;
        if (updates.isPinned !== undefined) updatePayload.isPinned = updates.isPinned;

        await updateNoteMutation.mutateAsync(updatePayload);

        // Refetch notes
        await notesQuery.refetch();
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to update note",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [updateNoteMutation, notesQuery]
  );

  const deleteNote = useCallback(
    async (id: number) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        await deleteNoteMutation.mutateAsync({ id });
        dispatch({ type: "DELETE_NOTE", payload: id });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to delete note",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [deleteNoteMutation]
  );

  const archiveNote = useCallback(
    async (id: number) => {
      try {
        await archiveNoteMutation.mutateAsync({ id });
        await notesQuery.refetch();
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to archive note",
        });
      }
    },
    [archiveNoteMutation, notesQuery]
  );

  const pinNote = useCallback(
    async (id: number, isPinned: boolean) => {
      try {
        await pinNoteMutation.mutateAsync({ id, isPinned });
        await notesQuery.refetch();
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to pin note",
        });
      }
    },
    [pinNoteMutation, notesQuery]
  );

  const searchNotes = useCallback(
    (query: string): Note[] => {
      if (!query.trim()) return state.notes;
      const lowerQuery = query.toLowerCase();
      return state.notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerQuery) ||
          (note.content && note.content.toLowerCase().includes(lowerQuery))
      );
    },
    [state.notes]
  );

  const createTask = useCallback(
    async (noteId: number, title: string, priority: "low" | "medium" | "high" = "medium") => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const currentTasks = state.tasks[noteId] || [];
        const order = currentTasks.length;

        // TODO: Implement tasks.create mutation
        // await createTaskMutation.mutateAsync({
        //   noteId,
        //   title,
        //   priority,
        //   order,
        // });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to create task",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.tasks]
  );

  const updateTask = useCallback(
    async (id: number, noteId: number, updates: Partial<Task>) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // TODO: Implement tasks.update mutation
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to update task",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  const deleteTask = useCallback(
    async (id: number, noteId: number) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // TODO: Implement tasks.delete mutation
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to delete task",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  const reorderTasks = useCallback(
    async (noteId: number, taskOrder: Array<{ id: number; order: number }>) => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        // TODO: Implement tasks.reorder mutation
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to reorder tasks",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  const syncWithServer = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await notesQuery.refetch();
      dispatch({ type: "SET_LAST_SYNC", payload: new Date() });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to sync with server",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [notesQuery]);

  const value: NotesContextType = {
    ...state,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    pinNote,
    searchNotes,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    syncWithServer,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
