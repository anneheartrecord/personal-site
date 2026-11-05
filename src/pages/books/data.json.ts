import type { APIRoute } from "astro";
import { bookshelf } from "../../data/bookshelf";

/** Book details for the /books dialog, fetched on first open so the page itself stays light. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      bookshelf.books.map((b) => ({
        title: b.title,
        author: b.author,
        cover: b.cover,
        category: b.category,
        rating: b.rating,
        progress: b.progress,
        finished: b.finished,
        hours: b.hours,
        marks: b.marks,
        recommended: b.recommended,
        verdict: b.verdict,
        myThoughts: b.myThoughts,
        quotes: b.quotes,
        highlights: b.highlights,
        cards: b.cards,
        link: b.link,
      })),
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
