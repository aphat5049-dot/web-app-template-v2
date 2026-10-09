import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const baseDir = path.join(repoRoot, "groups/c-crm-sales/base");
const releaseDir = path.join(repoRoot, "releases/groups/C/base/1.0.0-vi");
const outputPath = path.join(releaseDir, "GROUP-C-SALES-CORE-1.0.0-vi.xlsx");

const fixture = JSON.parse(await fs.readFile(path.join(baseDir, "fixtures/demo.vi.json"), "utf8"));
const template = JSON.parse(await fs.readFile(path.join(baseDir, "template.json"), "utf8"));

const COLORS = {
  navy: "#17365D",
  blue: "#1F4E78",
  lightBlue: "#D9EAF7",
  input: "#FFF2CC",
  formula: "#E2F0D9",
  gray: "#E7E6E6",
  border: "#CBD5E1",
  text: "#1F2937",
  white: "#FFFFFF",
  red: "#FCE8E6",
  green: "#E6F4EA"
};

const SHEETS = [
  "BẮT_ĐẦU", "DASHBOARD", "BÁO_GIÁ", "CHI_TIẾT_BÁO_GIÁ", "ĐƠN_HÀNG",
  "CHI_TIẾT_ĐƠN_HÀNG", "GIAO_HÀNG", "CHI_TIẾT_GIAO_HÀNG", "THANH_TOÁN",
  "KHÁCH_HÀNG", "SẢN_PHẨM", "NGƯỜI_DÙNG", "CẤU_HÌNH", "NHẬT_KÝ", "HƯỚNG_DẪN"
];

const HEADERS = {
  "CẤU_HÌNH": ["Khóa cấu hình", "Giá trị", "Mô tả"],
  "NGƯỜI_DÙNG": ["Mã nhân viên", "Tên nhân viên", "Vai trò", "Email đăng nhập"],
  "KHÁCH_HÀNG": ["Mã khách hàng", "Tên khách hàng", "Nhóm khách hàng", "Khu vực", "Người phụ trách", "Trạng thái"],
  "SẢN_PHẨM": ["Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Đơn giá", "Giá vốn", "Thuế suất", "Trạng thái"],
  "BÁO_GIÁ": ["Mã báo giá revision", "Mã báo giá", "Revision", "Là revision mới nhất", "Mã khách hàng", "Ngày báo giá", "Hạn hiệu lực", "Trạng thái", "Tổng thanh toán", "Cảnh báo", "Người phụ trách", "Phiên bản dòng", "Người tạo", "Người duyệt", "Thời điểm duyệt", "Lý do từ chối", "Cập nhật lúc"],
  "CHI_TIẾT_BÁO_GIÁ": ["Mã dòng", "Mã báo giá revision", "Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Số lượng", "Đơn giá", "Tỷ lệ chiết khấu", "Thuế suất", "Thành tiền trước CK", "Tiền chiết khấu", "Giá trị sau CK", "Tiền VAT", "Tổng tiền dòng"],
  "ĐƠN_HÀNG": ["Mã đơn hàng", "Mã báo giá revision", "Mã khách hàng", "Ngày đặt", "Hạn thanh toán", "Kênh bán", "Tổng đơn hàng", "Thực thu", "Công nợ", "Cảnh báo", "Trạng thái", "Người phụ trách", "Phiên bản dòng", "Người tạo", "Cập nhật lúc"],
  "CHI_TIẾT_ĐƠN_HÀNG": ["Mã dòng", "Mã đơn hàng", "Mã sản phẩm", "Tên sản phẩm", "Đơn vị tính", "Số lượng", "Đơn giá", "Tổng tiền dòng", "Đã giao", "Còn phải giao", "Lợi nhuận gộp dự kiến"],
  "GIAO_HÀNG": ["Mã giao hàng", "Mã đơn hàng", "Ngày giao", "Đợt giao", "Trạng thái"],
  "CHI_TIẾT_GIAO_HÀNG": ["Mã dòng giao", "Mã giao hàng", "Mã dòng đơn hàng", "Số lượng giao", "Trạng thái"],
  "THANH_TOÁN": ["Mã thanh toán", "Mã đơn hàng", "Ngày thanh toán", "Số tiền", "Hình thức", "Trạng thái"],
  "NHẬT_KÝ": ["Mã bằng chứng", "Thời điểm", "Thao tác", "Thực thể", "Mã thực thể", "Chi tiết đã che"]
};

const USER_ROWS = [
  ["NV-001", "Nguyễn Minh An", "TRƯỞNG PHÒNG", "truong.phong@example.invalid"],
  ["NV-002", "Trần Hoài Phương", "SALES ADMIN", "sales.admin@example.invalid"],
  ["NV-003", "Lê Gia Hân", "KINH DOANH", "kinh.doanh.1@example.invalid"],
  ["NV-004", "Phạm Quốc Bảo", "KINH DOANH", "kinh.doanh.2@example.invalid"],
  ["NV-005", "Vũ Thu Hà", "KẾ TOÁN", "ke.toan@example.invalid"],
  ["NV-006", "Đỗ Hải Nam", "GIAO NHẬN", "giao.nhan@example.invalid"]
];

const CONFIG_ROWS = [
  ["THUE_SUAT_MAC_DINH", 0.08, "Thuế suất mặc định"],
  ["TIEN_TE", "VND", "Đơn vị tiền tệ"],
  ["SO_NGAY_HIEU_LUC", 15, "Số ngày hiệu lực báo giá"],
  ["TACH_VAI_TRO_DUYET", true, "Không cho người tạo tự duyệt báo giá"]
];

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}

function colLetter(number) {
  let out = "";
  for (let n = number; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
  return out;
}

function styleTable(sheet, columnCount, widths = {}) {
  const end = colLetter(columnCount);
  sheet.freezePanes.freezeRows(1);
  sheet.getRange(`A1:${end}1`).format = {
    fill: COLORS.blue,
    font: { bold: true, color: COLORS.white, name: "Arial", size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "middle",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: COLORS.border },
    rowHeightPx: 36
  };
  sheet.getRange(`A2:${end}500`).format = {
    font: { color: COLORS.text, name: "Arial", size: 10 },
    verticalAlignment: "middle",
    borders: { preset: "all", style: "thin", color: "#E5E7EB" }
  };
  for (let c = 1; c <= columnCount; c++) sheet.getRange(`${colLetter(c)}:${colLetter(c)}`).format.columnWidthPx = widths[c] || 120;
}

function writeHeaders(workbook) {
  for (const [name, headers] of Object.entries(HEADERS)) {
    const sheet = workbook.worksheets.getItem(name);
    sheet.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
    styleTable(sheet, headers.length);
  }
}

function setList(sheet, range, values) {
  sheet.getRange(range).dataValidation = { rule: { type: "list", values } };
}

const workbook = Workbook.create();
workbook.colorScheme = {
  name: "GSheet Product Factory",
  themeColors: {
    dk1: COLORS.text, lt1: COLORS.white, dk2: COLORS.navy, lt2: "#F8FAFC",
    accent1: COLORS.blue, accent2: "#2E75B6", accent3: "#70AD47",
    accent4: "#FFC000", accent5: "#5B9BD5", accent6: "#A5A5A5",
    hlink: "#0563C1", folHlink: "#954F72"
  }
};
for (const name of SHEETS) workbook.worksheets.add(name);
writeHeaders(workbook);

// BẮT_ĐẦU
{
  const sheet = workbook.worksheets.getItem("BẮT_ĐẦU");
  sheet.showGridLines = false;
  sheet.getRange("A1:H2").merge();
  sheet.getRange("A1").values = [["TEMPLATE GỐC NHÓM C — CRM & BÁN HÀNG"]];
  sheet.getRange("A1:H2").format = { fill: COLORS.navy, font: { bold: true, color: COLORS.white, size: 20, name: "Arial" }, horizontalAlignment: "center", verticalAlignment: "middle" };
  sheet.getRange("A4:B12").values = [
    ["Template", "GROUP-C-SALES-CORE"], ["Phiên bản", template.version], ["Sản phẩm pilot", "GS-007 — Quản lý Báo giá"],
    ["Mức xác minh", "G1_LOCAL"], ["Google Sheets runtime", "Chưa chạy — cần kết nối Google Drive"],
    ["Dữ liệu hiện tại", "DEMO mô phỏng, không chứa PII thật"], ["Chế độ bàn giao", "Cài cấu trúc Sạch bằng Apps Script"],
    ["Luồng nghiệp vụ", "Báo giá → phê duyệt → đơn hàng → giao hàng → thanh toán"],
    ["Bước tiếp theo", "Import file, gắn installer.gs, chạy kiemTraHeThongBaoGiaDonHang()"]
  ];
  sheet.getRange("A4:A12").format = { fill: COLORS.lightBlue, font: { bold: true, color: COLORS.navy, name: "Arial" }, borders: { preset: "all", style: "thin", color: COLORS.border } };
  sheet.getRange("B4:B12").format = { fill: COLORS.white, font: { color: COLORS.text, name: "Arial" }, wrapText: true, borders: { preset: "all", style: "thin", color: COLORS.border } };
  sheet.getRange("A14:H16").merge();
  sheet.getRange("A14").values = [["Lưu ý phát hành: file này là bản đã kiểm thử cục bộ. Chỉ bật nút tải trên website sau khi có Spreadsheet ID thật, URL template/copy thật và evidence G2."]];
  sheet.getRange("A14:H16").format = { fill: COLORS.input, font: { bold: true, color: "#7F6000", name: "Arial" }, wrapText: true, verticalAlignment: "middle" };
  sheet.getRange("A:A").format.columnWidthPx = 190;
  sheet.getRange("B:B").format.columnWidthPx = 560;
}

// HƯỚNG_DẪN
{
  const sheet = workbook.worksheets.getItem("HƯỚNG_DẪN");
  sheet.showGridLines = false;
  sheet.getRange("A1:F2").merge();
  sheet.getRange("A1").values = [["HƯỚNG DẪN VẬN HÀNH"]];
  sheet.getRange("A1:F2").format = { fill: COLORS.blue, font: { bold: true, color: COLORS.white, size: 18, name: "Arial" }, horizontalAlignment: "center", verticalAlignment: "middle" };
  sheet.getRange("A4:B11").values = [
    ["1. Cấu hình", "Cập nhật CẤU_HÌNH và NGƯỜI_DÙNG trước khi dùng dữ liệu thật."],
    ["2. Danh mục", "Nhập KHÁCH_HÀNG và SẢN_PHẨM. Không sửa cột xanh lá vì đó là cột công thức."],
    ["3. Báo giá", "Tạo báo giá ở trạng thái NHÁP, thêm dòng chi tiết rồi gửi phê duyệt bằng menu Apps Script."],
    ["4. Revision", "Báo giá đã vào workflow là bất biến. Thay đổi thương mại phải tạo revision mới."],
    ["5. Đơn hàng", "Chỉ revision mới nhất ở trạng thái CHẤP NHẬN được chuyển thành đơn, thao tác idempotent."],
    ["6. Giao hàng", "Theo dõi nhiều đợt, không cho tổng giao vượt số lượng đặt."],
    ["7. Thanh toán", "Chỉ khoản ĐÃ XÁC NHẬN làm giảm công nợ."],
    ["8. Phát hành", "Chỉ xuất bản storefront khi registry có Spreadsheet ID, URL thật và evidence G2."]
  ];
  sheet.getRange("A4:A11").format = { fill: COLORS.lightBlue, font: { bold: true, color: COLORS.navy, name: "Arial" }, borders: { preset: "all", style: "thin", color: COLORS.border } };
  sheet.getRange("B4:B11").format = { font: { color: COLORS.text, name: "Arial" }, wrapText: true, borders: { preset: "all", style: "thin", color: COLORS.border } };
  sheet.getRange("A:A").format.columnWidthPx = 160;
  sheet.getRange("B:B").format.columnWidthPx = 720;
}

// Master data
workbook.worksheets.getItem("CẤU_HÌNH").getRange("A2:C5").values = CONFIG_ROWS;
workbook.worksheets.getItem("NGƯỜI_DÙNG").getRange("A2:D7").values = USER_ROWS;
workbook.worksheets.getItem("KHÁCH_HÀNG").getRange("A2:F7").values = fixture.KHACH_HANG.map(r => [r.MA_KHACH_HANG, r.TEN_KHACH_HANG, r.NHOM_KHACH_HANG, r.KHU_VUC, r.NGUOI_PHU_TRACH, r.TRANG_THAI]);
workbook.worksheets.getItem("SẢN_PHẨM").getRange("A2:G9").values = fixture.SAN_PHAM.map(r => [r.MA_SAN_PHAM, r.TEN_SAN_PHAM, r.DON_VI_TINH, r.DON_GIA, r.GIA_VON, r.THUE_SUAT, r.TRANG_THAI]);

// Quotations
{
  const q = workbook.worksheets.getItem("BÁO_GIÁ");
  const rows = fixture.BAO_GIA.map(r => [r.MA_BAO_GIA_REVISION, r.MA_BAO_GIA, r.REVISION, r.LA_REVISION_MOI_NHAT, r.MA_KHACH_HANG, asDate(r.NGAY_BAO_GIA), asDate(r.HAN_HIEU_LUC), r.TRANG_THAI, null, null, r.NGUOI_PHU_TRACH, r.PHIEN_BAN_DONG, r.NGUOI_TAO, r.NGUOI_DUYET, asDate(r.THOI_DIEM_DUYET), r.LY_DO_TU_CHOI, asDate(r.NGAY_CAP_NHAT)]);
  q.getRangeByIndexes(1, 0, rows.length, 17).values = rows;
  q.getRange("I2").formulas = [["=IF(A2=\"\",\"\",SUMIFS('CHI_TIẾT_BÁO_GIÁ'!$N$2:$N$500,'CHI_TIẾT_BÁO_GIÁ'!$B$2:$B$500,A2))"]];
  q.getRange("I2:I500").fillDown();
  q.getRange("J2").formulas = [["=IF(A2=\"\",\"\",IF(AND(H2=\"ĐÃ GỬI\",G2<TODAY()),\"HẾT HẠN\",\"\"))"]];
  q.getRange("J2:J500").fillDown();
  q.getRange("F2:G500").format.numberFormat = "dd/mm/yyyy";
  q.getRange("O2:O500").format.numberFormat = "dd/mm/yyyy hh:mm";
  q.getRange("Q2:Q500").format.numberFormat = "dd/mm/yyyy hh:mm";
  q.getRange("I2:I500").format.numberFormat = "#,##0 \"₫\"";
  q.getRange("I2:J500").format.fill = COLORS.formula;
  setList(q, "H2:H500", ["NHÁP", "CHỜ DUYỆT", "ĐÃ DUYỆT", "ĐÃ GỬI", "CHẤP NHẬN", "TỪ CHỐI", "HẾT HẠN"]);
}

{
  const ql = workbook.worksheets.getItem("CHI_TIẾT_BÁO_GIÁ");
  const rows = fixture.CHI_TIET_BAO_GIA.map(r => [r.MA_DONG_BAO_GIA, r.MA_BAO_GIA_REVISION, r.MA_SAN_PHAM, null, null, r.SO_LUONG, r.DON_GIA, r.TY_LE_CHIET_KHAU, null, null, null, null, null, null]);
  ql.getRangeByIndexes(1, 0, rows.length, 14).values = rows;
  const formulas = {
    D: "=IF(C2=\"\",\"\",IFERROR(VLOOKUP(C2,'SẢN_PHẨM'!$A$2:$G$500,2,FALSE),\"\"))",
    E: "=IF(C2=\"\",\"\",IFERROR(VLOOKUP(C2,'SẢN_PHẨM'!$A$2:$G$500,3,FALSE),\"\"))",
    I: "=IF(C2=\"\",\"\",IFERROR(VLOOKUP(C2,'SẢN_PHẨM'!$A$2:$G$500,6,FALSE),\"\"))",
    J: "=IF(OR(F2=\"\",G2=\"\"),\"\",F2*G2)", K: "=IF(J2=\"\",\"\",J2*H2)",
    L: "=IF(J2=\"\",\"\",J2-K2)", M: "=IF(L2=\"\",\"\",L2*I2)", N: "=IF(L2=\"\",\"\",L2+M2)"
  };
  for (const [col, formula] of Object.entries(formulas)) { ql.getRange(`${col}2`).formulas = [[formula]]; ql.getRange(`${col}2:${col}500`).fillDown(); ql.getRange(`${col}2:${col}500`).format.fill = COLORS.formula; }
  ql.getRange(`G${rows.length + 2}`).formulas = [[`=IF(C${rows.length + 2}=\"\",\"\",IFERROR(VLOOKUP(C${rows.length + 2},'SẢN_PHẨM'!$A$2:$G$500,4,FALSE),\"\"))`]];
  ql.getRange(`G${rows.length + 2}:G500`).fillDown();
  ql.getRange("G2:G500").format.numberFormat = "#,##0 \"₫\"";
  ql.getRange("H2:I500").format.numberFormat = "0.00%";
  ql.getRange("J2:N500").format.numberFormat = "#,##0 \"₫\"";
  ql.getRange("H2:H500").dataValidation = { rule: { type: "decimal", operator: "between", formula1: 0, formula2: 1 } };
}

// Orders, deliveries, payments
{
  const o = workbook.worksheets.getItem("ĐƠN_HÀNG");
  const rows = fixture.DON_HANG.map(r => [r.MA_DON_HANG, r.MA_BAO_GIA_REVISION, r.MA_KHACH_HANG, asDate(r.NGAY_DAT), asDate(r.HAN_THANH_TOAN), r.KENH_BAN, null, null, null, null, r.TRANG_THAI, r.NGUOI_PHU_TRACH, r.PHIEN_BAN_DONG, r.NGUOI_TAO, asDate(r.NGAY_CAP_NHAT)]);
  o.getRangeByIndexes(1, 0, rows.length, 15).values = rows;
  const formulas = {
    G: "=IF(A2=\"\",\"\",SUMIFS('CHI_TIẾT_ĐƠN_HÀNG'!$H$2:$H$500,'CHI_TIẾT_ĐƠN_HÀNG'!$B$2:$B$500,A2))",
    H: "=IF(A2=\"\",\"\",SUMIFS('THANH_TOÁN'!$D$2:$D$500,'THANH_TOÁN'!$B$2:$B$500,A2,'THANH_TOÁN'!$F$2:$F$500,\"ĐÃ XÁC NHẬN\"))",
    I: "=IF(A2=\"\",\"\",MAX(0,G2-H2))",
    J: "=IF(A2=\"\",\"\",IF(AND(E2<TODAY(),I2>0,K2<>\"HỦY\"),\"QUÁ HẠN\",\"\"))"
  };
  for (const [col, formula] of Object.entries(formulas)) { o.getRange(`${col}2`).formulas = [[formula]]; o.getRange(`${col}2:${col}500`).fillDown(); o.getRange(`${col}2:${col}500`).format.fill = COLORS.formula; }
  o.getRange("D2:E500").format.numberFormat = "dd/mm/yyyy";
  o.getRange("O2:O500").format.numberFormat = "dd/mm/yyyy hh:mm";
  o.getRange("G2:I500").format.numberFormat = "#,##0 \"₫\"";
  setList(o, "F2:F500", ["TRỰC TIẾP", "ĐIỆN THOẠI", "WEBSITE", "ĐỐI TÁC"]);
  setList(o, "K2:K500", ["MỚI", "XÁC NHẬN", "ĐANG GIAO", "GIAO MỘT PHẦN", "HOÀN TẤT", "HỦY"]);
}

{
  const ol = workbook.worksheets.getItem("CHI_TIẾT_ĐƠN_HÀNG");
  const rows = fixture.CHI_TIET_DON_HANG.map(r => [r.MA_DONG_DON_HANG, r.MA_DON_HANG, r.MA_SAN_PHAM, null, null, r.SO_LUONG, r.DON_GIA, null, null, null, null]);
  ol.getRangeByIndexes(1, 0, rows.length, 11).values = rows;
  const formulas = {
    D: "=IF(C2=\"\",\"\",IFERROR(VLOOKUP(C2,'SẢN_PHẨM'!$A$2:$G$500,2,FALSE),\"\"))",
    E: "=IF(C2=\"\",\"\",IFERROR(VLOOKUP(C2,'SẢN_PHẨM'!$A$2:$G$500,3,FALSE),\"\"))",
    H: "=IF(OR(F2=\"\",G2=\"\"),\"\",F2*G2)",
    I: "=IF(A2=\"\",\"\",SUMIFS('CHI_TIẾT_GIAO_HÀNG'!$D$2:$D$500,'CHI_TIẾT_GIAO_HÀNG'!$C$2:$C$500,A2,'CHI_TIẾT_GIAO_HÀNG'!$E$2:$E$500,\"ĐÃ GIAO\"))",
    J: "=IF(A2=\"\",\"\",MAX(0,F2-I2))",
    K: "=IF(A2=\"\",\"\",H2-(F2*IFERROR(VLOOKUP(C2,'SẢN_PHẨM'!$A$2:$G$500,5,FALSE),0)))"
  };
  for (const [col, formula] of Object.entries(formulas)) { ol.getRange(`${col}2`).formulas = [[formula]]; ol.getRange(`${col}2:${col}500`).fillDown(); ol.getRange(`${col}2:${col}500`).format.fill = COLORS.formula; }
  ol.getRange("G2:H500").format.numberFormat = "#,##0 \"₫\"";
  ol.getRange("K2:K500").format.numberFormat = "#,##0 \"₫\"";
}

workbook.worksheets.getItem("GIAO_HÀNG").getRangeByIndexes(1, 0, fixture.GIAO_HANG.length, 5).values = fixture.GIAO_HANG.map(r => [r.MA_GIAO_HANG, r.MA_DON_HANG, asDate(r.NGAY_GIAO), r.DOT_GIAO, r.TRANG_THAI]);
workbook.worksheets.getItem("CHI_TIẾT_GIAO_HÀNG").getRangeByIndexes(1, 0, fixture.CHI_TIET_GIAO_HANG.length, 5).values = fixture.CHI_TIET_GIAO_HANG.map(r => [r.MA_DONG_GIAO_HANG, r.MA_GIAO_HANG, r.MA_DONG_DON_HANG, r.SO_LUONG_GIAO, r.TRANG_THAI]);
workbook.worksheets.getItem("THANH_TOÁN").getRangeByIndexes(1, 0, fixture.THANH_TOAN.length, 6).values = fixture.THANH_TOAN.map(r => [r.MA_THANH_TOAN, r.MA_DON_HANG, asDate(r.NGAY_THANH_TOAN), r.SO_TIEN, r.HINH_THUC, r.TRANG_THAI]);
workbook.worksheets.getItem("GIAO_HÀNG").getRange("C2:C500").format.numberFormat = "dd/mm/yyyy";
workbook.worksheets.getItem("THANH_TOÁN").getRange("C2:C500").format.numberFormat = "dd/mm/yyyy";
workbook.worksheets.getItem("THANH_TOÁN").getRange("D2:D500").format.numberFormat = "#,##0 \"₫\"";
setList(workbook.worksheets.getItem("GIAO_HÀNG"), "E2:E500", ["CHỜ GIAO", "ĐANG GIAO", "ĐÃ GIAO", "HỦY"]);
setList(workbook.worksheets.getItem("CHI_TIẾT_GIAO_HÀNG"), "E2:E500", ["ĐÃ GIAO", "HỦY DÒNG"]);
setList(workbook.worksheets.getItem("THANH_TOÁN"), "F2:F500", ["CHỜ XÁC NHẬN", "ĐÃ XÁC NHẬN", "HỦY"]);

// Editable vs calculated color convention.
for (const [sheetName, ranges] of Object.entries({
  "BÁO_GIÁ": ["A2:H500", "K2:Q500"], "CHI_TIẾT_BÁO_GIÁ": ["A2:C500", "F2:F500", "H2:H500"],
  "ĐƠN_HÀNG": ["A2:F500", "K2:O500"], "CHI_TIẾT_ĐƠN_HÀNG": ["A2:C500", "F2:G500"],
  "GIAO_HÀNG": ["A2:E500"], "CHI_TIẾT_GIAO_HÀNG": ["A2:E500"], "THANH_TOÁN": ["A2:F500"],
  "KHÁCH_HÀNG": ["A2:F500"], "SẢN_PHẨM": ["A2:G500"], "NGƯỜI_DÙNG": ["A2:D500"], "CẤU_HÌNH": ["A2:C500"]
})) for (const range of ranges) workbook.worksheets.getItem(sheetName).getRange(range).format.fill = COLORS.input;

workbook.worksheets.getItem("SẢN_PHẨM").getRange("D2:E500").format.numberFormat = "#,##0 \"₫\"";
workbook.worksheets.getItem("SẢN_PHẨM").getRange("F2:F500").format.numberFormat = "0.00%";
workbook.worksheets.getItem("CẤU_HÌNH").getRange("B2").format.numberFormat = "0.00%";
setList(workbook.worksheets.getItem("NGƯỜI_DÙNG"), "C2:C500", ["TRƯỞNG PHÒNG", "SALES ADMIN", "KINH DOANH", "KẾ TOÁN", "GIAO NHẬN"]);

// Dashboard
{
  const sheet = workbook.worksheets.getItem("DASHBOARD");
  sheet.showGridLines = false;
  sheet.getRange("A1:H2").merge();
  sheet.getRange("A1").values = [["TỔNG QUAN BÁN HÀNG"]];
  sheet.getRange("A1:H2").format = { fill: COLORS.navy, font: { bold: true, color: COLORS.white, size: 20, name: "Arial" }, horizontalAlignment: "center", verticalAlignment: "middle" };
  sheet.getRange("A4:C4").values = [["Chỉ số", "Giá trị", "Định nghĩa"]];
  sheet.getRange("A4:C4").format = { fill: COLORS.blue, font: { bold: true, color: COLORS.white, name: "Arial" }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: COLORS.border } };
  sheet.getRange("A5:A12").values = [["Số báo giá"], ["Tỷ lệ chuyển đổi"], ["Giá trị đơn không hủy"], ["Thực thu xác nhận"], ["Công nợ"], ["Đơn quá hạn"], ["Dòng giao thiếu"], ["Lợi nhuận gộp dự kiến"]];
  sheet.getRange("B5:B12").formulas = [
    ["=COUNTA('BÁO_GIÁ'!$A$2:$A$500)"],
    ["=IFERROR(COUNTIF('BÁO_GIÁ'!$H$2:$H$500,\"CHẤP NHẬN\")/(COUNTIF('BÁO_GIÁ'!$H$2:$H$500,\"CHẤP NHẬN\")+COUNTIF('BÁO_GIÁ'!$H$2:$H$500,\"TỪ CHỐI\")+COUNTIF('BÁO_GIÁ'!$H$2:$H$500,\"HẾT HẠN\")),0)"],
    ["=SUMIFS('ĐƠN_HÀNG'!$G$2:$G$500,'ĐƠN_HÀNG'!$K$2:$K$500,\"<>HỦY\")"],
    ["=SUMIFS('THANH_TOÁN'!$D$2:$D$500,'THANH_TOÁN'!$F$2:$F$500,\"ĐÃ XÁC NHẬN\")"],
    ["=SUMIFS('ĐƠN_HÀNG'!$I$2:$I$500,'ĐƠN_HÀNG'!$K$2:$K$500,\"<>HỦY\")"],
    ["=COUNTIF('ĐƠN_HÀNG'!$J$2:$J$500,\"QUÁ HẠN\")"],
    ["=COUNTIF('CHI_TIẾT_ĐƠN_HÀNG'!$J$2:$J$500,\">0\")"],
    ["=SUM('CHI_TIẾT_ĐƠN_HÀNG'!$K$2:$K$500)"]
  ];
  sheet.getRange("C5:C12").values = [["Tổng số revision báo giá"], ["Chấp nhận / (chấp nhận + từ chối + hết hạn)"], ["Tổng đơn hàng trừ đơn hủy"], ["Chỉ khoản đã xác nhận"], ["Giá trị đơn chưa thu"], ["Quá hạn và còn công nợ"], ["Dòng đơn còn phải giao"], ["Doanh thu dòng trừ giá vốn"]];
  sheet.getRange("A5:C12").format = { font: { name: "Arial", color: COLORS.text }, borders: { preset: "all", style: "thin", color: COLORS.border }, wrapText: true };
  sheet.getRange("B5:B12").format.fill = COLORS.formula;
  sheet.getRange("B6").format.numberFormat = "0.0%";
  sheet.getRange("B7:B9").format.numberFormat = "#,##0 \"₫\"";
  sheet.getRange("B12").format.numberFormat = "#,##0 \"₫\"";

  sheet.getRange("A15:B21").values = [["Trạng thái đơn", "Số lượng"], ["MỚI", null], ["XÁC NHẬN", null], ["ĐANG GIAO", null], ["GIAO MỘT PHẦN", null], ["HOÀN TẤT", null], ["HỦY", null]];
  for (let row = 16; row <= 21; row++) sheet.getRange(`B${row}`).formulas = [[`=COUNTIF('ĐƠN_HÀNG'!$K$2:$K$500,A${row})`]];
  sheet.getRange("A15:B15").format = { fill: COLORS.blue, font: { bold: true, color: COLORS.white, name: "Arial" } };
  sheet.getRange("A15:B21").format.borders = { preset: "all", style: "thin", color: COLORS.border };

  sheet.getRange("D15:E19").values = [["Kênh bán", "Doanh số"], ["TRỰC TIẾP", null], ["ĐIỆN THOẠI", null], ["WEBSITE", null], ["ĐỐI TÁC", null]];
  for (let row = 16; row <= 19; row++) sheet.getRange(`E${row}`).formulas = [[`=SUMIFS('ĐƠN_HÀNG'!$G$2:$G$500,'ĐƠN_HÀNG'!$F$2:$F$500,D${row},'ĐƠN_HÀNG'!$K$2:$K$500,\"<>HỦY\")`]];
  sheet.getRange("D15:E15").format = { fill: COLORS.blue, font: { bold: true, color: COLORS.white, name: "Arial" } };
  sheet.getRange("D15:E19").format.borders = { preset: "all", style: "thin", color: COLORS.border };
  sheet.getRange("E16:E19").format.numberFormat = "#,##0 \"₫\"";

  const statusChart = sheet.charts.add("pie", sheet.getRange("A15:B21"));
  statusChart.title = "Cơ cấu trạng thái đơn";
  statusChart.setPosition("G4", "N16");
  const channelChart = sheet.charts.add("bar", sheet.getRange("D15:E19"));
  channelChart.title = "Doanh số theo kênh";
  channelChart.setPosition("G18", "N31");
  sheet.freezePanes.freezeRows(4);
  sheet.getRange("A:A").format.columnWidthPx = 220;
  sheet.getRange("B:B").format.columnWidthPx = 150;
  sheet.getRange("C:C").format.columnWidthPx = 360;
  sheet.getRange("D:D").format.columnWidthPx = 150;
  sheet.getRange("E:E").format.columnWidthPx = 140;
}

// Final sizing for frequently used tables.
for (const name of Object.keys(HEADERS)) {
  const sheet = workbook.worksheets.getItem(name);
  sheet.getRange("A1:Z500").format.verticalAlignment = "middle";
}
workbook.worksheets.getItem("KHÁCH_HÀNG").getRange("B:B").format.columnWidthPx = 230;
workbook.worksheets.getItem("SẢN_PHẨM").getRange("B:B").format.columnWidthPx = 260;
workbook.worksheets.getItem("NGƯỜI_DÙNG").getRange("B:B").format.columnWidthPx = 210;
workbook.worksheets.getItem("NGƯỜI_DÙNG").getRange("D:D").format.columnWidthPx = 260;
workbook.worksheets.getItem("CẤU_HÌNH").getRange("A:A").format.columnWidthPx = 230;
workbook.worksheets.getItem("CẤU_HÌNH").getRange("C:C").format.columnWidthPx = 360;
workbook.worksheets.getItem("BÁO_GIÁ").getRange("A:Q").format.columnWidthPx = 130;
workbook.worksheets.getItem("CHI_TIẾT_BÁO_GIÁ").getRange("A:N").format.columnWidthPx = 130;
workbook.worksheets.getItem("ĐƠN_HÀNG").getRange("A:O").format.columnWidthPx = 130;

await fs.mkdir(releaseDir, { recursive: true });
workbook.recalculate();

const checks = {};
for (const sheetName of SHEETS) {
  const sheet = workbook.worksheets.getItem(sheetName);
  const range = sheetName === "DASHBOARD" ? "A1:N31" : (sheetName === "BẮT_ĐẦU" ? "A1:H16" : (sheetName === "HƯỚNG_DẪN" ? "A1:F12" : "A1:Q15"));
  const blob = await workbook.render({ sheetName, range, scale: 1 });
  const previewPath = path.join(releaseDir, `preview-${sheetName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/[^A-Za-z0-9_]/g, "_")}.png`);
  await fs.writeFile(previewPath, new Uint8Array(await blob.arrayBuffer()));
  checks[sheetName] = path.basename(previewPath);
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
const bytes = await fs.readFile(outputPath);
const manifest = {
  asset_id: "GROUP-C-SALES-CORE@1.0.0-vi",
  product_id: "GS-007",
  generated_at: new Date().toISOString(),
  gate: "G1_LOCAL",
  publishable: false,
  blocker: "Chưa chạy installer trên Google Sheets thật; chưa có Spreadsheet ID/template URL/copy URL.",
  workbook: path.basename(outputPath),
  sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  fixture_business_records: fixture.meta.business_record_count,
  sheets: SHEETS,
  previews: checks
};
await fs.writeFile(path.join(releaseDir, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(JSON.stringify({ outputPath, manifest }, null, 2));
