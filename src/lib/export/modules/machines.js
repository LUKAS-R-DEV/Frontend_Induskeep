import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";

export async function exportMachines(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportMachinesCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportMachinesPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  const rows = (list || []).map(m => ({
    nome: m.name || "-",
    serial: m.serial || "-",
    localizacao: m.location || "-",
    status: m.status || "-",
    rawStatus: m.status,
  }));

  const stats = {
    total: rows.length,
    operacionais: rows.filter(r => {
      const s = String(r.rawStatus || "").toUpperCase();
      return s === "ACTIVE" || s === "OPERATIONAL" || s === "OPERATIVA";
    }).length,
    manutencao: rows.filter(r => {
      const s = String(r.rawStatus || "").toUpperCase();
      return s === "MAINTENANCE" || s === "IN_MAINTENANCE" || s === "EM_MANUTENCAO";
    }).length,
    inativas: rows.filter(r => {
      const s = String(r.rawStatus || "").toUpperCase();
      return s === "INACTIVE" || s === "STOPPED" || s === "INATIVA" || s === "PARADA";
    }).length,
    localizacoesUnicas: new Set(rows.map(r => r.localizacao).filter(l => l !== "-")).size,
  };

  return { rows, stats };
}

function formatStatus(status) {
  if (!status) return "-";
  const s = String(status).toUpperCase();
  const statusMap = {
    "ACTIVE": "Operacional",
    "OPERATIONAL": "Operacional",
    "OPERATIVA": "Operacional",
    "MAINTENANCE": "Em Manutenção",
    "IN_MAINTENANCE": "Em Manutenção",
    "EM_MANUTENCAO": "Em Manutenção",
    "INACTIVE": "Inativa",
    "STOPPED": "Inativa",
    "INATIVA": "Inativa",
    "PARADA": "Inativa",
  };
  return statusMap[s] || status;
}

function exportMachinesCSV(rows, stats) {
  const summary = [
    "RESUMO DO RELATÓRIO DE MÁQUINAS",
    `Total de Máquinas: ${stats.total}`,
    `Operacionais: ${stats.operacionais}`,
    `Em Manutenção: ${stats.manutencao}`,
    `Inativas: ${stats.inativas}`,
    `Localizações: ${stats.localizacoesUnicas}`,
    "",
  ];

  const headers = ["Nome", "Número de Série", "Localização", "Status"];
  const csvRows = rows.map(r => [
    r.nome,
    r.serial,
    r.localizacao,
    formatStatus(r.rawStatus),
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
  a.download = `relatorio_maquinas_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportMachinesPDF(rows, stats) {
  const doc = createBasePDF("Relatório de Máquinas");
  
  const primaryColor = [37, 99, 235];
  const successColor = [16, 185, 129];
  const warningColor = [245, 158, 11];
  const dangerColor = [239, 68, 68];

  let startY = 120;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo Executivo", 40, startY);

  startY += 25;

  // Boxes de estatísticas
  const boxWidth = 160;
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
  doc.text("Total de Máquinas", boxX + 10, boxY + 30);

  // Box 2: Operacionais
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(boxX + boxWidth + 10, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.operacionais.toString(), boxX + boxWidth + 20, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Operacionais", boxX + boxWidth + 20, boxY + 30);

  // Box 3: Em Manutenção
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(boxX + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...warningColor);
  doc.text(stats.manutencao.toString(), boxX + (boxWidth + 10) * 2 + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Em Manutenção", boxX + (boxWidth + 10) * 2 + 10, boxY + 30);

  startY += boxHeight + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Localizações: ${stats.localizacoesUnicas}`, 40, startY);

  startY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(40, startY, 550, startY);

  // Tabela principal
  startY += 20;

  const tableRows = rows.map(r => [
    r.nome,
    r.serial,
    r.localizacao,
    formatStatus(r.rawStatus),
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["Nome", "Número de Série", "Localização", "Status"]],
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
      0: { cellWidth: 150 },
      1: { cellWidth: 120 },
      2: { cellWidth: 120 },
      3: { cellWidth: 100, halign: "center" },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  addFooter(doc);
  
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_maquinas_${dateStr}.pdf`);
}
