import type { Metro } from "./types";

export const METROS: Record<
  Metro,
  { name: string; city: string; zips: string[]; lat: number; lng: number }
> = {
  PHX: {
    name: "Phoenix",
    city: "Phoenix",
    zips: ["85016", "85018", "85020", "85012"],
    lat: 33.4484,
    lng: -112.074,
  },
  ATL: {
    name: "Atlanta",
    city: "Atlanta",
    zips: ["30309", "30305", "30306", "30308"],
    lat: 33.749,
    lng: -84.388,
  },
  DAL: {
    name: "Dallas",
    city: "Dallas",
    zips: ["75201", "75204", "75206", "75219"],
    lat: 32.7767,
    lng: -96.797,
  },
  DEN: {
    name: "Denver",
    city: "Denver",
    zips: ["80202", "80203", "80205", "80209"],
    lat: 39.7392,
    lng: -104.9903,
  },
  TPA: {
    name: "Tampa",
    city: "Tampa",
    zips: ["33602", "33606", "33609", "33611"],
    lat: 27.9506,
    lng: -82.4572,
  },
  CLT: {
    name: "Charlotte",
    city: "Charlotte",
    zips: ["28202", "28203", "28204", "28207"],
    lat: 35.2271,
    lng: -80.8431,
  },
  BNA: {
    name: "Nashville",
    city: "Nashville",
    zips: ["37203", "37201", "37206", "37212"],
    lat: 36.1627,
    lng: -86.7816,
  },
  AUS: {
    name: "Austin",
    city: "Austin",
    zips: ["78701", "78702", "78703", "78704"],
    lat: 30.2672,
    lng: -97.7431,
  },
};

export const METRO_ORDER: Metro[] = ["PHX", "ATL", "DAL", "DEN", "TPA", "CLT", "BNA", "AUS"];

export function metroLabel(metro: Metro): string {
  return METROS[metro].name;
}
