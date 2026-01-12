import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with notes app tables as the product grows.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Notes table
export const notes = mysqlTable(
  "notes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: mysqlEnum("type", ["note", "todo"]).default("note"),
    tags: json("tags").$type<string[]>(),
    folderId: int("folderId").references(() => folders.id, { onDelete: "set null" }),
    isArchived: boolean("isArchived").default(false),
    isPinned: boolean("isPinned").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSyncedAt: timestamp("lastSyncedAt"),
  },
  (table) => ({
    userIdIdx: index("notes_userId_idx").on(table.userId),
    folderIdIdx: index("notes_folderId_idx").on(table.folderId),
  })
);

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;

// Tasks table (for to-do lists)
export const tasks = mysqlTable(
  "tasks",
  {
    id: int("id").autoincrement().primaryKey(),
    noteId: int("noteId")
      .references(() => notes.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").default(false),
    priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
    dueDate: timestamp("dueDate"),
    parentTaskId: int("parentTaskId").references(() => tasks.id, { onDelete: "cascade" }),
    order: int("order").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    noteIdIdx: index("tasks_noteId_idx").on(table.noteId),
    parentTaskIdIdx: index("tasks_parentTaskId_idx").on(table.parentTaskId),
  })
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Attachments table (for media)
export const attachments = mysqlTable(
  "attachments",
  {
    id: int("id").autoincrement().primaryKey(),
    noteId: int("noteId")
      .references(() => notes.id, { onDelete: "cascade" })
      .notNull(),
    type: mysqlEnum("type", ["image", "audio", "video"]).notNull(),
    url: text("url").notNull(),
    localPath: text("localPath"),
    duration: int("duration"),
    transcription: text("transcription"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    noteIdIdx: index("attachments_noteId_idx").on(table.noteId),
  })
);

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

// Collaborators table
export const collaborators = mysqlTable(
  "collaborators",
  {
    id: int("id").autoincrement().primaryKey(),
    noteId: int("noteId")
      .references(() => notes.id, { onDelete: "cascade" })
      .notNull(),
    userId: int("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    permission: mysqlEnum("permission", ["view", "edit", "admin"]).default("view"),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (table) => ({
    noteIdIdx: index("collaborators_noteId_idx").on(table.noteId),
    userIdIdx: index("collaborators_userId_idx").on(table.userId),
  })
);

export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = typeof collaborators.$inferInsert;

// Tags table
export const tagsTable = mysqlTable(
  "tags",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("tags_userId_idx").on(table.userId),
  })
);

export type Tag = typeof tagsTable.$inferSelect;
export type InsertTag = typeof tagsTable.$inferInsert;

// Folders table
export const folders = mysqlTable(
  "folders",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    parentFolderId: int("parentFolderId").references(() => folders.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("folders_userId_idx").on(table.userId),
    parentFolderIdIdx: index("folders_parentFolderId_idx").on(table.parentFolderId),
  })
);

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

// Sync queue table (for offline support)
export const syncQueue = mysqlTable(
  "syncQueue",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    action: mysqlEnum("action", ["create", "update", "delete"]).notNull(),
    entityType: mysqlEnum("entityType", ["note", "task", "attachment", "collaborator"]).notNull(),
    entityId: int("entityId").notNull(),
    payload: json("payload").$type<Record<string, any>>().notNull(),
    status: mysqlEnum("status", ["pending", "synced", "failed"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    syncedAt: timestamp("syncedAt"),
  },
  (table) => ({
    userIdIdx: index("syncQueue_userId_idx").on(table.userId),
    statusIdx: index("syncQueue_status_idx").on(table.status),
  })
);

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type InsertSyncQueueItem = typeof syncQueue.$inferInsert;

// Relations
export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  folder: one(folders, { fields: [notes.folderId], references: [folders.id] }),
  tasks: many(tasks),
  attachments: many(attachments),
  collaborators: many(collaborators),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  note: one(notes, { fields: [tasks.noteId], references: [notes.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id] }),
  subtasks: many(tasks, { relationName: "subtasks" }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  note: one(notes, { fields: [attachments.noteId], references: [notes.id] }),
}));

export const collaboratorsRelations = relations(collaborators, ({ one }) => ({
  note: one(notes, { fields: [collaborators.noteId], references: [notes.id] }),
  user: one(users, { fields: [collaborators.userId], references: [users.id] }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parentFolder: one(folders, { fields: [folders.parentFolderId], references: [folders.id] }),
  childFolders: many(folders, { relationName: "childFolders" }),
  notes: many(notes),
}));

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  folders: many(folders),
  tags: many(tagsTable),
  collaborators: many(collaborators),
}));
