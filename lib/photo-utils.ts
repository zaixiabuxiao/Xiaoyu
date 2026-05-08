/**
 * Compress a user-picked image File into a JPEG data URL.
 * Resizes so the long edge is at most `maxDim` pixels and writes JPEG at the
 * given `quality` (0–1). Used for both diary photos and album-only photos so
 * localStorage stays under quota.
 */
export function fileToCompressedDataURL(
  file: File,
  maxDim = 1280,
  quality = 0.85,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      if (typeof reader.result !== "string")
        return reject(new Error("read failed"));
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        try {
          const ratio = Math.min(
            maxDim / img.width,
            maxDim / img.height,
            1,
          );
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas unavailable"));
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
