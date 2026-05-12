export type CalcMethod = "manual" | "auto";

export interface PriceItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface ProptechCase {
  id: string;
  number: string;
  // Customer
  customerCompany: string;
  customerContact: string;
  customerEmail: string;
  customerPhone: string;
  propertyName: string;
  propertyAddress: string;
  // Technical
  buildingType: string;
  apartments: number;
  area: number; // Atemp m2
  currentTempIndoor: number; // °C
  currentEnergyKwh: number; // total annual kWh heating
  energyPrice: number; // SEK/kWh
  emissionFactor: number; // kg CO2 / kWh (district heating ~ 0.06)
  calcMethod: CalcMethod;
  manualSavingsPct: number;
  // Package
  packageId: string;
  items: PriceItem[];
  // Economy / contract
  bboYearlyCost: number; // BBO årskostnad incl moms
  contractYears: number;
  discountRate: number; // %
  energyIndexPct: number; // antagen årlig prisökning %
  // Notes
  scope: string;
  assumptions: string;
  status: "draft" | "sent" | "won" | "lost";
  createdAt: string;
  updatedAt: string;
}

export interface Scenario {
  label: string;
  newTemp: number;
  savingsKwh: number;
  savingsSek: number;
  co2: number;
}
