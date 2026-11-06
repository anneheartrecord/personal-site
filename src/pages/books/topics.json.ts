import type { APIRoute } from "astro";
import { bookshelf } from "../../data/bookshelf";

/** Topic details for the /books map and topic dialogs, fetched on first topic open. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(bookshelf.topics), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
