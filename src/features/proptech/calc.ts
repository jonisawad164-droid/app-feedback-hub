import type { ProptechCase, Scenario } from "./types";

// Rule of thumb: ~5% värmebesparing per °C sänkt inomhustemperatur
export const SAVINGS_PER_DEGREE = 0.05;

export function autoSavingsPct(currentTemp: number, targetTemp: number) {
  const delta = Math.max(0, currentTemp - targetTemp);
  return Math.min(0.25, delta * SAVINGS_PER_DEGREE);
}

export function effectiveSavingsPct(c: ProptechCase, targetTemp: number) {
  if (c.calcMethod === "manual") return Math.max(0, Math.min(0.5, c.manualSavingsPct / 100));
  return autoSavingsPct(c.currentTempIndoor, targetTemp);
}

export function buildScenarios(c: ProptechCase): Scenario[] {
  return [21, 22, 23].map((t) => {
    const pct = effectiveSavingsPct(c, t);
    const kwh = c.currentEnergyKwh * pct;
    const sek = kwh * c.energyPrice;
    const co2 = kwh * c.emissionFactor;
    return { label: `${t} °C`, newTemp: t, savingsKwh: kwh, savingsSek: sek, co2 };
  });
}

export function investmentTotal(c: ProptechCase) {
  return c.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

export function payoffYears(invest: number, yearlyNet: number) {
  if (yearlyNet <= 0) return Infinity;
  return invest / yearlyNet;
}

/** NPV över n år med årlig besparing som indexeras med energyIndexPct, minus BBO årskostnad */
export function npv(invest: number, yearlySavings: number, bbo: number, years: number, discountPct: number, indexPct: number) {
  const r = discountPct / 100;
  const g = indexPct / 100;
  let value = -invest;
  for (let y = 1; y <= years; y++) {
    const inflow = yearlySavings * Math.pow(1 + g, y - 1) - bbo;
    value += inflow / Math.pow(1 + r, y);
  }
  return value;
}

/** Approximativ IRR via bisection */
export function irr(invest: number, yearlySavings: number, bbo: number, years: number, indexPct: number) {
  const f = (rate: number) => {
    let v = -invest;
    for (let y = 1; y <= years; y++) {
      const inflow = yearlySavings * Math.pow(1 + indexPct / 100, y - 1) - bbo;
      v += inflow / Math.pow(1 + rate, y);
    }
    return v;
  };
  let lo = -0.5;
  let hi = 1;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const v = f(mid);
    if (Math.abs(v) < 1) return mid;
    if (f(lo) * v < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** ±10% känslighet på besparing och energipris */
export function sensitivity(yearlySavings: number) {
  return {
    low: yearlySavings * 0.9,
    base: yearlySavings,
    high: yearlySavings * 1.1,
  };
}

export const fmtSek = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(
    isFinite(n) ? n : 0,
  );
export const fmtKwh = (n: number) =>
  `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0)} kWh`;
export const fmtKg = (n: number) =>
  `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(isFinite(n) ? n : 0)} kg CO₂`;
export const fmtPct = (n: number) =>
  `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(isFinite(n) ? n * 100 : 0)} %`;
export const fmtYears = (n: number) =>
  isFinite(n) ? `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(n)} år` : "—";