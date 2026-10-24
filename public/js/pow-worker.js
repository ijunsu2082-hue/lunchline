// Solves LunchLine's join puzzle off the main thread: find a number n so that
// SHA-256("<challenge>:<n>") starts with `bits` zero bits. A phone does it in a
// second or two; a script that wants thousands of fake devices pays for each one.
self.onmessage = async ({ data: { challenge, bits } }) => {
  const enc = new TextEncoder();
  const zeroBits = u8 => {
    let z = 0;
    for (const b of u8) { if (b === 0) { z += 8; continue; } z += Math.clz32(b) - 24; break; }
    return z;
  };
  let n = 0;
  for (;;) {
    const batch = [];
    for (let i = 0; i < 256; i++) batch.push(crypto.subtle.digest("SHA-256", enc.encode(`${challenge}:${n + i}`)));
    const out = await Promise.all(batch);
    for (let i = 0; i < out.length; i++) {
      if (zeroBits(new Uint8Array(out[i])) >= bits) { self.postMessage({ nonce: String(n + i) }); return; }
    }
    n += 256;
  }
};
