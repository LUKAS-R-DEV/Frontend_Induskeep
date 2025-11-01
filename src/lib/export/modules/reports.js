import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import { formatDate, formatStatus } from "../utils/formatters.js";
import autoTable from "jspdf-autotable";

export async function exportReports(data, format = "pdf") {
  const rows = normalizeRows(data || []);
  if (format === "csv") return exportReportsCSV(rows);
  if (format === "pdf") return exportReportsPDF(rows);
}

function normalizeRows(list) {
  return (list || []).map((r) => {
    // history shape: { completedAt, notes, order:{ title,status, user:{name}, machine:{name} } }
    // order shape: { title,status, createdAt, history:{ completedAt, notes }, user:{name}, machine:{name} }
    const order = r.order || r;
    const machineName = order?.machine?.name || "-";
    const userName = order?.user?.name || "-";
    const title = order?.title || "-";
    const status = order?.status || "-";
    const notes = r?.notes || order?.history?.notes || order?.description || "-";
    const completedAt = r?.completedAt || order?.history?.completedAt || null;
    return [
      formatDate(completedAt),
      machineName,
      userName,
      title,
      formatStatus(status),
      notes,
    ];
  });
}

function exportReportsCSV(rows) {
  const headers = ["Data", "Máquina", "Técnico", "Título", "Status", "Notas"];
  toCSV(headers, rows);
}

function exportReportsPDF(rows) {
  const doc = createBasePDF("Relatório de Manutenções");

  autoTable(doc, {
    startY: 120,
    head: [["Data", "Máquina", "Técnico", "Título", "Status", "Notas"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: "center" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  addFooter(doc);
  doc.save(`relatorio_manutencoes_${Date.now()}.pdf`);
}
