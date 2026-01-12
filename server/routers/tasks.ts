import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { tasks, notes } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const tasksRouter = router({
  // Create a new task
  create: publicProcedure
    .input(
      z.object({
        noteId: z.number(),
        title: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.date().optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      // Verify the note belongs to the user
      const noteRecord = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.noteId), eq(notes.userId, ctx.user.id)))
        .limit(1);

      if (!noteRecord.length) throw new Error("Note not found or unauthorized");

      await db.insert(tasks).values({
        noteId: input.noteId,
        title: input.title,
        priority: input.priority,
        dueDate: input.dueDate,
        order: input.order,
      });

      return { success: true };
    }),

  // Get all tasks for a note
  listByNote: publicProcedure
    .input(z.object({ noteId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      // Verify the note belongs to the user
      const noteRecord = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.noteId), eq(notes.userId, ctx.user.id)))
        .limit(1);

      if (!noteRecord.length) throw new Error("Note not found or unauthorized");

      const result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.noteId, input.noteId))
        .orderBy(tasks.order);

      return result;
    }),

  // Update a task
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        noteId: z.number(),
        title: z.string().optional(),
        completed: z.boolean().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      // Verify the note belongs to the user
      const noteRecord = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.noteId), eq(notes.userId, ctx.user.id)))
        .limit(1);

      if (!noteRecord.length) throw new Error("Note not found or unauthorized");

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.completed !== undefined) updateData.completed = input.completed;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
      if (input.order !== undefined) updateData.order = input.order;

      await db.update(tasks).set(updateData).where(eq(tasks.id, input.id));

      return { success: true };
    }),

  // Delete a task
  delete: publicProcedure
    .input(z.object({ id: z.number(), noteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      // Verify the note belongs to the user
      const noteRecord = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.noteId), eq(notes.userId, ctx.user.id)))
        .limit(1);

      if (!noteRecord.length) throw new Error("Note not found or unauthorized");

      await db.delete(tasks).where(eq(tasks.id, input.id));

      return { success: true };
    }),

  // Reorder tasks
  reorder: publicProcedure
    .input(
      z.object({
        noteId: z.number(),
        taskOrder: z.array(z.object({ id: z.number(), order: z.number() })),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user?.id) throw new Error("Database or user not available");

      // Verify the note belongs to the user
      const noteRecord = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.noteId), eq(notes.userId, ctx.user.id)))
        .limit(1);

      if (!noteRecord.length) throw new Error("Note not found or unauthorized");

      // Update all task orders
      for (const item of input.taskOrder) {
        await db
          .update(tasks)
          .set({ order: item.order, updatedAt: new Date() })
          .where(eq(tasks.id, item.id));
      }

      return { success: true };
    }),
});
