// An in-memory stand-in for a Netlify Blobs store, plus a tiny request helper.

export function memStore() {
  const m = new Map();
  const dec = new TextDecoder();
  return {
    _m: m,
    async get(key, opts = {}) {
      const v = m.get(key);
      if (!v) return null;
      if (opts.type === "json") return JSON.parse(typeof v.data === "string" ? v.data : dec.decode(v.data));
      if (opts.type === "arrayBuffer") return typeof v.data === "string" ? new TextEncoder().encode(v.data).buffer : v.data;
      return typeof v.data === "string" ? v.data : dec.decode(v.data);
    },
    async getWithMetadata(key, opts = {}) {
      const v = m.get(key);
      return v ? { data: await this.get(key, opts), metadata: v.metadata } : null;
    },
    async set(key, data, opts = {}) { m.set(key, { data, metadata: opts.metadata }); },
    async setJSON(key, data) { m.set(key, { data: JSON.stringify(data) }); },
    async delete(key) { m.delete(key); },
    async list({ prefix = "" } = {}) { return { blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; },
  };
}

export const ORIGIN = "http://localhost:8888";

// Drives the real handler like a browser would, keeping cookies between calls.
export function client(handle, store, { ip = "1.2.3.4" } = {}) {
  let cookie = "";
  return async function call(method, path, body, { token, key, raw, headers = {} } = {}) {
    const h = { "x-forwarded-for": ip, ...headers };
    if (body !== undefined) h["content-type"] = "application/json";
    if (cookie) { h.cookie = cookie; h["x-ll"] = "1"; }
    if (token) h["x-ll-token"] = token;
    if (key) h["x-admin-key"] = key;
    const res = await handle(new Request(ORIGIN + "/api/" + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) }), store);
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0].endsWith("=") ? "" : set.split(";")[0];
    const out = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    return { status: res.status, ok: res.ok, body: out, headers: res.headers };
  };
}
