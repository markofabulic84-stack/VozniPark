import { describe, expect, it } from "vitest";
import { statusDatuma, statusServisa } from "@/lib/rokovi";

const DAN_MS = 24 * 60 * 60 * 1000;
const danas = new Date(2026, 6, 1);

describe("statusDatuma", () => {
  it("null bez datuma", () => {
    expect(statusDatuma(null, danas)).toBeNull();
  });

  it("ok za daleki datum", () => {
    const r = statusDatuma(new Date(danas.getTime() + 90 * DAN_MS), danas)!;
    expect(r.status).toBe("ok");
    expect(r.danaDo).toBe(90);
  });

  it("upozorenje unutar 30 dana", () => {
    expect(
      statusDatuma(new Date(danas.getTime() + 15 * DAN_MS), danas)!.status,
    ).toBe("upozorenje");
  });

  it("kritično nakon isteka", () => {
    const r = statusDatuma(new Date(danas.getTime() - 5 * DAN_MS), danas)!;
    expect(r.status).toBe("kritično");
    expect(r.danaDo).toBe(-5);
  });
});

describe("statusServisa", () => {
  it("null bez postavljenog servisa", () => {
    expect(statusServisa(null, 50000)).toBeNull();
  });

  it("ok kad je servis daleko", () => {
    expect(statusServisa(55000, 50000)!.status).toBe("ok");
  });

  it("upozorenje unutar 500 km", () => {
    const r = statusServisa(50330, 50000)!;
    expect(r.status).toBe("upozorenje");
    expect(r.kmDo).toBe(330);
  });

  it("kritično kad servis kasni", () => {
    const r = statusServisa(50000, 50170)!;
    expect(r.status).toBe("kritično");
    expect(r.kmDo).toBe(-170);
  });
});
