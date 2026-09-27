/** Uploaded logos above this size are rejected before decoding. */
const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024;

/** Stored logos stay sharp at print/PDF scale (48–56px CSS on a 384dpi page). */
const STORED_LOGO_SIZE = 256;

/** Shrink an image file to a square PNG data URL for stored team logos. */
export function resizeImageToDataUrl(
  file: File,
  size = STORED_LOGO_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_LOGO_FILE_BYTES) {
      reject(new Error("Image file is too large (max 5 MB)"));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not available"));
          return;
        }
        ctx.clearRect(0, 0, size, size);
        const scale = Math.min(size / (image.width || 1), size / (image.height || 1));
        const dw = image.width * scale;
        const dh = image.height * scale;
        ctx.drawImage(image, (size - dw) / 2, (size - dh) / 2, dw, dh);
        punchLightEdgeBackground(ctx, size);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

function luma(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isLightBackground(r: number, g: number, b: number, a: number): boolean {
  if (a < 16) return true;
  return luma(r, g, b) >= 220;
}

/** Make light pixels connected to the canvas edge transparent. */
function punchLightEdgeBackground(ctx: CanvasRenderingContext2D, size: number): void {
  const image = ctx.getImageData(0, 0, size, size);
  const { data, width, height } = image;
  const seen = new Uint8Array(width * height);
  const stack: number[] = [];

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    stack.push(y * width + x);
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!isLightBackground(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
    data[i + 3] = 0;
    const x = p % width;
    const y = (p / width) | 0;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  ctx.putImageData(image, 0, 0);
}
