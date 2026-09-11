import { describe, expect, test } from "bun:test";
import { formatDistance, sortByDistanceMeters } from "../src/lib/proximity";
import { buildEventsToday, buildNearbyPlaces } from "../src/lib/feed/home-premium";

describe("Phase 1A proximity ordering", () => {
  test("sorts numeric meters before formatting the labels", () => {
    const sorted = sortByDistanceMeters([
      { distanceMeters: 500, label: formatDistance(500) },
      { distanceMeters: 2100, label: formatDistance(2100) },
      { distanceMeters: 10200, label: formatDistance(10200) },
      { distanceMeters: 1200, label: formatDistance(1200) },
    ]);

    expect(sorted.map((item) => item.distanceMeters)).toEqual([500, 1200, 2100, 10200]);
    expect(sorted.map((item) => item.label)).toEqual(["500m", "1,2km", "2,1km", "10,2km"]);
  });

  test("does not use formatted labels for ordering", () => {
    const labels = ["500m", "2,1km", "10,2km", "1,2km"];
    const lexical = [...labels].sort((a, b) => a.localeCompare(b, "pt-BR"));

    expect(lexical).not.toEqual(["500m", "1,2km", "2,1km", "10,2km"]);
    expect(
      sortByDistanceMeters([
        { distanceMeters: 10200, label: "10,2km" },
        { distanceMeters: 500, label: "500m" },
        { distanceMeters: 2100, label: "2,1km" },
        { distanceMeters: 1200, label: "1,2km" },
      ]).map((item) => item.label),
    ).toEqual(["500m", "1,2km", "2,1km", "10,2km"]);
  });

  test("nearby places and today events keep numeric order in the home feed", () => {
    const places = buildNearbyPlaces().places;
    const events = buildEventsToday().events;

    const placeMeters = places.map((place) => place.distanceMeters);
    const eventMeters = events.map((event) => event.distanceMeters);

    expect(placeMeters).toEqual([...placeMeters].sort((a, b) => a - b));
    expect(eventMeters).toEqual([...eventMeters].sort((a, b) => a - b));
    expect(places[0]?.distance).toBe(formatDistance(places[0]!.distanceMeters));
    expect(events[0]?.distance).toBe(formatDistance(events[0]!.distanceMeters));
  });
});
