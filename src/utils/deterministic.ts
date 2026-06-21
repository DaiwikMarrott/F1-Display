export function deterministicUnit(...parts: Array<string | number>): number {
  const input = parts.join(':');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

export function deterministicRange(
  minimum: number,
  maximum: number,
  ...seed: Array<string | number>
): number {
  return minimum + deterministicUnit(...seed) * (maximum - minimum);
}
