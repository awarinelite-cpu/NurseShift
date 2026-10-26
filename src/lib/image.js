// Shrinks a picked photo before upload: longest side 1600px, JPEG ~82%.
// Phone photos are often 4-8 MB; this brings them to a few hundred KB so
// uploads are fast on mobile data and pages load quickly for nurses.
export const MAX_PHOTO_INPUT_BYTES = 15 * 1024 * 1024;

export async function compressImage(file, maxDim = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  if (file.size > MAX_PHOTO_INPUT_BYTES) throw new Error(`${file.name} is larger than 15 MB.`);

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} could not be read. Use a JPG, PNG or WebP photo.`);
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error(`${file.name} could not be processed.`);
  return blob;
}

// Profile pictures: centre-crop to a square, 480px, JPEG. Small enough to load
// instantly in lists and the sidebar.
export async function compressAvatar(file, size = 480, quality = 0.85) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG or WebP).');
  if (file.size > MAX_PHOTO_INPUT_BYTES) throw new Error('That photo is larger than 15 MB.');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('That photo could not be read. Use a JPG, PNG or WebP image.');
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const out = Math.min(size, side);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('That photo could not be processed.');
  return blob;
}
