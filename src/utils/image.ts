/**
 * Thu nhỏ và nén ảnh thành data URL JPEG.
 *
 * Ảnh được lưu thẳng dạng base64 trong Firestore (giới hạn 1 MiB mỗi document),
 * nên ảnh chụp từ điện thoại (vài MB) phải được nén trước khi gửi.
 */
export const compressImage = async (
  file: Blob,
  maxDimension = 1280,
  maxBytes = 700 * 1024
): Promise<string> => {
  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas không khả dụng');
  // Nền trắng cho ảnh PNG trong suốt (JPEG không có kênh alpha)
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Giảm dần chất lượng cho tới khi vừa giới hạn dung lượng
  let dataUrl = '';
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length * 0.75 <= maxBytes) break;
  }
  return dataUrl;
};

const loadImage = (file: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh'));
    };
    img.src = url;
  });
