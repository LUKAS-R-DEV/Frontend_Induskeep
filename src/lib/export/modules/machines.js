import { createBasePDF, addFooter, drawRoundedRect } from "../utils/pdfUtils.js";
import { formatDate } from "../utils/formatters.js";
import autoTable from "jspdf-autotable";

export async function exportMachines(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportMachinesCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportMachinesPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  const rows = (list || []).map(m => {
    const dataCriacao = m?.createdAt || null;
    
    return {
      nome: m.name || "-",
      serial: m.serial || "-",
      localizacao: m.location || "-",
      status: m.status || "-",
      dataCriacao: dataCriacao,
      rawStatus: m.status,
    };
  });

  // Ordenar por nome
  rows.sort((a, b) => {
    const nameA = (a.nome || "").toLowerCase();
    const nameB = (b.nome || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const stats = {
    total: rows.length,
    operacionais: rows.filter(r => {
      const s = String(r.rawStatus || "").toUpperCase();
      return s === "ACTIVE";
    }).length,
    manutencao: rows.filter(r => {
      const s = String(r.rawStatus || "").toUpperCase();
      return s === "MAINTENANCE" || s === "IN_MAINTENANCE";
    }).length,
    inativas: rows.filter(r => {
      const s = String(r.rawStatus || "").toUpperCase();
      return s === "INACTIVE" || s === "STOPPED";
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
    "RELATÓRIO DE MÁQUINAS E EQUIPAMENTOS",
    "",
    "RESUMO EXECUTIVO",
    `Total de Máquinas: ${stats.total}`,
    `Operacionais: ${stats.operacionais}`,
    `Em Manutenção: ${stats.manutencao}`,
    `Inativas: ${stats.inativas}`,
    `Localizações: ${stats.localizacoesUnicas}`,
    "",
    "DETALHES",
    "",
  ];

  const headers = ["Nome", "Número de Série", "Localização", "Status", "Data de Criação"];
  const csvRows = rows.map(r => [
    r.nome,
    r.serial,
    r.localizacao,
    formatStatus(r.rawStatus),
    r.dataCriacao ? formatDate(r.dataCriacao) : "-",
  ]);

  const csv = [
    ...summary,
    headers.join(";"),
    ...csvRows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
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
  const doc = createBasePDF("Relatório de Máquinas e Equipamentos");
  
  const primaryColor = [37, 99, 235];
  const successColor = [16, 185, 129];
  const warningColor = [245, 158, 11];
  const dangerColor = [239, 68, 68];
  const infoColor = [59, 130, 246];

  let startY = 120;

  // Título da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("Resumo Executivo", 40, startY);

  startY += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Boxes de estatísticas - 4 boxes em linha
  const boxWidth = 120;
  const boxHeight = 75;
  const boxX = 40;
  const boxY = startY;
  const boxSpacing = 10;

  // Box 1: Total
  doc.setFillColor(245, 247, 250);
  drawRoundedRect(doc, boxX, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(stats.total.toString(), boxX + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Total de", boxX + 10, boxY + 40);
  doc.text("Máquinas", boxX + 10, boxY + 50);

  // Box 2: Operacionais
  doc.setFillColor(236, 253, 245);
  drawRoundedRect(doc, boxX + boxWidth + boxSpacing, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.operacionais.toString(), boxX + boxWidth + boxSpacing + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Operacionais", boxX + boxWidth + boxSpacing + 10, boxY + 40);

  // Box 3: Em Manutenção
  doc.setFillColor(255, 251, 235);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 2, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...warningColor);
  doc.text(stats.manutencao.toString(), boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Em", boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 40);
  doc.text("Manutenção", boxX + (boxWidth + boxSpacing) * 2 + 10, boxY + 50);

  // Box 4: Inativas
  doc.setFillColor(254, 242, 242);
  drawRoundedRect(doc, boxX + (boxWidth + boxSpacing) * 3, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...dangerColor);
  doc.text(stats.inativas.toString(), boxX + (boxWidth + boxSpacing) * 3 + 10, boxY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Inativas", boxX + (boxWidth + boxSpacing) * 3 + 10, boxY + 40);

  // Informações adicionais
  startY += boxHeight + 25;
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
    r.localizacao || "-",
    formatStatus(r.rawStatus),
    r.dataCriacao ? formatDate(r.dataCriacao) : "-",
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["Nome", "Número de Série", "Localização", "Status", "Data Criação"]],
    body: tableRows,
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 5,
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 140 }, // Nome
      1: { cellWidth: 120 }, // Serial
      2: { cellWidth: 90 }, // Localização
      3: { cellWidth: 100, halign: "center" }, // Status
      4: { cellWidth: 105, halign: "center" }, // Data Criação
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  addFooter(doc);
  
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_maquinas_${dateStr}.pdf`);
}
