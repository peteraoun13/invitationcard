function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function makeFileName(baseName, extension) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${baseName}-${stamp}.${extension}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function rowsToCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
}

export async function parseGuestImportFile(file) {
  const XLSX = await import("xlsx");
  const extension = file.name.split(".").pop()?.toLowerCase();
  let workbook;

  if (extension === "csv") {
    const text = await file.text();
    workbook = XLSX.read(text, { type: "string" });
  } else if (extension === "xlsx") {
    const data = await file.arrayBuffer();
    workbook = XLSX.read(data, { type: "array" });
  } else {
    throw new Error("Please upload a .xlsx or .csv file.");
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rows.length < 2) {
    throw new Error("The file has no guest rows.");
  }

  const headers = rows[0].map(normalizeHeader);
  const familyIndex = headers.indexOf("family name");
  const guestIndex = headers.indexOf("guest name");

  if (familyIndex === -1 || guestIndex === -1) {
    throw new Error('The first row must include "Family Name" and "Guest Name".');
  }

  const groupedFamilies = new Map();
  const errors = [];

  rows.slice(1).forEach((row, index) => {
    const familyName = String(row[familyIndex] || "").trim();
    const guestName = String(row[guestIndex] || "").trim();
    const rowNumber = index + 2;

    if (!familyName && !guestName) {
      return;
    }

    if (!familyName || !guestName) {
      errors.push(`Row ${rowNumber}: missing family or guest name.`);
      return;
    }

    const familyKey = familyName.toLowerCase();
    const family = groupedFamilies.get(familyKey) || {
      id: `preview-${groupedFamilies.size + 1}`,
      familyName,
      guests: [],
    };

    family.guests.push(guestName);
    groupedFamilies.set(familyKey, family);
  });

  return {
    families: Array.from(groupedFamilies.values()),
    errors,
  };
}

export async function exportRows(rows, fileBaseName, format = "csv") {
  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
    XLSX.writeFile(workbook, makeFileName(fileBaseName, "xlsx"));
    return;
  }

  const csv = rowsToCsv(rows);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), makeFileName(fileBaseName, "csv"));
}
