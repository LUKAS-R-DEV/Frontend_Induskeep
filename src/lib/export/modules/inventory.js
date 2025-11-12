import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";
import { formatDate } from "../utils/formatters.js";

export async function exportInventory(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportInventoryCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportInventoryPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  const rows = (list || []).map(p => {
    const tipo = niceType(p?.type);
    const quantidade = q(p?.quantity);
    return {
      peca: p?.piece?.name || "-",
      codigo: p?.piece?.code || "-",
      quantidade: quantidade,
      tipo: tipo,
      ultimaMovimentacao: lastDate(p),
      rawType: p?.type,
      rawQuantity: quantidade,
    };
  });

  const stats = {
    total: rows.length,
    entradas: rows.filter(r => r.rawType === "IN" || r.rawType === "ENTRY").length,
    saidas: rows.filter(r => r.rawType === "OUT" || r.rawType === "EXIT").length,
    pecasUnicas: new Set(rows.map(r => r.peca).filter(p => p !== "-")).size,
    quantidadeTotal: rows.reduce((sum, r) => {
      const qty = typeof r.rawQuantity === "number" ? r.rawQuantity : 0;
      return sum + (r.rawType === "IN" || r.rawType === "ENTRY" ? qty : -qty);
    }, 0),
  };

  return { rows, stats };
}

function niceType(type) {
  if (!type) return "Movimentação";
  const t = String(type).toUpperCase();
  if (t === "IN" || t === "ENTRY") return "Entrada";
  if (t === "OUT" || t === "EXIT") return "Saída";
  return "Movimentação";
}

function q(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : "-";
}

function lastDate(p) {
  return formatDate(p?.updatedAt || p?.createdAt);
}

function exportInventoryCSV(rows, stats) {
  const summary = [
    "RESUMO DO RELATÓRIO DE ESTOQUE",
    `Total de Movimentações: ${stats.total}`,
    `Entradas: ${stats.entradas}`,
    `Saídas: ${stats.saidas}`,
    `Peças Únicas: ${stats.pecasUnicas}`,
    `Saldo Total: ${stats.quantidadeTotal >= 0 ? "+" : ""}${stats.quantidadeTotal}`,
    "",
  ];

  const headers = ["Peça", "Código", "Quantidade", "Tipo"];
  const csvRows = rows.map(r => [
    r.peca,
    r.codigo,
    r.quantidade,
    r.tipo,
  ]);

  const csv = [
    ...summary,
    headers.join(";"),
    ...csvRows.map(r => r.map(v => `"${v ?? ""}"`).join(";"))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `relatorio_estoque_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportInventoryPDF(rows, stats) {
  const doc = createBasePDF("Relatório de Estoque e Movimentações");
  
  const primaryColor = [37, 99, 235];
  const successColor = [16, 185, 129];
  const warningColor = [245, 158, 11];
  const infoColor = [59, 130, 246];

  let startY = 120;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo Executivo", 40, startY);

  startY += 25;

  // Boxes de estatísticas
  const boxWidth = 120;
  const boxHeight = 70;
  const boxX = 40;
  const boxY = startY;

  // Box 1: Total
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(stats.total.toString(), boxX + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Movimentações", boxX + 10, boxY + 30);

  // Box 2: Entradas
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(boxX + boxWidth + 10, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.entradas.toString(), boxX + boxWidth + 20, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Entradas", boxX + boxWidth + 20, boxY + 30);

  // Box 3: Saídas
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(boxX + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...warningColor);
  doc.text(stats.saidas.toString(), boxX + (boxWidth + 10) * 2 + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Saídas", boxX + (boxWidth + 10) * 2 + 10, boxY + 30);

  // Box 4: Peças Únicas
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(boxX + (boxWidth + 10) * 3, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...infoColor);
  doc.text(stats.pecasUnicas.toString(), boxX + (boxWidth + 10) * 3 + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Peças Únicas", boxX + (boxWidth + 10) * 3 + 10, boxY + 30);

  startY += boxHeight + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const saldoText = stats.quantidadeTotal >= 0 ? `Saldo Total: +${stats.quantidadeTotal}` : `Saldo Total: ${stats.quantidadeTotal}`;
  doc.text(saldoText, 40, startY);

  startY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(40, startY, 550, startY);

  // Tabela principal
  startY += 20;

  const tableRows = rows.map(r => [
    r.peca,
    r.codigo || "-",
    r.quantidade.toString(),
    r.tipo,
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["Peça", "Código", "Quantidade", "Tipo"]],
    body: tableRows,
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 6,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 180 },
      1: { cellWidth: 120 },
      2: { cellWidth: 100, halign: "right" },
      3: { cellWidth: 120, halign: "center" },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  addFooter(doc);
  
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_estoque_${dateStr}.pdf`);
}
