import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const releaseDir = path.join(repoRoot, "releases/groups/C/base/1.0.0-vi");
const workbookPath = path.join(releaseDir, "GROUP-C-SALES-CORE-1.0.0-vi.xlsx");
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));

const summary = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 10000 });
const dashboard = await workbook.inspect({ kind: "table", sheetId: "DASHBOARD", range: "A1:E21", include: "values,formulas", tableMaxRows: 25, tableMaxCols: 8, maxChars: 20000 });
const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan", maxChars: 20000 });

const expectedSheets = ["BẮT_ĐẦU", "DASHBOARD", "BÁO_GIÁ", "CHI_TIẾT_BÁO_GIÁ", "ĐƠN_HÀNG", "CHI_TIẾT_ĐƠN_HÀNG", "GIAO_HÀNG", "CHI_TIẾT_GIAO_HÀNG", "THANH_TOÁN", "KHÁCH_HÀNG", "SẢN_PHẨM", "NGƯỜI_DÙNG", "CẤU_HÌNH", "NHẬT_KÝ", "HƯỚNG_DẪN"];
const actualSheets = summary.ndjson.split("\n").filter(Boolean).map(line => JSON.parse(line).name);
assert.deepEqual(actualSheets, expectedSheets, "Sai danh sách hoặc thứ tự sheet");
const dashboardValues = workbook.worksheets.getItem("DASHBOARD").getRange("B5:B12").values.flat();
assert.equal(dashboardValues[0], 6, "Sai số báo giá");
assert.ok(Math.abs(dashboardValues[1] - 1 / 3) < 1e-9, "Sai tỷ lệ chuyển đổi");
assert.deepEqual(dashboardValues.slice(2, 5), [3700000, 1400000, 2300000], "Sai đối soát đơn hàng/thực thu/công nợ");
assert.equal(workbook.worksheets.getItem("CHI_TIẾT_BÁO_GIÁ").getRange("N2").values[0][0], 194400, "Sai oracle dòng báo giá");
assert.match(workbook.worksheets.getItem("ĐƠN_HÀNG").getRange("I250").formulas[0][0], /MAX\(0,G250-H250\)/, "Công thức công nợ chưa được fill tới dòng 250");
assert.match(formulaErrors.ndjson, /matched 0 entries/, "Workbook còn lỗi công thức");

await fs.writeFile(path.join(releaseDir, "inspect-sheets.ndjson"), summary.ndjson + "\n");
await fs.writeFile(path.join(releaseDir, "inspect-dashboard.ndjson"), dashboard.ndjson + "\n");
await fs.writeFile(path.join(releaseDir, "inspect-formula-errors.ndjson"), formulaErrors.ndjson + "\n");

console.log(summary.ndjson);
console.log(dashboard.ndjson);
console.log(formulaErrors.ndjson);
console.log(JSON.stringify({ verified: true, sheet_count: actualSheets.length, dashboard: dashboardValues }, null, 2));
