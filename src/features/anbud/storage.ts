import type { Anbud } from "./types";

const STORAGE_KEY = "anbud-generator-v4";
const COMPANY_KEY = "anbud-company-v4";
const CUSTOMERS_KEY = "anbud-customers-v4";

export function loadAnbuds(): Anbud[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Anbud[]) : [];
  } catch {
    return [];
  }
}

export function saveAnbuds(list: Anbud[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function loadCompany() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COMPANY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCompany(c: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPANY_KEY, JSON.stringify(c));
}

export function loadCustomers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomers(list: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nextAnbudNumber(list: Anbud[]) {
  const year = new Date().getFullYear();
  const sameYear = list.filter((a) => a.number.startsWith(`A-${year}`));
  const next = (sameYear.length + 1).toString().padStart(4, "0");
  return `A-${year}-${next}`;
}