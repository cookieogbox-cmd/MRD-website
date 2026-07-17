import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * One-time, idempotent foundation migration.
 *
 * Creates a default realm + a flagship book from the existing flagship series,
 * then backfills `bookId` on every existing episode, chapter, and episode page.
 *
 * Safe to call repeatedly: it returns early once a flagship book exists, and
 * only backfills rows that are still missing a `bookId`.
 */
export const ensureFoundation = mutation({
  args: {},
  handler: async (ctx) => {
    // If a flagship book already exists, the foundation is in place.
    const existingFlagship = await ctx.db
      .query("books")
      .withIndex("by_flagship", (q) => q.eq("isFlagship", true))
      .first();

    let bookId: Id<"books">;

    if (existingFlagship) {
      bookId = existingFlagship._id;
    } else {
      const now = new Date().toISOString();

      // Ensure a default realm exists.
      let realm = await ctx.db.query("realms").withIndex("by_order").order("asc").first();
      if (!realm) {
        const realmId = await ctx.db.insert("realms", {
          name: "Origin Realm",
          order: 1,
          createdAt: now,
        });
        const inserted = await ctx.db.get(realmId);
        if (!inserted) return; // defensive; should never happen
        realm = inserted;
      }

      // Create the flagship book from the existing Scar-heart Malka Raurah series.
      bookId = await ctx.db.insert("books", {
        title: "Scar-heart Malka Raurah",
        coverUrl: "https://hercules-cdn.com/file_zwKoMroNRzrAPhnO04OOvFqt",
        languages: ["English"],
        synopsis:
          "The world remembers everything — except what happened to Malka. In a city where memory is currency and scars speak louder than words, one girl begins to unravel what was taken from her.",
        status: "ongoing",
        pageCountMode: "neverending",
        ledColorMode: "preset",
        ledColorPreset: "gold",
        realmId: realm._id,
        defaultLight: "gold",
        baseLikes: 88000,
        baseReaders: 88000,
        readerCadence: "daily",
        isFlagship: true,
        published: true,
        order: 1,
        createdAt: now,
      });
    }

    // Backfill bookId on episodes, chapters, and episode pages that lack one.
    let patched = 0;

    const episodes = await ctx.db.query("episodes").collect();
    for (const ep of episodes) {
      if (!ep.bookId) {
        await ctx.db.patch(ep._id, { bookId });
        patched++;
      }
    }

    const chapters = await ctx.db.query("chapters").collect();
    for (const ch of chapters) {
      if (!ch.bookId) {
        await ctx.db.patch(ch._id, { bookId });
        patched++;
      }
    }

    const pages = await ctx.db.query("episodePages").collect();
    for (const pg of pages) {
      if (!pg.bookId) {
        await ctx.db.patch(pg._id, { bookId });
        patched++;
      }
    }

    return { bookId, patched };
  },
});
