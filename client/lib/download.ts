export function downloadText(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCSV(
  name: string,
  head: string[],
  rows: (string | number)[][],
) {
  const cell = (v: string | number) =>
    '"' +
    String(
      typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v,
    ).replaceAll('"', '""') +
    '"';
  downloadText(
    name,
    "\ufeff" +
      [head, ...rows].map((row) => row.map(cell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
