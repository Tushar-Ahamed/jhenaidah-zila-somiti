import { supabase } from '@/lib/supabase';
import heic2any from 'heic2any';

const BUCKET = 'uploads';

async function decodeImage(file: File): Promise<HTMLImageElement> {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to decode image'));
      image.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function decodeHeic(file: File): Promise<Blob> {
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  if (Array.isArray(converted)) {
    return converted[0];
  }
  return converted;
}

export async function optimizeImageForUpload(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
    crop?: {
      zoom?: number;
      rotation?: number;
      offsetX?: number;
      offsetY?: number;
    };
  } = {}
): Promise<File> {
  try {
    const maxWidth = options.maxWidth ?? 800;
    const maxHeight = options.maxHeight ?? 800;
    const quality = options.quality ?? 0.75;
    const maxSizeMB = options.maxSizeMB ?? 2;
    const crop = options.crop ?? {};

    const source = file.type.includes('heic') || file.type.includes('heif')
      ? await decodeHeic(file)
      : file;

    const image = await (typeof source === 'string' ? Promise.reject(new Error('Unsupported source')) : decodeImage(new File([source], file.name, { type: source.type || 'image/jpeg' })));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable');

    const rotation = ((crop.rotation ?? 0) * Math.PI) / 180;
    const zoom = crop.zoom ?? 1;
    const offsetX = crop.offsetX ?? 0;
    const offsetY = crop.offsetY ?? 0;

    const srcWidth = image.naturalWidth;
    const srcHeight = image.naturalHeight;
    const rotatedWidth = Math.abs(srcWidth * Math.cos(rotation)) + Math.abs(srcHeight * Math.sin(rotation));
    const rotatedHeight = Math.abs(srcWidth * Math.sin(rotation)) + Math.abs(srcHeight * Math.cos(rotation));
    const scale = Math.min(maxWidth / rotatedWidth, maxHeight / rotatedHeight, 1) * zoom;

    canvas.width = maxWidth;
    canvas.height = maxHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
    ctx.rotate(rotation);
    ctx.drawImage(image, -srcWidth * scale / 2, -srcHeight * scale / 2, srcWidth * scale, srcHeight * scale);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(maxWidth / 2, maxHeight / 2, Math.min(maxWidth, maxHeight) / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
    ctx.rotate(rotation);
    ctx.drawImage(image, -srcWidth * scale / 2, -srcHeight * scale / 2, srcWidth * scale, srcHeight * scale);
    ctx.restore();

    let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Unable to create image blob');

    let qualityLevel = quality;
    while (blob.size > maxSizeMB * 1024 * 1024 && qualityLevel > 0.4) {
      qualityLevel -= 0.1;
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualityLevel));
    }

    const safeName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], safeName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function fileToDataURL(file: File): Promise<string> {
  return fileToCompressedDataURL(file, 400, 400, 0.7);
}

export function fileToCompressedDataURL(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return reject(new Error('Empty file content'));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; path: string }> {
  const filePath = `${path}/${Date.now()}-${file.name}`;
  try {
    onProgress?.(20);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;
    onProgress?.(100);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return { url: data.publicUrl, path: filePath };
  } catch {
    const dataUrl = await fileToCompressedDataURL(file, 600, 600, 0.75);
    return { url: dataUrl, path: filePath };
  }
}

export async function deleteImage(path: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // best-effort
  }
}

export async function deleteProfileImageByUrl(url: string): Promise<void> {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/i);
    if (!match) return;
    const bucket = match[1];
    const path = decodeURIComponent(match[2]);
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // best-effort
  }
}

// ===== Avatar upload =====

const AVATAR_BUCKET = 'avatars';

export async function uploadAvatar(
  file: File,
  uid: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${uid}/avatar-${Date.now()}.${ext}`;
  const buckets = [AVATAR_BUCKET, BUCKET];

  onProgress?.(20);
  for (const bucket of buckets) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (!uploadError) {
        onProgress?.(100);
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { url: data.publicUrl, path: filePath };
      }
    } catch {
      // continue to next fallback
    }
  }

  onProgress?.(100);
  const dataUrl = await fileToCompressedDataURL(file, 400, 400, 0.7);
  return { url: dataUrl, path: filePath };
}
