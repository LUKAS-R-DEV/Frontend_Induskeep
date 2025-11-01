import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";

export async function exportUsers(data, format = "pdf") {
  if (format === "csv") return exportUsersCSV(data);
  if (format === "pdf") return exportUsersPDF(data);
}

function exportUsersCSV(data) {
  const headers = ["Nome", "E-mail", "Função", "Ativo"];
  const rows = data.map(u => [u.name, u.email, u.role, u.isActive ? "Sim" : "Não"]);
  toCSV(headers, rows);
}

function exportUsersPDF(data) {
  const doc = createBasePDF("Relatório de Usuários e Técnicos");

  const rows = data.map(u => [u.name, u.email, u.role, u.isActive ? "Sim" : "Não"]);
  autoTable(doc, {
    startY: 120,
    head: [["Nome", "E-mail", "Função", "Ativo"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
  });

  addFooter(doc);
  doc.save(`relatorio_usuarios_${Date.now()}.pdf`);
}
