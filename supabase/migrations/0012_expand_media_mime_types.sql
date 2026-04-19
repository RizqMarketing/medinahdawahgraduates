-- =============================================================================
-- Expand accepted MIME types on media buckets so real-world files from basic
-- Android phones, iPhones, and WhatsApp voice notes all upload successfully.
-- =============================================================================

update storage.buckets
set allowed_mime_types = array[
  -- Photos
  'image/jpeg','image/png','image/webp',
  'image/heic','image/heif',
  'image/gif'
]
where id = 'graduate-photos';

update storage.buckets
set allowed_mime_types = array[
  -- Photos
  'image/jpeg','image/png','image/webp',
  'image/heic','image/heif',
  'image/gif',
  -- Videos
  'video/mp4','video/webm','video/quicktime',
  'video/3gpp','video/3gpp2',
  'video/x-matroska',
  -- Audio
  'audio/mpeg','audio/mp4','audio/webm','audio/ogg',
  'audio/wav','audio/x-wav',
  'audio/flac','audio/x-flac',
  'audio/amr','audio/3gpp',
  'audio/opus'
]
where id = 'report-media';
