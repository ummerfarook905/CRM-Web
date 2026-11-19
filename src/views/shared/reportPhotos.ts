import { resolveApiAssetUrl } from "../../api/axios";

export interface ReportPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
}

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : {};
const text = (value: unknown): string => typeof value === "string" ? value : "";

export function normalizeReportPhotos(value: unknown): ReportPhoto[] {
  const rows = Array.isArray(value) ? value : [];
  return rows.flatMap((photo, index): ReportPhoto[] => {
    if (typeof photo === "string") {
      return photo ? [{ id: `${photo}-${index}`, imageUrl: photo, thumbnailUrl: "", caption: "" }] : [];
    }
    const item = record(photo);
    const imageUrl = text(item.imageUrl ?? item.url ?? item.photoUrl ?? item.fileUrl ?? item.path ?? item.thumbnailUrl);
    if (!imageUrl) return [];
    return [{
      id: text(item.id ?? item.photoId) || `${imageUrl}-${index}`,
      imageUrl,
      thumbnailUrl: text(item.thumbnailUrl ?? item.thumbnailImageUrl ?? item.thumbnail),
      caption: text(item.caption ?? item.description),
    }];
  });
}

export function reportPhotoUrl(photo: ReportPhoto, thumbnail = false): string {
  const source = thumbnail ? photo.thumbnailUrl || photo.imageUrl : photo.imageUrl;
  return resolveApiAssetUrl(source);
}