# Minimal Notes App - Architecture Document

## Data Model

### Core Entities

#### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Note
```typescript
interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'note' | 'todo';
  tags: string[];
  folderId?: string;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}
```

#### Task (for To-Do Lists)
```typescript
interface Task {
  id: string;
  noteId: string; // Reference to parent to-do list
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  parentTaskId?: string; // For subtasks
  order: number; // For drag-and-drop ordering
  createdAt: Date;
  updatedAt: Date;
}
```

#### Attachment (for media)
```typescript
interface Attachment {
  id: string;
  noteId: string;
  type: 'image' | 'audio' | 'video';
  url: string; // S3 URL
  localPath?: string; // For offline use
  duration?: number; // For audio/video
  transcription?: string; // For audio transcription
  createdAt: Date;
}
```

#### Collaborator
```typescript
interface Collaborator {
  id: string;
  noteId: string;
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  addedAt: Date;
}
```

#### Tag
```typescript
interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
}
```

#### Folder
```typescript
interface Folder {
  id: string;
  userId: string;
  name: string;
  parentFolderId?: string; // For nested folders
  createdAt: Date;
  updatedAt: Date;
}
```

#### SyncQueue (for offline support)
```typescript
interface SyncQueueItem {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'note' | 'task' | 'attachment' | 'collaborator';
  entityId: string;
  payload: Record<string, any>;
  status: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  syncedAt?: Date;
}
```

## Database Schema (Drizzle ORM)

```typescript
// users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// notes table
export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type', { enum: ['note', 'todo'] }).default('note'),
  tags: text('tags').array(), // JSON array
  folderId: text('folder_id').references(() => folders.id),
  isArchived: boolean('is_archived').default(false),
  isPinned: boolean('is_pinned').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSyncedAt: timestamp('last_synced_at'),
});

// tasks table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  completed: boolean('completed').default(false),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  dueDate: timestamp('due_date'),
  parentTaskId: text('parent_task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// attachments table
export const attachments = pgTable('attachments', {
  id: text('id').primaryKey(),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['image', 'audio', 'video'] }).notNull(),
  url: text('url').notNull(),
  localPath: text('local_path'),
  duration: integer('duration'),
  transcription: text('transcription'),
  createdAt: timestamp('created_at').defaultNow(),
});

// collaborators table
export const collaborators = pgTable('collaborators', {
  id: text('id').primaryKey(),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  permission: text('permission', { enum: ['view', 'edit', 'admin'] }).default('view'),
  addedAt: timestamp('added_at').defaultNow(),
});

// tags table
export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
});

// folders table
export const folders = pgTable('folders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  parentFolderId: text('parent_folder_id').references(() => folders.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// sync_queue table
export const syncQueue = pgTable('sync_queue', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
  entityType: text('entity_type', { enum: ['note', 'task', 'attachment', 'collaborator'] }).notNull(),
  entityId: text('entity_id').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status', { enum: ['pending', 'synced', 'failed'] }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});
```

## State Management Architecture

### Local State (React Context + AsyncStorage)

```typescript
interface NotesState {
  notes: Note[];
  tasks: Record<string, Task[]>; // Grouped by noteId
  attachments: Record<string, Attachment[]>; // Grouped by noteId
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

interface NotesContextType extends NotesState {
  // Notes operations
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  
  // Task operations
  createTask: (noteId: string, title: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (noteId: string, newOrder: Task[]) => Promise<void>;
  
  // Search & filter
  searchNotes: (query: string) => Note[];
  filterByTag: (tag: string) => Note[];
  
  // Sync
  syncWithServer: () => Promise<void>;
}
```

### Persistence Strategy

**Local-First Architecture:**
1. All data stored in AsyncStorage immediately on client
2. Changes queued in SyncQueue table on server
3. Background sync processes queue when online
4. Conflict resolution: Last-write-wins with timestamp comparison

**Data Flow:**
```
User Action → Update Local State → Save to AsyncStorage → Queue to Server → Sync on Background
```

## API Architecture (tRPC)

### Procedures

```typescript
// Notes
notes.create: (input: { title, content, type }) => Note
notes.list: () => Note[]
notes.get: (input: { id }) => Note
notes.update: (input: { id, updates }) => Note
notes.delete: (input: { id }) => void
notes.archive: (input: { id }) => void

// Tasks
tasks.create: (input: { noteId, title }) => Task
tasks.update: (input: { id, updates }) => Task
tasks.delete: (input: { id }) => void
tasks.reorder: (input: { noteId, order: Task[] }) => void

// Search
search.notes: (input: { query, filters? }) => Note[]

// Collaboration
collaboration.share: (input: { noteId, email, permission }) => Collaborator
collaboration.updatePermission: (input: { id, permission }) => Collaborator
collaboration.removeCollaborator: (input: { id }) => void
collaboration.getCollaborators: (input: { noteId }) => Collaborator[]

// Sync
sync.push: (input: { changes: SyncQueueItem[] }) => void
sync.pull: (input: { lastSync?: Date }) => { notes, tasks, attachments }
```

## Offline Support Strategy

### Sync Queue Processing

1. **On Change:** Add item to SyncQueue with status 'pending'
2. **On Online:** Process queue in batches
3. **On Success:** Update status to 'synced'
4. **On Conflict:** Resolve using timestamp comparison
5. **On Failure:** Retry with exponential backoff

### Conflict Resolution

```typescript
// Last-write-wins strategy
if (remoteUpdatedAt > localUpdatedAt) {
  // Use remote version
  useRemoteVersion();
} else {
  // Keep local version
  keepLocalVersion();
}
```

## Component Architecture

### Screen Components
- `HomeScreen`: Notes list with search
- `NoteDetailScreen`: Note editor
- `TodoDetailScreen`: To-do list editor
- `SearchScreen`: Search results
- `CollaborationSheet`: Share and permissions
- `SettingsScreen`: App preferences
- `MediaViewerScreen`: Image/audio/video viewer

### UI Components
- `NoteListItem`: Preview card for notes
- `TaskItem`: Checkbox item for tasks
- `RichTextEditor`: Text formatting toolbar
- `MediaPicker`: Image/audio/video selection
- `CollaboratorList`: Collaborator management
- `TagSelector`: Tag selection and creation

### Hooks
- `useNotes()`: Access notes state and operations
- `useTasks(noteId)`: Access tasks for a note
- `useSearch(query)`: Search notes
- `useSyncStatus()`: Sync state and operations
- `useOffline()`: Network connectivity status

## Performance Considerations

1. **List Virtualization:** Use FlatList for large note lists
2. **Image Optimization:** Compress and cache images
3. **Lazy Loading:** Load attachments on demand
4. **Debounced Auto-Save:** 2-second debounce for typing
5. **Batch Sync:** Group changes for efficient server communication
6. **Local Indexing:** Use AsyncStorage keys for fast lookups

## Security Considerations

1. **Authentication:** OAuth with secure token storage
2. **Authorization:** Permission checks on all operations
3. **Data Encryption:** Encrypt sensitive data at rest
4. **API Validation:** Validate all inputs on server
5. **Rate Limiting:** Prevent abuse of API endpoints
6. **Audit Logging:** Log all collaborative changes

## Error Handling

1. **Network Errors:** Graceful degradation with offline mode
2. **Validation Errors:** User-friendly error messages
3. **Sync Conflicts:** Automatic conflict resolution
4. **Storage Errors:** Fallback to in-memory state
5. **Permission Errors:** Prevent unauthorized access

## Testing Strategy

1. **Unit Tests:** Test individual functions and hooks
2. **Integration Tests:** Test data flow and API calls
3. **E2E Tests:** Test complete user flows
4. **Offline Tests:** Verify offline functionality
5. **Collaboration Tests:** Test multi-user scenarios
