import { createBasePDF, addFooter } from "../utils/pdfUtils.js";
import { toCSV } from "../utils/csvUtils.js";
import autoTable from "jspdf-autotable";

export async function exportMachines(data, format = "pdf") {
  if (format === "csv") return exportMachinesCSV(data);
  if (format === "pdf") return exportMachinesPDF(data);
}

function exportMachinesCSV(data) {
  const headers = ["Nome", "Serial", "Localização", "Status"];
  const rows = data.map(m => [m.name, m.serial, m.location, m.status]);
  toCSV(headers, rows);
}

function exportMachinesPDF(data) {
  const doc = createBasePDF("Relatório de Máquinas");

  const rows = data.map(m => [m.name, m.serial, m.location, m.status]);
  autoTable(doc, {
    startY: 120,
    head: [["Nome", "Serial", "Localização", "Status"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
  });

  addFooter(doc);
  doc.save(`relatorio_maquinas_${Date.now()}.pdf`);
}
