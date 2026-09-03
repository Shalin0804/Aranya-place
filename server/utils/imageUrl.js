/**
 * Gallery images can be either a real URL (seeded Unsplash links) or a
 * base64 data URI (device uploads, stored inline in the DB). Embedding a
 * data URI straight into a JSON list response bloats the payload and
 * blocks the whole list from rendering until every image has downloaded,
 * with no browser caching. So list/detail endpoints swap data URIs for a
 * lightweight reference to the dedicated image-serving route instead,
 * which streams the bytes with proper Content-Type + Cache-Control.
 *
 * The client is hosted on a different origin than the API, so the
 * reference has to be an absolute URL — a relative path would resolve
 * against the client's own origin instead.
 */
export function toPublicImageUrl(req, id, imageUrl) {
  if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
    return `${req.protocol}://${req.get('host')}/api/gallery/${id}/image`;
  }
  return imageUrl;
}
