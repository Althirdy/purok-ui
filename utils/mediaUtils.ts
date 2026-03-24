/**
 * Media Utilities
 * Helpers for detecting and categorizing media types (images, videos, audio)
 */

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp'];
const AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.ogg', '.aac', '.flac'];

/**
 * Check if a URL points to an image file
 */
export function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  // Exclude audio files that might be in images array
  if (AUDIO_EXTENSIONS.some((ext) => lowerUrl.includes(ext))) return false;
  // Exclude video files
  if (VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext))) return false;
  // Include known image extensions
  return IMAGE_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
}

/**
 * Check if a URL points to a video file
 */
export function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
}

/**
 * Check if a URL points to an audio file
 */
export function isAudioUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
}

export type MediaType = 'image' | 'video' | 'audio' | 'unknown';

/**
 * Detect the media type of a URL
 */
export function getMediaType(url: string): MediaType {
  if (isImageUrl(url)) return 'image';
  if (isVideoUrl(url)) return 'video';
  if (isAudioUrl(url)) return 'audio';
  return 'unknown';
}

/**
 * Filter an array of URLs to only visual media (images + videos)
 */
export function getVisualMedia(urls: string[] | undefined): string[] {
  if (!urls) return [];
  return urls.filter((url) => isImageUrl(url) || isVideoUrl(url));
}

/**
 * Separate visual media into images and videos
 */
export function separateMedia(urls: string[] | undefined): { images: string[]; videos: string[] } {
  if (!urls) return { images: [], videos: [] };
  return {
    images: urls.filter(isImageUrl),
    videos: urls.filter(isVideoUrl),
  };
}
