import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Anbud } from "./types";

const fmt = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);

export function calcTotals(a: Anbud) {
  const subtotal = a.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = subtotal * (a.discount / 100);
  const net = subtotal - discount;
  const vat = net * (a.vatRate / 100);
  const total = net + vat;
  return { subtotal, discount, net, vat, total };
}

export function generatePdf(a: Anbud) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header band
  doc.setFillColor(34, 139, 110);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ANBUD", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(a.company.name || "Företag", pageW - margin, 14, { align: "right" });
  doc.text(a.company.region || "", pageW - margin, 19, { align: "right" });
  doc.text(a.number, pageW - margin, 24, { align: "right" });

  // Meta block
  doc.setTextColor(40, 40, 40);
  let y = 38;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(a.projectName || "Projekt", margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date(a.createdAt).toLocaleDateString("sv-SE")}`, margin, y);
  doc.text(`Giltigt t.o.m: ${a.validUntil || "-"}`, margin + 60, y);
  doc.text(`Anbudsnr: ${a.number}`, margin + 120, y);

  // Customer / Company columns
  y += 10;
  doc.setTextColor(34, 139, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KUND", margin, y);
  doc.text("LEVERANTÖR", pageW / 2 + 5, y);
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 5;
  const custLines = [
    a.customer.company,
    a.customer.contact,
    a.customer.address,
    `${a.customer.postal} ${a.customer.city}`.trim(),
    a.customer.email,
    a.customer.phone,
    a.customer.reference ? `Ref: ${a.customer.reference}` : "",
  ].filter(Boolean);
  const compLines = [
    a.company.name,
    a.company.contactPerson,
    a.company.region,
    a.company.email,
    a.company.phone,
    a.company.orgnr ? `Org.nr: ${a.company.orgnr}` : "",
  ].filter(Boolean);
  const maxLines = Math.max(custLines.length, compLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (custLines[i]) doc.text(custLines[i], margin, y + i * 4.5);
    if (compLines[i]) doc.text(compLines[i], pageW / 2 + 5, y + i * 4.5);
  }
  y += maxLines * 4.5 + 6;

  // Scope
  if (a.scope) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 110);
    doc.text("OMFATTNING", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const scopeLines = doc.splitTextToSize(a.scope, pageW - margin * 2);
    doc.text(scopeLines, margin, y);
    y += scopeLines.length * 4.5 + 4;
  }

  const t = calcTotals(a);

  autoTable(doc, {
    startY: y,
    head: [["Beskrivning", "Antal", "Enhet", "À-pris", "Summa"]],
    body: a.items.map((i) => [
      i.description,
      i.quantity.toString(),
      i.unit,
      fmt(i.unitPrice),
      fmt(i.quantity * i.unitPrice),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [34, 139, 110], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error lastAutoTable is added by autotable plugin
  let endY: number = doc.lastAutoTable.finalY + 6;

  // Totals box
  const boxX = pageW - margin - 75;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const rows: [string, string][] = [
    ["Delsumma", fmt(t.subtotal)],
    ...(t.discount > 0 ? [["Rabatt", `- ${fmt(t.discount)}`] as [string, string]] : []),
    ["Netto", fmt(t.net)],
    [`Moms (${a.vatRate}%)`, fmt(t.vat)],
  ];
  rows.forEach((r, i) => {
    doc.text(r[0], boxX, endY + i * 5);
    doc.text(r[1], pageW - margin, endY + i * 5, { align: "right" });
  });
  endY += rows.length * 5 + 2;
  doc.setDrawColor(34, 139, 110);
  doc.setLineWidth(0.4);
  doc.line(boxX, endY, pageW - margin, endY);
  endY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Totalt inkl. moms", boxX, endY);
  doc.text(fmt(t.total), pageW - margin, endY, { align: "right" });

  if (a.notes) {
    endY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(34, 139, 110);
    doc.text("VILLKOR & NOTERINGAR", margin, endY);
    endY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const noteLines = doc.splitTextToSize(a.notes, pageW - margin * 2);
    doc.text(noteLines, margin, endY);
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${a.company.name || ""} · ${a.company.email || ""} · ${a.company.phone || ""}`, margin, pageH - 10);
  doc.text("Sida 1", pageW - margin, pageH - 10, { align: "right" });

  doc.save(`${a.number}_${(a.projectName || "anbud").replace(/\s+/g, "_")}.pdf`);
}

export function previewPdfDataUri(a: Anbud) {
  const doc = generatePdfDoc(a);
  return doc.output("datauristring");
}

function generatePdfDoc(a: Anbud) {
  // Reuse generatePdf logic by re-calling with returning the doc; for preview we duplicate minimal version.
  // To avoid duplication we re-implement by calling generatePdf with a hook, but jsPDF.save triggers download.
  // Instead, build using the same pieces:
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  doc.setFillColor(34, 139, 110);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ANBUD", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(a.company.name || "Företag", pageW - margin, 14, { align: "right" });
  doc.text(a.company.region || "", pageW - margin, 19, { align: "right" });
  doc.text(a.number, pageW - margin, 24, { align: "right" });
  doc.setTextColor(40, 40, 40);
  let y = 38;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(a.projectName || "Projekt", margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Datum: ${new Date(a.createdAt).toLocaleDateString("sv-SE")}`, margin, y);
  doc.text(`Giltigt t.o.m: ${a.validUntil || "-"}`, margin + 60, y);
  y += 10;
  doc.setTextColor(34, 139, 110);
  doc.setFont("helvetica", "bold");
  doc.text("KUND", margin, y);
  doc.text("LEVERANTÖR", pageW / 2 + 5, y);
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 5;
  const custLines = [a.customer.company, a.customer.contact, a.customer.address, `${a.customer.postal} ${a.customer.city}`.trim(), a.customer.email, a.customer.phone].filter(Boolean);
  const compLines = [a.company.name, a.company.contactPerson, a.company.region, a.company.email, a.company.phone].filter(Boolean);
  const maxLines = Math.max(custLines.length, compLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (custLines[i]) doc.text(custLines[i], margin, y + i * 4.5);
    if (compLines[i]) doc.text(compLines[i], pageW / 2 + 5, y + i * 4.5);
  }
  y += maxLines * 4.5 + 6;
  if (a.scope) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 139, 110);
    doc.text("OMFATTNING", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const scopeLines = doc.splitTextToSize(a.scope, pageW - margin * 2);
    doc.text(scopeLines, margin, y);
    y += scopeLines.length * 4.5 + 4;
  }
  const t = calcTotals(a);
  autoTable(doc, {
    startY: y,
    head: [["Beskrivning", "Antal", "Enhet", "À-pris", "Summa"]],
    body: a.items.map((i) => [i.description, i.quantity.toString(), i.unit, fmt(i.unitPrice), fmt(i.quantity * i.unitPrice)]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [34, 139, 110], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable
  let endY: number = doc.lastAutoTable.finalY + 6;
  const boxX = pageW - margin - 75;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const rows: [string, string][] = [
    ["Delsumma", fmt(t.subtotal)],
    ...(t.discount > 0 ? [["Rabatt", `- ${fmt(t.discount)}`] as [string, string]] : []),
    ["Netto", fmt(t.net)],
    [`Moms (${a.vatRate}%)`, fmt(t.vat)],
  ];
  rows.forEach((r, i) => {
    doc.text(r[0], boxX, endY + i * 5);
    doc.text(r[1], pageW - margin, endY + i * 5, { align: "right" });
  });
  endY += rows.length * 5 + 2;
  doc.setDrawColor(34, 139, 110);
  doc.line(boxX, endY, pageW - margin, endY);
  endY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Totalt inkl. moms", boxX, endY);
  doc.text(fmt(t.total), pageW - margin, endY, { align: "right" });
  if (a.notes) {
    endY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(34, 139, 110);
    doc.text("VILLKOR & NOTERINGAR", margin, endY);
    endY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const noteLines = doc.splitTextToSize(a.notes, pageW - margin * 2);
    doc.text(noteLines, margin, endY);
  }
  return doc;
}