import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProptechCase } from "./types";
import { buildScenarios, effectiveSavingsPct, fmtKg, fmtKwh, fmtSek, fmtYears, investmentTotal, irr, npv, payoffYears, sensitivity } from "./calc";

const GREEN: [number, number, number] = [34, 139, 110];
const DARK: [number, number, number] = [40, 40, 40];
const MUTED: [number, number, number] = [110, 110, 110];

function header(doc: jsPDF, c: ProptechCase, pageW: number, margin: number, title: string) {
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${c.number}`, pageW - margin, 12, { align: "right" });
  doc.text(`${c.propertyName || c.customerCompany || ""}`, pageW - margin, 17, { align: "right" });
  doc.text(new Date(c.createdAt).toLocaleDateString("sv-SE"), pageW - margin, 22, { align: "right" });
  doc.setTextColor(...DARK);
}

function footer(doc: jsPDF, pageW: number, pageH: number, margin: number, page: number, total: number) {
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Proptech BOX · Anbudsmotor", margin, pageH - 9);
  doc.text(`Sida ${page} (${total})`, pageW - margin, pageH - 9, { align: "right" });
  doc.setTextColor(...DARK);
}

function buildDoc(c: ProptechCase) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  const totalPagesPlaceholder = "{tp}";
  const scenarios = buildScenarios(c);
  const target = scenarios[1]?.newTemp ?? 22;
  const savingsPct = effectiveSavingsPct(c, target);
  const yearlyKwh = c.currentEnergyKwh * savingsPct;
  const yearlySek = yearlyKwh * c.energyPrice;
  const yearlyCo2 = yearlyKwh * c.emissionFactor;
  const invest = investmentTotal(c);
  const yearlyNet = yearlySek - c.bboYearlyCost;
  const payoff = payoffYears(invest, yearlyNet);
  const npvVal = npv(invest, yearlySek, c.bboYearlyCost, c.contractYears, c.discountRate, c.energyIndexPct);
  const irrVal = irr(invest, yearlySek, c.bboYearlyCost, c.contractYears, c.energyIndexPct);
  const sens = sensitivity(yearlySek);

  // ===== PAGE 1: Försättsblad =====
  header(doc, c, pageW, margin, "ANBUD – PROPTECH BOX");
  let y = 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Smartare värme. Lägre kostnad.", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(`Förslag till ${c.customerCompany || "kund"} – ${c.propertyName || ""}`, margin, y);
  doc.setTextColor(...DARK);

  y += 14;
  // KPI cards
  const cardW = (pageW - margin * 2 - 8) / 3;
  const cards: [string, string][] = [
    ["Årlig besparing", fmtSek(yearlySek)],
    ["Payoff", fmtYears(payoff)],
    ["CO₂ minskning/år", fmtKg(yearlyCo2)],
  ];
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(245, 250, 247);
    doc.roundedRect(x, y, cardW, 26, 3, 3, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(card[0], x + 4, y + 7);
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(card[1], x + 4, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
  });
  y += 34;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("KUND", margin, y);
  doc.text("FASTIGHET", pageW / 2 + 5, y);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 5;
  const left = [c.customerCompany, c.customerContact, c.customerEmail, c.customerPhone].filter(Boolean);
  const right = [c.propertyName, c.propertyAddress, `${c.buildingType} · ${c.apartments} lgh`, `Atemp ${c.area} m²`].filter(Boolean);
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    if (left[i]) doc.text(left[i], margin, y + i * 4.5);
    if (right[i]) doc.text(right[i], pageW / 2 + 5, y + i * 4.5);
  }
  y += max * 4.5 + 8;

  if (c.scope) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text("OMFATTNING", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(c.scope, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;
  }

  footer(doc, pageW, pageH, margin, 1, Number(totalPagesPlaceholder));

  // ===== PAGE 2: Teknik & energi =====
  doc.addPage();
  header(doc, c, pageW, margin, "TEKNISK BAKGRUND");
  y = 38;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Nuläge", margin, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    body: [
      ["Byggnadstyp", `${c.buildingType}`],
      ["Antal lägenheter", `${c.apartments}`],
      ["Atemp", `${c.area} m²`],
      ["Nuvarande inomhustemperatur", `${c.currentTempIndoor} °C`],
      ["Energianvändning värme", fmtKwh(c.currentEnergyKwh)],
      ["Energipris", `${c.energyPrice.toFixed(2)} kr/kWh`],
      ["Emissionsfaktor (fjärrvärme)", `${c.emissionFactor} kg CO₂/kWh`],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
    theme: "plain",
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable
  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Besparingsscenarier", margin, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["Måltemperatur", "Besparing kWh", "Besparing SEK", "CO₂ minskning"]],
    body: scenarios.map((s) => [s.label, fmtKwh(s.savingsKwh), fmtSek(s.savingsSek), fmtKg(s.co2)]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: GREEN, textColor: 255 },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable
  y = doc.lastAutoTable.finalY + 6;

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Beräkning: ${c.calcMethod === "auto" ? `~${(0.05 * 100).toFixed(0)} % besparing per °C sänkning (auto)` : `manuellt satt till ${c.manualSavingsPct} %`}.`,
    margin,
    y,
  );
  doc.setTextColor(...DARK);
  footer(doc, pageW, pageH, margin, 2, Number(totalPagesPlaceholder));

  // ===== PAGE 3: Lösning & paket =====
  doc.addPage();
  header(doc, c, pageW, margin, "LÖSNING & PRIS");
  y = 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Vald lösning", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  autoTable(doc, {
    startY: y,
    head: [["Beskrivning", "Antal", "Enhet", "À-pris", "Summa"]],
    body: c.items.map((i) => [i.name, String(i.qty), i.unit, fmtSek(i.unitPrice), fmtSek(i.qty * i.unitPrice)]),
    foot: [["", "", "", "Investering", fmtSek(invest)]],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: GREEN, textColor: 255 },
    footStyles: { fillColor: [240, 240, 240], textColor: 30, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable
  y = doc.lastAutoTable.finalY + 8;

  if (c.assumptions) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text("FÖRUTSÄTTNINGAR", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(c.assumptions, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;
  }

  footer(doc, pageW, pageH, margin, 3, Number(totalPagesPlaceholder));

  // ===== PAGE 4: Ekonomi =====
  doc.addPage();
  header(doc, c, pageW, margin, "EKONOMISK ANALYS");
  y = 38;
  autoTable(doc, {
    startY: y,
    body: [
      ["Investering", fmtSek(invest)],
      ["Årlig bruttobesparing (energi)", fmtSek(yearlySek)],
      ["BBO årskostnad", fmtSek(c.bboYearlyCost)],
      ["Årlig nettobesparing", fmtSek(yearlyNet)],
      ["Payoff (enkel)", fmtYears(payoff)],
      [`NPV (${c.contractYears} år, diskontering ${c.discountRate} %)`, fmtSek(npvVal)],
      ["IRR", irrVal == null ? "—" : `${(irrVal * 100).toFixed(1)} %`],
      ["Energiprisindex (antagande)", `${c.energyIndexPct} %/år`],
    ],
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 }, 1: { halign: "right" } },
    theme: "grid",
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable
  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Känslighetsanalys ±10 %", margin, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    head: [["Scenario", "Årlig besparing", "Payoff"]],
    body: [
      ["Pessimistiskt (-10 %)", fmtSek(sens.low), fmtYears(payoffYears(invest, sens.low - c.bboYearlyCost))],
      ["Förväntat", fmtSek(sens.base), fmtYears(payoffYears(invest, sens.base - c.bboYearlyCost))],
      ["Optimistiskt (+10 %)", fmtSek(sens.high), fmtYears(payoffYears(invest, sens.high - c.bboYearlyCost))],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: GREEN, textColor: 255 },
    margin: { left: margin, right: margin },
  });
  footer(doc, pageW, pageH, margin, 4, Number(totalPagesPlaceholder));

  // ===== PAGE 5: Signering =====
  doc.addPage();
  header(doc, c, pageW, margin, "GODKÄNNANDE");
  y = 44;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const intro = doc.splitTextToSize(
    `Härmed godkänner ${c.customerCompany || "beställaren"} ovanstående anbud avseende installation av ${c.items[0]?.name ?? "Proptech BOX"} i fastigheten ${c.propertyName || ""}. Anbudet är giltigt 30 dagar från utskriftsdatum. Betalningsvillkor 30 dagar netto. Priser exkl. moms.`,
    pageW - margin * 2,
  );
  doc.text(intro, margin, y);
  y += intro.length * 5 + 18;

  const sigW = (pageW - margin * 2 - 10) / 2;
  ["Beställare", "Leverantör"].forEach((label, i) => {
    const x = margin + i * (sigW + 10);
    doc.setDrawColor(180, 180, 180);
    doc.line(x, y + 22, x + sigW, y + 22);
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`${label} – Underskrift`, x, y + 27);
    doc.text("Namnförtydligande", x, y + 34);
    doc.text("Datum & ort", x, y + 41);
    doc.setTextColor(...DARK);
  });

  footer(doc, pageW, pageH, margin, 5, Number(totalPagesPlaceholder));

  // Replace placeholder with real total
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    // Cover the previous "Sida X (NaN)" by overpainting white box
    doc.setFillColor(255, 255, 255);
    doc.rect(pageW - margin - 30, pageH - 13, 30, 6, "F");
    doc.text(`Sida ${p} (${total})`, pageW - margin, pageH - 9, { align: "right" });
  }

  return doc;
}

export function generateProptechPdf(c: ProptechCase) {
  const doc = buildDoc(c);
  doc.save(`${c.number}_${(c.propertyName || "proptech").replace(/\s+/g, "_")}.pdf`);
}

export function previewProptechPdf(c: ProptechCase) {
  return buildDoc(c).output("datauristring");
}