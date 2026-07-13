import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/** Get notifications for the current user */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const all = await ctx.db.query("notifications").collect();
    return all
      .filter((n) => n.userId === user._id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 20);
  },
});

/** Count unread notifications */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;

    const all = await ctx.db.query("notifications").collect();
    return all.filter((n) => n.userId === user._id && !n.read).length;
  },
});

/** Mark a notification as read */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

/** Mark all notifications as read */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;

    const all = await ctx.db.query("notifications").collect();
    const unread = all.filter((n) => n.userId === user._id && !n.read);
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

/** Create a notification (internal use) */
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      read: false,
      createdAt: Date.now(),
    });
  },
});
