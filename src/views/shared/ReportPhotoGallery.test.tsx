import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../../api/axios";
import ReportPhotoGallery from "./ReportPhotoGallery";
import { normalizeReportPhotos } from "./reportPhotos";

describe("ReportPhotoGallery", () => {
  beforeEach(() => {
    api.defaults.baseURL = "https://api.example.test/api/v1";
  });

  it("shows more than two photos and opens the selected original full screen", () => {
    const photos = normalizeReportPhotos([
      { id: "one", imageUrl: "/uploads/one.jpg", thumbnailUrl: "/uploads/one-thumb.jpg", caption: "First" },
      { id: "two", imageUrl: "https://res.cloudinary.com/example/two.jpg", caption: "Second" },
      { id: "three", imageUrl: "/uploads/three.jpg", caption: "Third" },
    ]);

    render(<ReportPhotoGallery photos={photos} />);

    expect(screen.getByRole("button", { name: "Open photo 1 of 3 full screen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open photo 2 of 3 full screen" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open photo 3 of 3 full screen" }));

    const viewer = screen.getByRole("dialog", { name: "Photo 3 of 3" });
    expect(viewer).toBeTruthy();
    expect(within(viewer).getByRole("img", { name: "Third" }).getAttribute("src"))
      .toBe("https://api.example.test/uploads/three.jpg");
  });

  it("shows an explicit error when an image fails to load", () => {
    const photos = normalizeReportPhotos([{ id: "broken", imageUrl: "/uploads/missing.jpg", caption: "Missing photo" }]);
    render(<ReportPhotoGallery photos={photos} />);
    fireEvent.error(screen.getByRole("img", { name: "Missing photo" }));

    expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Image could not be loaded"))).toBe(true);
  });
});