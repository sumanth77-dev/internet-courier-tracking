/**
 * SkyRoute - Proof of Delivery Image Compressor & Optimizer
 * 
 * Automatically resizes and compresses high-resolution photographs taken on mobile
 * devices (which often exceed 5-15 MB) to a target size of <= 1.5 MB before upload.
 * Preserves package clarity, orientation (EXIF), and converts to clean JPEG format.
 */

// Permitted MIME types for Proof of Delivery
export const ALLOWED_POD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Permitted extensions
export const ALLOWED_POD_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Target constraints
export const POD_COMPRESSION_CONFIG = {
  maxWidth: 1600,
  maxHeight: 1600,
  targetMaxBytes: 1.5 * 1024 * 1024, // 1.5 MB
  initialQuality: 0.8,
  minQuality: 0.5, // Safeguard to keep package label text legible
};

/**
 * Format bytes to human-readable string (KB / MB)
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Validates file type before compression
 */
export const validatePodImageFile = (file) => {
  if (!file) {
    throw new Error('No file selected.');
  }

  const name = file.name || '';
  const ext = (name.lastIndexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')).toLowerCase() : '');
  const mime = file.type || '';

  const isMimeAllowed = ALLOWED_POD_MIME_TYPES.includes(mime);
  const isExtAllowed = ALLOWED_POD_EXTENSIONS.includes(ext);

  if (!isMimeAllowed && !isExtAllowed) {
    throw new Error('Unsupported file format. Please upload a JPEG, PNG, or WebP photo.');
  }

  return true;
};

/**
 * Loads image using createImageBitmap (with EXIF auto-orientation) or HTMLImageElement fallback
 */
const loadImageSource = async (file) => {
  // Method 1: Modern createImageBitmap with EXIF orientation preservation
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => {
          if (typeof bitmap.close === 'function') bitmap.close();
        },
      };
    } catch {
      // Fallback to Image() if createImageBitmap fails on specific format
    }
  }

  // Method 2: Standard HTMLImageElement fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        close: () => {
          URL.revokeObjectURL(objectUrl);
        },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          'Unable to read the selected image. The file may be corrupted or in an unsupported format.'
        )
      );
    };

    img.src = objectUrl;
  });
};

/**
 * Calculates scaled dimensions preserving aspect ratio
 */
export const calculateFitDimensions = (width, height, maxWidth, maxHeight) => {
  let targetWidth = width;
  let targetHeight = height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  return { width: targetWidth, height: targetHeight };
};

/**
 * Renders source image onto an HTML5 canvas and exports as JPEG blob
 */
const renderToJpegBlob = (source, width, height, quality) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Unable to initialize canvas rendering context.');
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill solid white background (prevents black background if PNG has transparency)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Draw image
      ctx.drawImage(source, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas compression returned empty output.'));
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        quality
      );
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Compress delivery photo
 * 
 * @param {File} file Original image file from input
 * @param {Object} options Optional custom overrides
 * @returns {Promise<Object>} Compression result with compressed File, stats, and preview
 */
export const compressDeliveryPhoto = async (file, options = {}) => {
  validatePodImageFile(file);

  const config = {
    ...POD_COMPRESSION_CONFIG,
    ...options,
  };

  const loaded = await loadImageSource(file);

  try {
    const { source, width: originalWidth, height: originalHeight } = loaded;

    // Fast-path: Avoid unnecessary compression if already JPEG, under target size, and within dimension limits
    if (
      file.size <= config.targetMaxBytes &&
      originalWidth <= config.maxWidth &&
      originalHeight <= config.maxHeight &&
      file.type === 'image/jpeg'
    ) {
      return {
        file: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressed: false,
        savingsPercent: 0,
        width: originalWidth,
        height: originalHeight,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      };
    }

    // Step 1: Calculate target dimensions within 1600x1600
    let { width: targetWidth, height: targetHeight } = calculateFitDimensions(
      originalWidth,
      originalHeight,
      config.maxWidth,
      config.maxHeight
    );

    // Step 2: Progressive compression loop
    let quality = config.initialQuality; // 0.8
    let blob = await renderToJpegBlob(source, targetWidth, targetHeight, quality);

    // If still larger than target, try quality 0.7
    if (blob.size > config.targetMaxBytes && quality > 0.7) {
      quality = 0.7;
      blob = await renderToJpegBlob(source, targetWidth, targetHeight, quality);
    }

    // If still larger than target, try quality 0.6
    if (blob.size > config.targetMaxBytes && quality > 0.6) {
      quality = 0.6;
      blob = await renderToJpegBlob(source, targetWidth, targetHeight, quality);
    }

    // If still larger than target, downscale dimensions by 15% and re-render
    if (blob.size > config.targetMaxBytes) {
      targetWidth = Math.round(targetWidth * 0.85);
      targetHeight = Math.round(targetHeight * 0.85);
      quality = 0.6;
      blob = await renderToJpegBlob(source, targetWidth, targetHeight, quality);
    }

    // Final downscale if strictly required to stay well below 1.5 MB limit
    if (blob.size > config.targetMaxBytes) {
      targetWidth = Math.min(targetWidth, 1024);
      targetHeight = Math.min(targetHeight, 1024);
      quality = Math.max(config.minQuality, 0.55);
      blob = await renderToJpegBlob(source, targetWidth, targetHeight, quality);
    }

    // Step 3: Package into standard File object
    const originalName = file.name || 'delivery-proof';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const cleanFileName = `${baseName}.jpg`;

    const compressedFile = new File([blob], cleanFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    const savings = file.size > compressedFile.size
      ? Math.round(((file.size - compressedFile.size) / file.size) * 100)
      : 0;

    return {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressed: true,
      savingsPercent: savings,
      width: targetWidth,
      height: targetHeight,
      mimeType: 'image/jpeg',
      previewUrl: URL.createObjectURL(compressedFile),
    };
  } finally {
    // Release memory / object URLs
    loaded.close();
  }
};

