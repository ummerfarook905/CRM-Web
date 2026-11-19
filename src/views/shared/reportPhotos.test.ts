import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../api/axios";
import { normalizeReportPhotos, reportPhotoUrl } from "./reportPhotos";

describe("report photo URLs", () => {
  beforeEach(() => {
    api.defaults.baseURL = "https://api.example.test/api/v1";
  });

  it("resolves relative upload paths from the API server origin", () => {
    const [photo] = normalizeReportPhotos([{ imageUrl: "/uploads/work-photos/report-1.jpg" }]);

    expect(photo).toBeDefined();
    expect(reportPhotoUrl(photo)).toBe("https://api.example.test/uploads/work-photos/report-1.jpg");
  });

  it("keeps absolute Cloudinary URLs and resolves thumbnail URLs", () => {
    const [photo] = normalizeReportPhotos([{
      imageUrl: "https://res.cloudinary.com/example/image/upload/full.jpg",
      thumbnailUrl: "/uploads/work-photos/thumb.jpg",
      caption: "Completed installation",
    }]);

    expect(reportPhotoUrl(photo)).toBe("https://res.cloudinary.com/example/image/upload/full.jpg");
    expect(reportPhotoUrl(photo, true)).toBe("https://api.example.test/uploads/work-photos/thumb.jpg");
    expect(photo.caption).toBe("Completed installation");
  });
});