import { createBasePDF, addFooter, drawRoundedRect } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";

export async function exportUsers(data, format = "pdf") {
  const normalized = normalizeData(data || []);
  if (format === "csv") return exportUsersCSV(normalized.rows, normalized.stats);
  if (format === "pdf") return exportUsersPDF(normalized.rows, normalized.stats);
}

function normalizeData(list) {
  const rows = (list || []).map(u => ({
    nome: u.name || "-",
    email: u.email || "-",
    funcao: formatRole(u.role),
    ativo: u.isActive !== false,
    rawRole: u.role,
  }));

  const stats = {
    total: rows.length,
    ativos: rows.filter(r => r.ativo).length,
    inativos: rows.filter(r => !r.ativo).length,
    admins: rows.filter(r => r.rawRole === "ADMIN").length,
    supervisores: rows.filter(r => r.rawRole === "SUPERVISOR").length,
    tecnicos: rows.filter(r => r.rawRole === "TECHNICIAN" || r.rawRole === "TECNICIAN").length,
  };

  return { rows, stats };
}

function formatRole(role) {
  const roleMap = {
    "ADMIN": "Administrador",
    "SUPERVISOR": "Supervisor",
    "TECHNICIAN": "Técnico",
    "TECNICIAN": "Técnico",
    "OPERATOR": "Operador",
  };
  return roleMap[role] || role || "-";
}

function exportUsersCSV(rows, stats) {
  const summary = [
    "RESUMO DO RELATÓRIO DE USUÁRIOS",
    `Total de Usuários: ${stats.total}`,
    `Ativos: ${stats.ativos}`,
    `Inativos: ${stats.inativos}`,
    `Administradores: ${stats.admins}`,
    `Supervisores: ${stats.supervisores}`,
    `Técnicos: ${stats.tecnicos}`,
    "",
  ];

  const headers = ["Nome", "E-mail", "Função", "Status"];
  const csvRows = rows.map(r => [
    r.nome,
    r.email,
    r.funcao,
    r.ativo ? "Ativo" : "Inativo",
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
  a.download = `relatorio_usuarios_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportUsersPDF(rows, stats) {
  const doc = createBasePDF("Relatório de Usuários e Técnicos");
  
  const primaryColor = [37, 99, 235];
  const successColor = [16, 185, 129];
  const dangerColor = [239, 68, 68];
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
  drawRoundedRect(doc, boxX, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(stats.total.toString(), boxX + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Total", boxX + 10, boxY + 30);

  // Box 2: Ativos
  doc.setFillColor(236, 253, 245);
  drawRoundedRect(doc, boxX + boxWidth + 10, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...successColor);
  doc.text(stats.ativos.toString(), boxX + boxWidth + 20, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Ativos", boxX + boxWidth + 20, boxY + 30);

  // Box 3: Inativos
  doc.setFillColor(254, 242, 242);
  drawRoundedRect(doc, boxX + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...dangerColor);
  doc.text(stats.inativos.toString(), boxX + (boxWidth + 10) * 2 + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Inativos", boxX + (boxWidth + 10) * 2 + 10, boxY + 30);

  // Box 4: Por Função
  doc.setFillColor(239, 246, 255);
  drawRoundedRect(doc, boxX + (boxWidth + 10) * 3, boxY, boxWidth, boxHeight, 3, true);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...infoColor);
  doc.text(`${stats.admins + stats.supervisores + stats.tecnicos}`, boxX + (boxWidth + 10) * 3 + 10, boxY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Com Função", boxX + (boxWidth + 10) * 3 + 10, boxY + 30);

  startY += boxHeight + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Admins: ${stats.admins} | Supervisores: ${stats.supervisores} | Técnicos: ${stats.tecnicos}`, 40, startY);

  startY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(40, startY, 550, startY);

  // Tabela principal
  startY += 20;

  const tableRows = rows.map(r => [
    r.nome,
    r.email,
    r.funcao,
    r.ativo ? "Ativo" : "Inativo",
  ]);

  autoTable(doc, {
    startY: startY,
    head: [["Nome", "E-mail", "Função", "Status"]],
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
      0: { cellWidth: 120 },
      1: { cellWidth: 150 },
      2: { cellWidth: 100 },
      3: { cellWidth: 80, halign: "center" },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { top: startY, left: 40, right: 40 },
  });

  addFooter(doc);
  
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio_usuarios_${dateStr}.pdf`);
}
