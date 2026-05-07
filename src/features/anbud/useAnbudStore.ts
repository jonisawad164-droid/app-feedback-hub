import { useEffect, useState, useCallback } from "react";
import type { Anbud, Customer, CompanyInfo } from "./types";
import { TEMPLATES } from "./templates";
import { loadAnbuds, saveAnbuds, loadCompany, saveCompany, loadCustomers, saveCustomers, uid, nextAnbudNumber } from "./storage";

const emptyCustomer: Customer = {
  company: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
  postal: "",
  city: "",
  reference: "",
};

const defaultCompany: CompanyInfo = {
  name: "Bravida",
  region: "Region Södra Norrland",
  contactPerson: "",
  email: "",
  phone: "",
  orgnr: "556222-2484",
};

export function createAnbudFromTemplate(templateId: string, list: Anbud[], company: CompanyInfo): Anbud {
  const tpl = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[TEMPLATES.length - 1];
  const now = new Date();
  const valid = new Date();
  valid.setDate(valid.getDate() + 30);
  return {
    id: uid("anbud"),
    number: nextAnbudNumber(list),
    templateId: tpl.id,
    projectName: tpl.name,
    scope: tpl.defaultScope,
    notes:
      "Anbudet är giltigt 30 dagar från utskriftsdatum. Betalningsvillkor 30 dagar netto. Priser exkl. moms om ej annat anges.",
    validUntil: valid.toISOString().slice(0, 10),
    customer: { ...emptyCustomer },
    company,
    items: tpl.defaultItems.map((i) => ({ ...i, id: uid("item") })),
    vatRate: 25,
    discount: 0,
    status: "draft",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function useAnbudStore() {
  const [anbuds, setAnbuds] = useState<Anbud[]>([]);
  const [company, setCompanyState] = useState<CompanyInfo>(defaultCompany);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAnbuds(loadAnbuds());
    const c = loadCompany();
    if (c) setCompanyState({ ...defaultCompany, ...c });
    setCustomersState(loadCustomers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveAnbuds(anbuds);
  }, [anbuds, hydrated]);

  useEffect(() => {
    if (hydrated) saveCompany(company);
  }, [company, hydrated]);

  useEffect(() => {
    if (hydrated) saveCustomers(customers);
  }, [customers, hydrated]);

  const upsert = useCallback((a: Anbud) => {
    setAnbuds((prev) => {
      const next = { ...a, updatedAt: new Date().toISOString() };
      const idx = prev.findIndex((p) => p.id === a.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [next, ...prev];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setAnbuds((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const duplicate = useCallback((id: string) => {
    setAnbuds((prev) => {
      const src = prev.find((p) => p.id === id);
      if (!src) return prev;
      const copy: Anbud = {
        ...src,
        id: uid("anbud"),
        number: nextAnbudNumber(prev),
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [copy, ...prev];
    });
  }, []);

  const saveCustomer = useCallback((c: Customer) => {
    if (!c.company.trim()) return;
    setCustomersState((prev) => {
      const idx = prev.findIndex((p) => p.company.toLowerCase() === c.company.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = c;
        return copy;
      }
      return [c, ...prev];
    });
  }, []);

  return {
    anbuds,
    company,
    setCompany: setCompanyState,
    customers,
    saveCustomer,
    upsert,
    remove,
    duplicate,
    hydrated,
  };
}