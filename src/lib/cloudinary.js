const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(blob, folder) {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    throw new Error('Photo hosting is not set up. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET, then redeploy.');
  }
  const body = new FormData();
  body.append('file', blob);
  body.append('upload_preset', CLOUDINARY_PRESET);
  body.append('folder', folder);
  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body });
  } catch {
    throw new Error('Could not reach Cloudinary. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message ? `Cloudinary: ${data.error.message}` : 'Photo upload failed. Try again.');
  }
  return data.secure_url;
}
