import { getStore } from "@netlify/blobs";
import { handle } from "../lib/api.mjs";

// all /api calls come through here
export default async req => handle(req, getStore({ name: "lunchline", consistency: "strong" }));

export const config = { path: "/api/*" };
