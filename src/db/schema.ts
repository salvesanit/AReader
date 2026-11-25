import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** Books on the shelf — seeded from src/lib/library.ts, plus anything imported. */
export const books = pgTable("books", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: text("title").notNull(),
  titleJa: text("title_ja").notNull(),
  author: text("author").notNull(),
  year: integer("year").notNull(),
  genre: text("genre").notNull(),
  edition: text("edition").notNull(),
  spine: text("spine").notNull(),
  spineInk: text("spine_ink").notNull().default("#EDEBE6"),
  cover: text("cover"),
  synopsis: text("synopsis").notNull(),
  chapters: text("chapters").notNull(),
  origin: text("origin").notNull().default("library"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Reading position per book. */
export const progress = pgTable("progress", {
  bookId: varchar("book_id", { length: 64 })
    .primaryKey()
    .references(() => books.id, { onDelete: "cascade" }),
  chapter: integer("chapter").notNull().default(0),
  percent: integer("percent").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Plugin repositories the reader pulls extension catalogues from. */
export const repositories = pgTable("repositories", {
  url: text("url").primaryKey(),
  label: text("label").notNull(),
  count: integer("count").notNull().default(0),
  status: text("status").notNull().default("live"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

/** Individual site extensions discovered from a repository. */
export const extensions = pgTable("extensions", {
  id: varchar("id", { length: 96 }).primaryKey(),
  repoUrl: text("repo_url").notNull(),
  name: text("name").notNull(),
  site: text("site").notNull(),
  url: text("url").notNull(),
  lang: text("lang").notNull().default("en"),
  nsfw: boolean("nsfw").notNull().default(false),
  installed: boolean("installed").notNull().default(false),
});

/** Web novels discovered through installed extensions. */
export const novels = pgTable("novels", {
  id: varchar("id", { length: 96 }).primaryKey(),
  sourceId: text("source_id").notNull(),
  sourceName: text("source_name").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  tags: text("tags").notNull().default(""),
  chapters: integer("chapters").notNull().default(1),
  synopsis: text("synopsis").notNull(),
  content: text("content").notNull(),
});
