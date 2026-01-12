import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notes, tasks, attachments, collaborators, folders } from "../../drizzle/schema";
import { eq, and, or, like } from "drizzle-orm";

export const notesRouter = router({
  // Create a new note
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        type: z.enum(["note", "todo"]).default("note"),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      const result = await db.insert(notes).values({
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        type: input.type,
        tags: input.tags || [],
      });

      return { success: true };
    }),

  // Get all notes for the current user
  list: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user?.id) throw new Error("Database or user not available");

    const result = await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, ctx.user.id), eq(notes.isArchived, false)))
      .orderBy(notes.updatedAt);

    return result;
  }),

  // Get a specific note by ID
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      const result = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)))
        .limit(1);

      return result[0] || null;
    }),

  // Update a note
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isArchived: z.boolean().optional(),
        isPinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;
      if (input.isPinned !== undefined) updateData.isPinned = input.isPinned;

      await db
        .update(notes)
        .set(updateData)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));

      return { success: true };
    }),

  // Delete a note
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      await db
        .delete(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));

      return { success: true };
    }),

  // Search notes
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        tags: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      const conditions = [
        eq(notes.userId, ctx.user.id),
        eq(notes.isArchived, false),
        or(like(notes.title, `%${input.query}%`), like(notes.content, `%${input.query}%`)),
      ];

      const result = await db
        .select()
        .from(notes)
        .where(and(...conditions))
        .orderBy(notes.updatedAt);

      return result;
    }),

  // Archive a note
  archive: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      await db
        .update(notes)
        .set({ isArchived: true })
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));

      return { success: true };
    }),

  // Pin a note
  pin: publicProcedure
    .input(z.object({ id: z.number(), isPinned: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      await db
        .update(notes)
        .set({ isPinned: input.isPinned })
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));

      return { success: true };
    }),
});
