// talking to the server
import { LS } from "./util.js";
import { state } from "./state.js";

// errors from the server
export class ApiError extends Error {
  constructor(msg, status, code) { super(msg); this.status = status; this.code = code; }
}

// device tokens
const tokens = LS.get("ll_tokens", {}); // school -> token
const pending = {};

// solve the puzzle
function solveInline(challenge, bits) {
  // no web workers, solve it here
  return new Promise((resolve, reject) => {
    const enc = new TextEncoder();
    let n = 0;
    const zeros = u8 => { let z = 0; for (const b of u8) { if (b === 0) { z += 8; continue; } z += Math.clz32(b) - 24; break; } return z; };
    const step = async () => {
      try {
        for (let i = 0; i < 512; i++, n++) {
          const h = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`${challenge}:${n}`)));
          if (zeros(h) >= bits) { resolve(String(n)); return; }
        }
        setTimeout(step, 0);
      } catch (e) { reject(e); }
    };
    step();
  });
}

function solvePow(challenge, bits) {
  if (typeof Worker === "undefined") return solveInline(challenge, bits);
  return new Promise((resolve, reject) => {
    let w;
    try { w = new Worker("/js/pow-worker.js"); } catch { solveInline(challenge, bits).then(resolve, reject); return; }
    w.onmessage = e => { w.terminate(); resolve(e.data.nonce); };
    w.onerror = () => { w.terminate(); solveInline(challenge, bits).then(resolve, reject); };
    w.postMessage({ challenge, bits });
  });
}

// get a device token
export function ensureToken(schoolId, force = false) {
  if (!force && tokens[schoolId]) return Promise.resolve(tokens[schoolId]);
  if (pending[schoolId]) return pending[schoolId];
  pending[schoolId] = (async () => {
    const { challenge, bits } = await api("GET", `pow?school=${schoolId}`);
    const nonce = await solvePow(challenge, bits);
    const out = await api("POST", "token", { school: schoolId, voter_id: state.voter, challenge, nonce });
    tokens[schoolId] = out.token;
    LS.set("ll_tokens", tokens);
    return out.token;
  })().finally(() => { delete pending[schoolId]; });
  return pending[schoolId];
}
// drop a token
export const forgetToken = schoolId => { delete tokens[schoolId]; LS.set("ll_tokens", tokens); };

// requests
// opts: student sends the device token, raw sends a file
export async function api(method, path, data, opts = {}) {
  const run = async retry => {
    const headers = { "X-LL": "1" };
    const legacy = LS.get("ll_admin");
    if (legacy?.key && !opts.student) headers["X-Admin-Key"] = legacy.key;
    if (opts.student) headers["X-LL-Token"] = await ensureToken(opts.student);
    let body;
    if (opts.raw) { body = opts.raw; headers["Content-Type"] = opts.type; }
    else if (data !== undefined) { body = JSON.stringify(data); headers["Content-Type"] = "application/json"; }
    let res;
    try { res = await fetch("/api/" + path, { method, headers, body, cache: "no-store", credentials: "same-origin" }); }
    catch { throw new ApiError("Can't reach LunchLine. Check your connection and try again.", 0); }
    let out = null;
    try { out = await res.json(); } catch { /* not JSON */ }
    if (res.status === 401 && opts.student && out?.code === "token" && !retry) {
      forgetToken(opts.student);
      return run(true);
    }
    if (!res.ok) throw new ApiError(out?.error || `Something went wrong (${res.status}). Try again.`, res.status, out?.code);
    return out;
  };
  return run(false);
}

// same key runs one at a time so the last tap wins
const queues = {};
export function enqueue(id, fn) {
  const p = (queues[id] || Promise.resolve()).then(fn, fn);
  queues[id] = p.catch(() => {});
  return p;
}
