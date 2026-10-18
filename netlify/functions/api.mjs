import { getStore } from "@netlify/blobs";
import { handle } from "../lib/api.mjs";

export default async req => handle(req, getStore({ name: "lunchline", consistency: "strong" }));

export const config = { path: "/api/*" };
