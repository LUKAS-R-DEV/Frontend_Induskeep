export function toCSV(headers, rows) {
  const csv = [
    headers.join(";"),
    ...rows.map(r => r.map(v => `"${v ?? ""}"`).join(";"))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
