import type { ProptechCase } from "./types";

const KEY = "proptech-cases-v1";

export function loadCases(): ProptechCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProptechCase[]) : [];
  } catch {
    return [];
  }
}

export function saveCases(list: ProptechCase[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nextNumber(list: ProptechCase[]) {
  const year = new Date().getFullYear();
  const same = list.filter((c) => c.number.startsWith(`PT-${year}`));
  const n = (same.length + 1).toString().padStart(4, "0");
  return `PT-${year}-${n}`;
}

export const PACKAGES = [
  {
    id: "heat",
    name: "Proptech BOX Heat",
    items: [
      { name: "Proptech BOX Heat styrcentral", qty: 1, unit: "st", unitPrice: 28500 },
      { name: "Installation & driftsättning", qty: 8, unit: "tim", unitPrice: 895 },
      { name: "Material och kablage", qty: 1, unit: "post", unitPrice: 4200 },
    ],
  },
  {
    id: "smart",
    name: "Proptech BOX Heat + Smart",
    items: [
      { name: "Proptech BOX Heat + Smart paket", qty: 1, unit: "st", unitPrice: 42500 },
      { name: "Trådlösa rumsgivare", qty: 12, unit: "st", unitPrice: 1250 },
      { name: "Installation & konfiguration", qty: 14, unit: "tim", unitPrice: 895 },
    ],
  },
  {
    id: "premium",
    name: "Proptech BOX Premium (Heat + Smart + AI)",
    items: [
      { name: "Proptech BOX Premium paket", qty: 1, unit: "st", unitPrice: 65000 },
      { name: "Trådlösa rumsgivare", qty: 24, unit: "st", unitPrice: 1250 },
      { name: "AI-licens 12 mån", qty: 1, unit: "år", unitPrice: 18000 },
      { name: "Installation & konfiguration", qty: 20, unit: "tim", unitPrice: 895 },
    ],
  },
];

export const PRESETS = {
  brfTallen: {
    customerCompany: "BRF Tallen",
    customerContact: "Anna Andersson",
    customerEmail: "ordforande@brftallen.se",
    customerPhone: "070-123 45 67",
    propertyName: "BRF Tallen",
    propertyAddress: "Tallvägen 12, Sundsvall",
    buildingType: "Flerbostadshus",
    apartments: 48,
    area: 3850,
    currentTempIndoor: 22.5,
    currentEnergyKwh: 420000,
    energyPrice: 0.95,
    emissionFactor: 0.06,
  },
};