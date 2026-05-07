export type ProjectCategory = "varme" | "ventilation" | "budget" | "energi" | "ovrigt";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  icon: string;
  category: ProjectCategory;
  description: string;
  defaultScope: string;
  defaultItems: Omit<LineItem, "id">[];
}

export interface Customer {
  company: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  postal: string;
  city: string;
  reference: string;
}

export interface CompanyInfo {
  name: string;
  region: string;
  contactPerson: string;
  email: string;
  phone: string;
  orgnr: string;
}

export type AnbudStatus = "draft" | "sent" | "won" | "lost";

export interface Anbud {
  id: string;
  number: string;
  templateId: string;
  projectName: string;
  scope: string;
  notes: string;
  validUntil: string;
  customer: Customer;
  company: CompanyInfo;
  items: LineItem[];
  vatRate: number;
  discount: number;
  status: AnbudStatus;
  createdAt: string;
  updatedAt: string;
}