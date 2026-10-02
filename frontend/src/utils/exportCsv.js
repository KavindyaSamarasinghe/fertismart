// Neutralise spreadsheet formulas (=, +, -, @) in text cells
function escapeCell(value) {
  if (value === null || value === undefined) return "";
  let str = String(value);

  if (typeof value === "string" && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  if (/[",\r\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * columns: [{ header: "Name", value: (row) => row.name }, ...]
 * rows: array of objects
 */
export function downloadCsv(baseName, columns, rows) {
  const lines = [
    columns.map((c) => escapeCell(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(",")),
  ];

  // BOM so Excel reads UTF-8 correctly; CRLF line endings for compatibility
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fertismart-${baseName}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}