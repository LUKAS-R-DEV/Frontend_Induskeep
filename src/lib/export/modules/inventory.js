import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";
import { formatDate } from "../utils/formatters.js";

export async function exportInventory(data, format = "pdf") {
  if (format === "csv") return exportInventoryCSV(data);
  if (format === "pdf") return exportInventoryPDF(data);
}

function niceType(type) {
  if (!type) return "Movimentação";
  const t = String(type).toUpperCase();
  if (t === "IN") return "Entrada";
  if (t === "OUT") return "Saída";
  return "Movimentação";
}

function q(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : "-";
}

function lastDate(p) {
  return formatDate(p?.updatedAt || p?.createdAt);
}

function exportInventoryCSV(data) {
  const headers = ["Peça", "Quantidade", "Tipo", "Última Movimentação"];
  const rows = (data || []).map(p => [
    p?.piece?.name || "-",
    q(p?.quantity),
    niceType(p?.type),
    lastDate(p)
  ]);
  toCSV(headers, rows);
}

function exportInventoryPDF(data) {
  const doc = createBasePDF("Relatório de Estoque e Movimentações");

  const rows = (data || []).map(p => [
    p?.piece?.name || "-",
    q(p?.quantity),
    niceType(p?.type),
    lastDate(p)
  ]);

  autoTable(doc, {
    startY: 120,
    head: [["Peça", "Quantidade", "Tipo", "Última Movimentação"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
  });

  addFooter(doc);
  doc.save(`relatorio_estoque_${Date.now()}.pdf`);
}
