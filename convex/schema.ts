import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    customerId: v.optional(v.string()),
    username: v.optional(v.string()),            // chosen display handle (set once at onboarding)
    usernameLower: v.optional(v.string()),       // lowercase for uniqueness lookups
    referralAnswered: v.optional(v.boolean()),   // has the reader answered "who led you here?"
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username_lower", ["usernameLower"]),

  // ─── Referral answers: the magical "who led you here?" responses ───────────────
  referralAnswers: defineTable({
    userId: v.id("users"),
    username: v.string(),       // snapshot of username at answer time
    answer: v.string(),         // raw response text
    createdAt: v.string(),      // ISO 8601 UTC
  }).index("by_user", ["userId"]).index("by_created", ["createdAt"]),

  // ─── Referral word counts: write-time aggregation for admin word search ────────
  // count = how many distinct people used this word in their answer
  referralWordCounts: defineTable({
    word: v.string(),           // normalized lowercase word
    count: v.number(),
  }).index("by_word", ["word"]).index("by_count", ["count"]),

  // ─── Realms: groupings that filter books (e.g. "English realm", "Zulu realm") ─
  realms: defineTable({
    name: v.string(),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]),

  // ─── Books: top-level works that contain chapters & episodes ─────────────────
  books: defineTable({
    title: v.string(),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    languages: v.array(v.string()),         // languages this book appears in
    synopsis: v.string(),
    status: v.union(v.literal("ongoing"), v.literal("complete")),
    // page count: an explicit number OR a symbolic mode
    pageCountMode: v.union(
      v.literal("number"),
      v.literal("neverending"),
      v.literal("unknown"),
      v.literal("infinite")
    ),
    pageCount: v.optional(v.number()),      // used when pageCountMode === "number"
    // LED color: a named preset OR a custom uploaded image/color
    ledColorMode: v.union(v.literal("preset"), v.literal("custom")),
    ledColorPreset: v.optional(v.string()), // e.g. "red", "purple", "peacock-blue", "phthalo-green", "gold"
    ledColorCustomUrl: v.optional(v.string()),
    ledColorCustomStorageId: v.optional(v.id("_storage")),
    realmId: v.id("realms"),
    defaultLight: v.string(),               // default reading light for this book
    baseLikes: v.number(),                  // seeded like count (e.g. 88000)
    baseReaders: v.number(),                // seeded reader estimate
    readerCadence: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    isFlagship: v.boolean(),
    published: v.boolean(),
    order: v.number(),
    createdAt: v.string(),
  })
    .index("by_order", ["order"])
    .index("by_realm", ["realmId"])
    .index("by_flagship", ["isFlagship"])
    .index("by_published_order", ["published", "order"]),

  readingProgress: defineTable({
    userId: v.id("users"),
    episodeNumber: v.string(),
    progressPercent: v.number(),
    language: v.string(),
    completed: v.boolean(),
    lastReadAt: v.string(), // ISO 8601 UTC
  })
    .index("by_user", ["userId"])
    .index("by_user_and_episode", ["userId", "episodeNumber"]),

  upcomingEpisodes: defineTable({
    title: v.string(),
    chapter: v.string(),
    description: v.string(),
    releaseDate: v.optional(v.string()),
    status: v.union(v.literal("coming_soon"), v.literal("released")),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    episodeNumber: v.string(),
    sectionId: v.string(),
    sectionLabel: v.string(),
    progressPercent: v.number(),
    createdAt: v.string(), // ISO 8601 UTC
  })
    .index("by_user", ["userId"])
    .index("by_user_and_episode", ["userId", "episodeNumber"]),
  episodes: defineTable({
    number: v.string(),   // "01", "02", "ep03", etc.
    title: v.string(),
    subtitle: v.string(),
    synopsis: v.string(),
    cover: v.optional(v.string()),
    status: v.union(v.literal("free"), v.literal("coming"), v.literal("locked")),
    price: v.optional(v.number()),
    minutes: v.number(),
    tags: v.array(v.string()),
    arc: v.string(),
    langCount: v.number(),
    languages: v.optional(v.array(v.string())), // tagged languages for this episode
    chapterGroup: v.string(), // links to chapters.number e.g. "01"
    order: v.number(),
    createdAt: v.string(),
    tokenPrice: v.optional(v.number()),  // tokens required to unlock
    expiryDays: v.optional(v.number()),  // days access lasts after unlock
    bookId: v.optional(v.id("books")),   // which book this episode belongs to
    // ── Per-book episode builder fields ──
    scrollMode: v.optional(v.union(v.literal("single"), v.literal("dual"))), // one scroll or two
    subtitleMode: v.optional(v.union(
      v.literal("none"),
      v.literal("subtitled"),
      v.literal("both")
    )),
    defaultLight: v.optional(v.string()), // default reading light for this episode
    // ── Likes & reader counts (admin-seeded base + cadence) ──
    baseLikes: v.optional(v.number()),    // seeded like count (e.g. 88000), real likes add on top
    baseReaders: v.optional(v.number()),  // seeded reader estimate
    readerCadence: v.optional(v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly")
    )),
    // Purchasable variants of this episode (language + subtitle + pricing).
    // Bounded to a handful of entries, so a small inline array is fine.
    variants: v.optional(v.array(v.object({
      id: v.string(),            // stable key, e.g. "subtitled-english"
      label: v.string(),         // display label, e.g. "English · Subtitled"
      language: v.string(),
      subtitled: v.boolean(),
      pricing: v.union(v.literal("free"), v.literal("locked"), v.literal("sale")),
      tokenPrice: v.optional(v.number()),  // tokens to unlock (locked or original price for sale)
      salePrice: v.optional(v.number()),   // discounted token price (sale only)
      expiryDays: v.optional(v.number()),  // days access lasts after unlock
    }))),
  })
    .index("by_order", ["order"])
    .index("by_chapter_group", ["chapterGroup"])
    .index("by_number", ["number"])
    .index("by_book", ["bookId"])
    .index("by_book_and_order", ["bookId", "order"]),

  tokenPacks: defineTable({
    name: v.string(),          // e.g. "Starter Pack"
    tokenAmount: v.number(),   // tokens granted
    price: v.number(),         // price in USD cents (e.g. 100 = $1.00)
    active: v.boolean(),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]).index("by_active_order", ["active", "order"]),

  promoCodes: defineTable({
    code: v.string(),          // e.g. "WELCOME50"
    type: v.union(v.literal("free_tokens"), v.literal("discount")),
    tokenAmount: v.optional(v.number()),    // tokens granted (for free_tokens type)
    discountPercent: v.optional(v.number()), // 0-100 (for discount type)
    maxUses: v.optional(v.number()),        // null = unlimited
    usedCount: v.number(),
    active: v.boolean(),
    createdAt: v.string(),
  }).index("by_code", ["code"]),

  tokenBalances: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  tokenPurchases: defineTable({
    userId: v.id("users"),
    packId: v.id("tokenPacks"),
    tokenAmount: v.number(),
    pricePaid: v.number(),       // cents
    nonce: v.string(),           // unique per checkout, prevents double-credit
    status: v.union(v.literal("pending"), v.literal("fulfilled")),
    createdAt: v.string(),
    fulfilledAt: v.optional(v.string()),
  })
    .index("by_nonce", ["nonce"])
    .index("by_user", ["userId"]),

  unlocks: defineTable({
    userId: v.id("users"),
    episodeNumber: v.string(),
    expiresAt: v.string(),  // ISO 8601 UTC
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_episode", ["userId", "episodeNumber"]),

  chapters: defineTable({
    number: v.string(),   // "01", "02", etc.
    title: v.string(),    // "Chapter 1"
    subtitle: v.string(), // "Scar-heart Malka Raurah · Chapter 1"
    synopsis: v.string(),
    cover: v.optional(v.string()),
    status: v.union(v.literal("free"), v.literal("coming"), v.literal("paid")),
    price: v.optional(v.number()), // display price in USD
    minutes: v.number(),
    tags: v.array(v.string()),
    arc: v.string(),
    langCount: v.number(),
    seriesColor: v.optional(v.string()), // e.g. "MRD Green", "MRD Purple"
    order: v.number(),
    createdAt: v.string(),
    bookId: v.optional(v.id("books")),   // which book this chapter belongs to
  })
    .index("by_order", ["order"])
    .index("by_number", ["number"])
    .index("by_book", ["bookId"]),

  episodePages: defineTable({
    episodeNumber: v.string(),
    language: v.string(),
    storageId: v.id("_storage"),
    order: v.number(),
    createdAt: v.string(),
    bookId: v.optional(v.id("books")),   // which book this page belongs to
    variantId: v.optional(v.string()),   // which episode variant (scroll) this page belongs to
  })
    .index("by_episode_and_language", ["episodeNumber", "language"])
    .index("by_episode_language_order", ["episodeNumber", "language", "order"])
    .index("by_book", ["bookId"])
    .index("by_book_episode_language", ["bookId", "episodeNumber", "language"])
    .index("by_book_and_variant", ["bookId", "episodeNumber", "variantId"])
    .index("by_episode_and_variant", ["episodeNumber", "variantId"]),

  contentBlocks: defineTable({
    title: v.string(),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    visible: v.boolean(),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]).index("by_visible_order", ["visible", "order"]),

  comments: defineTable({
    group: v.union(
      v.literal("general"),
      v.literal("scarheart"),
      v.literal("purple"),
      v.literal("gold-blue-green")
    ),
    content: v.string(),
    authorId: v.id("users"),
    authorName: v.string(),
    parentId: v.optional(v.id("comments")),
    createdAt: v.string(), // ISO 8601 UTC
  })
    .index("by_group", ["group"])
    .index("by_parent", ["parentId"]),

  // ─── Vive: Chat Chambers ───────────────────────────────────────────────────
  chambers: defineTable({
    name: v.string(),          // e.g. "General", "Theories", "Fan Art"
    description: v.string(),
    icon: v.string(),          // emoji or icon name
    order: v.number(),
    createdAt: v.string(),
  }).index("by_order", ["order"]),

  chamberMessages: defineTable({
    chamberId: v.id("chambers"),
    authorId: v.id("users"),
    authorName: v.string(),
    content: v.string(),
    createdAt: v.string(),     // ISO 8601 UTC
  }).index("by_chamber", ["chamberId"]),

  chamberReactions: defineTable({
    messageId: v.id("chamberMessages"),
    userId: v.id("users"),
    emoji: v.string(),         // e.g. "❤️", "🔥", "😂"
    createdAt: v.string(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_and_user", ["messageId", "userId"]),

  // ─── Portal CMS ──────────────────────────────────────────────────────────────
  portalPages: defineTable({
    slug: v.string(),       // URL slug e.g. "about-malka"
    title: v.string(),
    subtitle: v.optional(v.string()),
    body: v.string(),       // markdown/rich text content
    coverUrl: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_slug", ["slug"]).index("by_published_order", ["published", "order"]),

  // ─── Vibes: Image Posts ──────────────────────────────────────────────────────
  vibes: defineTable({
    authorId: v.id("users"),
    authorName: v.string(),
    caption: v.string(),
    imageStorageId: v.id("_storage"),
    tags: v.array(v.string()),
    likeCount: v.number(),
    createdAt: v.string(),
  }).index("by_created", ["createdAt"]),

  vibeLikes: defineTable({
    vibeId: v.id("vibes"),
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_vibe", ["vibeId"])
    .index("by_vibe_and_user", ["vibeId", "userId"]),

  // ─── Vide: Video Reels ──────────────────────────────────────────────────────
  vides: defineTable({
    authorId: v.id("users"),
    authorName: v.string(),
    caption: v.string(),
    videoStorageId: v.id("_storage"),
    thumbnailStorageId: v.optional(v.id("_storage")),
    likeCount: v.number(),
    createdAt: v.string(),
  }).index("by_created", ["createdAt"]),

  videLikes: defineTable({
    videId: v.id("vides"),
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_vide", ["videId"])
    .index("by_vide_and_user", ["videId", "userId"]),

  // ─── Likes: real reader likes on books & episodes (base counts live on the doc) ─
  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("episode")),
    targetKey: v.string(), // bookId string, or episode number
    createdAt: v.string(),
  })
    .index("by_target", ["targetType", "targetKey"])
    .index("by_user_and_target", ["userId", "targetType", "targetKey"]),

  // ─── Site Text: admin-editable copy blocks (e.g. the "Magical Must Note") ───────
  siteText: defineTable({
    key: v.string(),        // stable identifier, e.g. "must_note"
    label: v.string(),      // admin-facing name
    title: v.string(),      // bold tappable headline
    body: v.string(),       // the text that unfurls when tapped
    cta: v.string(),        // the "Click me: About Story" prompt
    updatedAt: v.string(),
  }).index("by_key", ["key"]),
});
