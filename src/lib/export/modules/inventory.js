import { createBasePDF, addFooter, drawRoundedRect } from "../utils/pdfUtils.js";
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

  // Calcular totais de entradas e saídas (quantidades, não contagem)
  let totalEntradas = 0;
  let totalSaidas = 0;
  
  rows.forEach(r => {
    const qty = typeof r.rawQuantity === "number" ? r.rawQuantity : 0;
    if (r.rawType === "IN" || r.rawType === "ENTRY") {
      totalEntradas += qty;
    } else if (r.rawType === "OUT" || r.rawType === "EXIT") {
      totalSaidas += qty;
    }
  });
  
  const saldo = totalEntradas - totalSaidas;

  const stats = {
    total: rows.length,
    entradas: rows.filter(r => r.rawType === "IN" || r.rawType === "ENTRY").length,
    saidas: rows.filter(r => r.rawType === "OUT" || r.rawType === "EXIT").length,
    totalEntradas: totalEntradas,
    totalSaidas: totalSaidas,
    saldo: saldo,
    pecasUnicas: new Set(rows.map(r => r.peca).filter(p => p !== "-")).size,
    quantidadeTotal: saldo,
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
    `Total de Entradas: ${stats.totalEntradas}`,
    `Total de Saídas: ${stats.totalSaidas}`,
    `Saldo: ${stats.saldo >= 0 ? "+" : ""}${stats.saldo}`,
    `Peças Únicas: ${stats.pecasUnicas}`,
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
  const dangerColor = [239, 68, 68];

  let startY = 120;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo Executivo", 40, startY);

  startY += 25;

  // Boxes de estatísticas - 3 boxes
  const boxWidth = 150;
  const boxHeight = 75;
  const boxX = 40;
  const boxY = startY;
  const boxSpacing = 15;

  // Box 1: Total de Entradas
  doc.setFillColor(236, 253, 245);
  drawRoundedRect(doc, boxX, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.totalEntradas.toString(), boxX + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Total de", boxX + 10, boxY + 40);
  doc.text("Entradas", boxX + 10, boxY + 50);

  // Box 2: Total de Saídas
  doc.setFillColor(255, 251, 235);
  drawRoundedRect(doc, boxX + boxWidth + boxSpacing, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...warningColor);
  doc.text(stats.totalSaidas.toString(), boxX + boxWidth + boxSpacing + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Total de", boxX + boxWidth + boxSpacing + 10, boxY + 40);
  doc.text("Saídas", boxX + boxWidth + boxSpacing + 10, boxY + 50);

  // Box 3: Saldo
  const saldoColor = stats.saldo >= 0 ? successColor : dangerColor;
  const saldoBgColor = stats.saldo >= 0 ? [236, 253, 245] : [254, 242, 242];
  doc.setFillColor(...saldoBgColor);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 2, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...saldoColor);
  const saldoText = stats.saldo >= 0 ? `+${stats.saldo}` : stats.saldo.toString();
  doc.text(saldoText, boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Saldo", boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 40);

  startY += boxHeight + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Movimentações: ${stats.total} | Peças Únicas: ${stats.pecasUnicas}`, 40, startY);

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
