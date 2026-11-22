/** Reads at most maxBytes of a response body as text, cancelling the rest of the stream. */
export async function readLimited(res: Response, maxBytes: number): Promise<{ text: string; sizeBytes: number; truncated: boolean }> {
  if (!res.body) return { text: "", sizeBytes: 0, truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = maxBytes - size;
    if (value.byteLength > room) {
      chunks.push(value.subarray(0, room));
      size += room;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    size += value.byteLength;
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), sizeBytes: size, truncated };
}
