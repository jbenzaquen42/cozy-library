import { Prisma, PrismaClient } from "@prisma/client";
import { cacheCoverImage } from "../lib/metadata/covers";

const prisma = new PrismaClient();
const DEMO_SOURCE = "demo-hardcover";
const DEMO_SPINE_COLORS = ["#7d8f65", "#b99068", "#6b4a34", "#8a6548", "#5c7a6b", "#a85d5d", "#4f6b8b", "#9f775a", "#d4a76a"];

type DemoBook = {
  title: string;
  author: string;
  isbn13: string;
  publishedDate: string;
  publisher: string;
  pageCount: number;
  categories: string[];
};

const DEMO_BOOKS: DemoBook[] = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn13: "9780061120084", publishedDate: "1960", publisher: "Harper Perennial", pageCount: 336, categories: ["Classic", "Fiction"] },
  { title: "1984", author: "George Orwell", isbn13: "9780451524935", publishedDate: "1949", publisher: "Signet Classics", pageCount: 328, categories: ["Dystopian", "Classic"] },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn13: "9780141439518", publishedDate: "1813", publisher: "Penguin Classics", pageCount: 480, categories: ["Classic", "Romance"] },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn13: "9780743273565", publishedDate: "1925", publisher: "Scribner", pageCount: 180, categories: ["Classic", "Fiction"] },
  { title: "The Catcher in the Rye", author: "J. D. Salinger", isbn13: "9780316769488", publishedDate: "1951", publisher: "Little, Brown", pageCount: 277, categories: ["Classic", "Coming-of-age"] },
  { title: "The Hobbit", author: "J. R. R. Tolkien", isbn13: "9780547928227", publishedDate: "1937", publisher: "Mariner Books", pageCount: 320, categories: ["Fantasy", "Adventure"] },
  { title: "The Fellowship of the Ring", author: "J. R. R. Tolkien", isbn13: "9780547928210", publishedDate: "1954", publisher: "Mariner Books", pageCount: 432, categories: ["Fantasy", "Adventure"] },
  { title: "The Two Towers", author: "J. R. R. Tolkien", isbn13: "9780547928203", publishedDate: "1954", publisher: "Mariner Books", pageCount: 352, categories: ["Fantasy", "Adventure"] },
  { title: "The Return of the King", author: "J. R. R. Tolkien", isbn13: "9780547928197", publishedDate: "1955", publisher: "Mariner Books", pageCount: 432, categories: ["Fantasy", "Adventure"] },
  { title: "Dune", author: "Frank Herbert", isbn13: "9780441172719", publishedDate: "1965", publisher: "Ace", pageCount: 896, categories: ["Science Fiction"] },
  { title: "Foundation", author: "Isaac Asimov", isbn13: "9780553293357", publishedDate: "1951", publisher: "Bantam", pageCount: 296, categories: ["Science Fiction"] },
  { title: "Neuromancer", author: "William Gibson", isbn13: "9780441569595", publishedDate: "1984", publisher: "Ace", pageCount: 271, categories: ["Science Fiction", "Cyberpunk"] },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", isbn13: "9780441478125", publishedDate: "1969", publisher: "Ace", pageCount: 304, categories: ["Science Fiction"] },
  { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin", isbn13: "9780547773742", publishedDate: "1968", publisher: "Clarion Books", pageCount: 210, categories: ["Fantasy"] },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", isbn13: "9780756404741", publishedDate: "2007", publisher: "DAW", pageCount: 662, categories: ["Fantasy"] },
  { title: "The Way of Kings", author: "Brandon Sanderson", isbn13: "9780765326355", publishedDate: "2010", publisher: "Tor Books", pageCount: 1007, categories: ["Fantasy"] },
  { title: "Mistborn", author: "Brandon Sanderson", isbn13: "9780765350381", publishedDate: "2006", publisher: "Tor Books", pageCount: 672, categories: ["Fantasy"] },
  { title: "The Fifth Season", author: "N. K. Jemisin", isbn13: "9780316229296", publishedDate: "2015", publisher: "Orbit", pageCount: 512, categories: ["Fantasy", "Science Fiction"] },
  { title: "The Poppy War", author: "R. F. Kuang", isbn13: "9780062662569", publishedDate: "2018", publisher: "Harper Voyager", pageCount: 544, categories: ["Fantasy"] },
  { title: "Project Hail Mary", author: "Andy Weir", isbn13: "9780593135204", publishedDate: "2021", publisher: "Ballantine Books", pageCount: 496, categories: ["Science Fiction"] },
  { title: "The Martian", author: "Andy Weir", isbn13: "9780553418026", publishedDate: "2011", publisher: "Broadway Books", pageCount: 387, categories: ["Science Fiction"] },
  { title: "The Hunger Games", author: "Suzanne Collins", isbn13: "9780439023528", publishedDate: "2008", publisher: "Scholastic Press", pageCount: 374, categories: ["Young Adult", "Dystopian"] },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J. K. Rowling", isbn13: "9780590353427", publishedDate: "1997", publisher: "Scholastic", pageCount: 320, categories: ["Fantasy", "Young Adult"] },
  { title: "The Lion, the Witch and the Wardrobe", author: "C. S. Lewis", isbn13: "9780064471046", publishedDate: "1950", publisher: "HarperCollins", pageCount: 208, categories: ["Fantasy", "Children"] },
  { title: "Charlotte's Web", author: "E. B. White", isbn13: "9780061124952", publishedDate: "1952", publisher: "HarperCollins", pageCount: 192, categories: ["Children", "Classic"] },
  { title: "Where the Wild Things Are", author: "Maurice Sendak", isbn13: "9780064431781", publishedDate: "1963", publisher: "HarperCollins", pageCount: 48, categories: ["Children", "Picture Book"] },
  { title: "The Very Hungry Caterpillar", author: "Eric Carle", isbn13: "9780399226908", publishedDate: "1969", publisher: "World Publishing", pageCount: 26, categories: ["Children", "Picture Book"] },
  { title: "The Giver", author: "Lois Lowry", isbn13: "9780544336261", publishedDate: "1993", publisher: "Clarion Books", pageCount: 240, categories: ["Young Adult", "Dystopian"] },
  { title: "The Book Thief", author: "Markus Zusak", isbn13: "9780375842207", publishedDate: "2005", publisher: "Knopf", pageCount: 608, categories: ["Historical Fiction", "Young Adult"] },
  { title: "The Night Circus", author: "Erin Morgenstern", isbn13: "9780307744432", publishedDate: "2011", publisher: "Anchor", pageCount: 516, categories: ["Fantasy", "Fiction"] },
  { title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", isbn13: "9780143034902", publishedDate: "2001", publisher: "Penguin Books", pageCount: 487, categories: ["Mystery", "Historical Fiction"] },
  { title: "Gone Girl", author: "Gillian Flynn", isbn13: "9780307588371", publishedDate: "2012", publisher: "Crown", pageCount: 432, categories: ["Thriller", "Mystery"] },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", isbn13: "9780307949486", publishedDate: "2005", publisher: "Vintage Crime", pageCount: 672, categories: ["Mystery", "Thriller"] },
  { title: "Murder on the Orient Express", author: "Agatha Christie", isbn13: "9780062693662", publishedDate: "1934", publisher: "William Morrow", pageCount: 288, categories: ["Mystery", "Classic"] },
  { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", isbn13: "9780140437867", publishedDate: "1902", publisher: "Penguin Classics", pageCount: 256, categories: ["Mystery", "Classic"] },
  { title: "Educated", author: "Tara Westover", isbn13: "9780399590504", publishedDate: "2018", publisher: "Random House", pageCount: 352, categories: ["Memoir", "Nonfiction"] },
  { title: "Sapiens", author: "Yuval Noah Harari", isbn13: "9780062316097", publishedDate: "2011", publisher: "Harper", pageCount: 464, categories: ["History", "Nonfiction"] },
  { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", isbn13: "9781400052189", publishedDate: "2010", publisher: "Crown", pageCount: 381, categories: ["Science", "Nonfiction"] },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn13: "9780374533557", publishedDate: "2011", publisher: "Farrar, Straus and Giroux", pageCount: 499, categories: ["Psychology", "Nonfiction"] },
  { title: "Atomic Habits", author: "James Clear", isbn13: "9780735211292", publishedDate: "2018", publisher: "Avery", pageCount: 320, categories: ["Self Help", "Nonfiction"] },
  { title: "The Design of Everyday Things", author: "Don Norman", isbn13: "9780465050659", publishedDate: "1988", publisher: "Basic Books", pageCount: 368, categories: ["Design", "Nonfiction"] },
  { title: "Clean Code", author: "Robert C. Martin", isbn13: "9780132350884", publishedDate: "2008", publisher: "Prentice Hall", pageCount: 464, categories: ["Programming", "Nonfiction"] },
  { title: "The Pragmatic Programmer", author: "David Thomas and Andrew Hunt", isbn13: "9780135957059", publishedDate: "1999", publisher: "Addison-Wesley", pageCount: 352, categories: ["Programming", "Nonfiction"] },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn13: "9780553380163", publishedDate: "1988", publisher: "Bantam", pageCount: 212, categories: ["Science", "Nonfiction"] },
  { title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", isbn13: "9781571313560", publishedDate: "2013", publisher: "Milkweed Editions", pageCount: 408, categories: ["Nature", "Nonfiction"] },
  { title: "The Overstory", author: "Richard Powers", isbn13: "9780393356687", publishedDate: "2018", publisher: "W. W. Norton", pageCount: 512, categories: ["Fiction", "Nature"] },
  { title: "Circe", author: "Madeline Miller", isbn13: "9780316556347", publishedDate: "2018", publisher: "Little, Brown", pageCount: 416, categories: ["Fantasy", "Mythology"] },
  { title: "The Song of Achilles", author: "Madeline Miller", isbn13: "9780062060624", publishedDate: "2011", publisher: "Ecco", pageCount: 416, categories: ["Historical Fiction", "Mythology"] },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", isbn13: "9781501161933", publishedDate: "2017", publisher: "Atria Books", pageCount: 400, categories: ["Fiction", "Historical Fiction"] },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", isbn13: "9780593321201", publishedDate: "2022", publisher: "Knopf", pageCount: 416, categories: ["Fiction"] },
];

const DEMO_ISBNS = DEMO_BOOKS.map((book) => book.isbn13);

function authorSortName(name: string) {
  const firstAuthor = name.split(/\s+(?:and|&)\s+|,/)[0]?.trim() ?? name;
  const parts = firstAuthor.split(/\s+/);
  if (parts.length < 2) return firstAuthor;
  return `${parts.at(-1)}, ${parts.slice(0, -1).join(" ")}`;
}

function openLibraryCoverUrl(isbn13: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`;
}

function demoDescription(item: DemoBook) {
  return [
    `${item.title} by ${item.author}.`,
    `A demo catalog entry with Hardcover-style metadata for testing catalog search, shelf browsing, loans, and cover display.`,
    `Categories: ${item.categories.join(", ")}.`,
  ].join(" ");
}

function demoSpineColor(item: DemoBook, index = DEMO_BOOKS.findIndex((book) => book.isbn13 === item.isbn13)) {
  return DEMO_SPINE_COLORS[Math.max(0, index) % DEMO_SPINE_COLORS.length]!;
}

async function cacheDemoCover(bookId: string, item: DemoBook) {
  const coverUrl = openLibraryCoverUrl(item.isbn13);
  const cover = await cacheCoverImage(bookId, coverUrl).catch(() => null);
  if (!cover) return undefined;

  await prisma.uploadedImage.deleteMany({ where: { bookId, kind: "CACHED_COVER", sourceUrl: coverUrl } });
  await prisma.uploadedImage.create({
    data: { bookId, kind: "CACHED_COVER", filePath: cover.filePath, mimeType: cover.mimeType, sourceUrl: cover.sourceUrl },
  });
  return cover.publicPath;
}

async function enrichDemoBook(bookId: string, item: DemoBook) {
  const coverImagePath = await cacheDemoCover(bookId, item);
  await prisma.book.update({
    where: { id: bookId },
    data: {
      subtitle: null,
      publisher: item.publisher,
      publishedDate: item.publishedDate,
      pageCount: item.pageCount,
      language: "English",
      categories: item.categories,
      description: demoDescription(item),
      spineColor: demoSpineColor(item),
      metadataSource: DEMO_SOURCE,
      metadataJson: {
        demoCatalog: true,
        source: DEMO_SOURCE,
        enrichedAt: new Date().toISOString(),
        hardcover: {
          title: item.title,
          author: item.author,
          isbn13: item.isbn13,
          publisher: item.publisher,
          publishedDate: item.publishedDate,
          pageCount: item.pageCount,
          language: "English",
          tags: item.categories,
          coverUrl: openLibraryCoverUrl(item.isbn13),
        },
        spineColor: demoSpineColor(item),
      } satisfies Prisma.InputJsonValue,
      ...(coverImagePath ? { coverImagePath } : {}),
    },
  });
}

async function clearDemoCatalog() {
  const demoBooks = await prisma.book.findMany({ where: { OR: [{ metadataSource: DEMO_SOURCE }, { isbn13: { in: DEMO_ISBNS } }] }, select: { id: true } });
  const bookIds = demoBooks.map((book) => book.id);

  if (bookIds.length === 0) {
    console.log("No demo catalog books to remove.");
    return;
  }

  const demoCopies = await prisma.copy.findMany({ where: { bookId: { in: bookIds } }, select: { id: true } });
  const copyIds = demoCopies.map((copy) => copy.id);

  await prisma.$transaction([
    prisma.loan.deleteMany({ where: { copyId: { in: copyIds } } }),
    prisma.copy.deleteMany({ where: { id: { in: copyIds } } }),
    prisma.bookAuthor.deleteMany({ where: { bookId: { in: bookIds } } }),
    prisma.uploadedImage.deleteMany({ where: { bookId: { in: bookIds } } }),
    prisma.book.deleteMany({ where: { id: { in: bookIds } } }),
  ]);

  const orphanAuthors = await prisma.author.findMany({ select: { id: true, _count: { select: { books: true } } } });
  await prisma.author.deleteMany({ where: { id: { in: orphanAuthors.filter((author) => author._count.books === 0).map((author) => author.id) } } });
  console.log(`Removed ${bookIds.length} demo catalog books.`);
}

async function seedDemoCatalog() {
  await clearDemoCatalog();

  const slots = await prisma.shelfSlot.findMany({ orderBy: [{ bookshelf: { sortOrder: "asc" } }, { rowIndex: "asc" }, { depthIndex: "asc" }] });
  if (slots.length === 0) throw new Error("Seed the default house before seeding demo books: npm run db:seed");

  for (const [index, item] of DEMO_BOOKS.entries()) {
    const book = await prisma.book.create({
      data: {
        title: item.title,
        displayAuthor: item.author,
        isbn13: item.isbn13,
        publisher: item.publisher,
        publishedDate: item.publishedDate,
        pageCount: item.pageCount,
        language: "English",
        categories: item.categories,
        description: demoDescription(item),
        spineColor: demoSpineColor(item, index),
        metadataSource: DEMO_SOURCE,
        metadataJson: {
          demoCatalog: true,
          source: DEMO_SOURCE,
          hardcover: {
            title: item.title,
            author: item.author,
            isbn13: item.isbn13,
            publisher: item.publisher,
            publishedDate: item.publishedDate,
            pageCount: item.pageCount,
            language: "English",
            tags: item.categories,
            coverUrl: openLibraryCoverUrl(item.isbn13),
          },
          spineColor: demoSpineColor(item, index),
        } satisfies Prisma.InputJsonValue,
      },
    });

    const authorNames = item.author.split(/\s+(?:and|&)\s+|,/).map((name) => name.trim()).filter(Boolean);
    for (const [position, name] of authorNames.entries()) {
      const author = await prisma.author.upsert({
        where: { name },
        create: { name, sortName: authorSortName(name) },
        update: { sortName: authorSortName(name) },
      });
      await prisma.bookAuthor.create({ data: { bookId: book.id, authorId: author.id, position: position + 1 } });
    }

    const slot = slots[index % slots.length]!;
    await prisma.copy.create({
      data: {
        bookId: book.id,
        copyLabel: "1",
        locationSlotId: slot.id,
        condition: index % 7 === 0 ? "Well-loved demo copy" : "Demo copy",
        notes: `Demo catalog item ${index + 1} of ${DEMO_BOOKS.length}. Remove with npm run demo:clear.`,
      },
    });

    await enrichDemoBook(book.id, item);
  }

  console.log(`Seeded ${DEMO_BOOKS.length} removable demo catalog books. Remove with npm run demo:clear.`);
}

async function ensureDemoCatalog() {
  const existing = await prisma.book.count({ where: { OR: [{ metadataSource: DEMO_SOURCE }, { isbn13: { in: DEMO_ISBNS } }] } });
  if (existing > 0) {
    await applyDemoSpineColors();
    console.log(`Demo catalog already present (${existing} books). Skipping demo seed.`);
    return;
  }
  await seedDemoCatalog();
}

async function applyDemoSpineColors() {
  let updated = 0;
  for (const [index, item] of DEMO_BOOKS.entries()) {
    const book = await prisma.book.findUnique({ where: { isbn13: item.isbn13 }, select: { id: true, metadataSource: true, spineColor: true } });
    if (!book || book.metadataSource !== DEMO_SOURCE || book.spineColor) continue;
    await prisma.book.update({ where: { id: book.id }, data: { spineColor: demoSpineColor(item, index) } });
    updated += 1;
  }
  if (updated > 0) console.log(`Added demo spine colors to ${updated} existing books.`);
}

async function enrichExistingDemoCatalog() {
  let enriched = 0;
  for (const item of DEMO_BOOKS) {
    const book = await prisma.book.findUnique({ where: { isbn13: item.isbn13 }, select: { id: true, metadataSource: true } });
    if (!book || book.metadataSource !== DEMO_SOURCE) continue;
    await enrichDemoBook(book.id, item);
    enriched += 1;
  }
  console.log(`Enriched ${enriched} existing demo catalog books with metadata and local covers.`);
}

async function main() {
  const command = process.argv[2] ?? "seed";
  if (command === "clear") return clearDemoCatalog();
  if (command === "enrich") return enrichExistingDemoCatalog();
  if (command === "ensure") return ensureDemoCatalog();
  if (command === "seed") return seedDemoCatalog();
  throw new Error(`Unknown demo catalog command: ${command}. Use seed, ensure, enrich, or clear.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
