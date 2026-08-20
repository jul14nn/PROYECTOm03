// Ruido de valor 2D suave y determinista (sin dependencias), para el
// bamboleo orgánico de llamas, humo y ráfagas de viento.
const Noise = (() => {
  const PERM_SIZE = 256;
  const perm = new Uint8Array(PERM_SIZE * 2);
  (function seed(s) {
    const table = new Uint8Array(PERM_SIZE);
    for (let i = 0; i < PERM_SIZE; i++) table[i] = i;
    let random = s;
    const rand = () => {
      random = (random * 1103515245 + 12345) & 0x7fffffff;
      return random / 0x7fffffff;
    };
    for (let i = PERM_SIZE - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [table[i], table[j]] = [table[j], table[i]];
    }
    for (let i = 0; i < PERM_SIZE * 2; i++) perm[i] = table[i % PERM_SIZE];
  })(1337);

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a, b, t) {
    return a + t * (b - a);
  }
  function grad(hash, x, y) {
    const h = hash & 7;
    const gx = 1 - (h & 1) * 2;
    const gy = 1 - ((h >> 1) & 1) * 2;
    return (h < 4 ? x * gx : y * gy) + (h < 4 ? y * gy : x * gx) * 0.5;
  }

  function noise2D(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];

    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  }

  function fbm(x, y, octaves = 3) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise2D(x * frequency, y * frequency);
      frequency *= 2;
      amplitude *= 0.5;
    }
    return value;
  }

  return { noise2D, fbm };
})();
