import { useEffect, useRef, useState } from "react";
import { api } from "../../api/axios";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { reportPhotoUrl, type ReportPhoto } from "./reportPhotos";

function PhotoImage({
  photo,
  thumbnail = false,
  onLoad,
}: {
  photo: ReportPhoto;
  thumbnail?: boolean;
  onLoad?: () => void;
}) {
  const fullSource = reportPhotoUrl(photo);
  const thumbnailSource = reportPhotoUrl(photo, true);
  const [source, setSource] = useState(thumbnail ? thumbnailSource : fullSource);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const fallbackAttempted = useRef(false);

  useEffect(() => {
    setSource(thumbnail ? thumbnailSource : fullSource);
    setLoading(true);
    setFailed(false);
    fallbackAttempted.current = false;
  }, [fullSource, thumbnailSource, thumbnail]);

  useEffect(() => () => {
    if (source.startsWith("blob:")) URL.revokeObjectURL(source);
  }, [source]);

  const loadWithAuth = async () => {
    if (fallbackAttempted.current) {
      setLoading(false);
      setFailed(true);
      return;
    }
    fallbackAttempted.current = true;
    try {
      const response = await api.get(fullSource, { responseType: "blob" });
      if (!String(response.headers["content-type"] ?? "").startsWith("image/")) {
        throw new Error("Photo endpoint did not return an image");
      }
      setSource(URL.createObjectURL(response.data));
      setLoading(false);
      setFailed(false);
    } catch {
      setLoading(false);
      setFailed(true);
    }
  };

  const handleError = () => {
    if (thumbnail && source !== fullSource) {
      setSource(fullSource);
      setLoading(true);
      return;
    }
    void loadWithAuth();
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950">
      {loading && !failed && <span role="status" className="absolute z-10 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white">Loading image…</span>}
      {failed ? (
        <div role="alert" className="flex flex-col items-center gap-2 px-4 text-center text-sm text-white">
          <ImageOff size={24} />
          <span>Image could not be loaded</span>
          {photo.caption && <span className="text-xs text-white/70">{photo.caption}</span>}
        </div>
      ) : (
        <img
          src={source}
          alt={photo.caption || "Work report photo"}
          loading={thumbnail ? "lazy" : "eager"}
          decoding="async"
          onLoad={() => { setLoading(false); onLoad?.(); }}
          onError={handleError}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}

export default function ReportPhotoGallery({ photos }: { photos: ReportPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < photos.length;

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((index) => index === null ? null : (index - 1 + photos.length) % photos.length);
      if (event.key === "ArrowRight") setActiveIndex((index) => index === null ? null : (index + 1) % photos.length);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, photos.length]);

  if (!photos.length) {
    return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No photos attached to this report.</p>;
  }

  return (
    <>
      <div className="grid max-h-[min(60vh,38rem)] gap-3 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={`${photo.id}-${index}`}
            type="button"
            aria-label={`Open photo ${index + 1} of ${photos.length} full screen`}
            onClick={() => setActiveIndex(index)}
            className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="aspect-[4/3]"><PhotoImage photo={photo} thumbnail /></div>
            <span className="block truncate px-3 py-2.5 text-xs text-slate-600">{photo.caption || `Photo ${index + 1}`}</span>
          </button>
        ))}
      </div>

      {isOpen && activeIndex !== null && (
        <div
          className="fixed inset-0 z-[120] flex flex-col bg-black/95 p-3 text-white sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${activeIndex + 1} of ${photos.length}`}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 px-1 py-1">
            <p className="min-w-0 truncate text-sm font-medium">{photos[activeIndex].caption || `Photo ${activeIndex + 1}`} <span className="ml-2 text-white/60">{activeIndex + 1} / {photos.length}</span></p>
            <button type="button" aria-label="Close full-screen photo" onClick={() => setActiveIndex(null)} className="shrink-0 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X size={21} /></button>
          </header>
          <div className="relative flex min-h-0 flex-1 items-center justify-center py-3">
            <PhotoImage photo={photos[activeIndex]} />
            {photos.length > 1 && <>
              <button type="button" aria-label="Previous photo" onClick={() => setActiveIndex((activeIndex - 1 + photos.length) % photos.length)} className="absolute left-2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"><ChevronLeft size={22} /></button>
              <button type="button" aria-label="Next photo" onClick={() => setActiveIndex((activeIndex + 1) % photos.length)} className="absolute right-2 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"><ChevronRight size={22} /></button>
            </>}
          </div>
        </div>
      )}
    </>
  );
}