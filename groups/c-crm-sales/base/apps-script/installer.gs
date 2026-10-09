/**
 * KD_BAO_GIA_DON_HANG 3.0.0-vi
 * Bộ cài gắn với Google Sheets. Không gửi email, không publish Web App,
 * không cấu hình AppSheet và không dùng OAuth ngoài quyền của bảng tính.
 */

const KD_VERSION = '3.0.0-vi';
const KD_MAX_ROWS = 500;
const KD_TABS = [
  'BẮT_ĐẦU', 'HƯỚNG_DẪN', 'CẤU_HÌNH', 'NGƯỜI_DÙNG', 'KHÁCH_HÀNG', 'SẢN_PHẨM',
  'BÁO_GIÁ', 'CHI_TIẾT_BÁO_GIÁ', 'ĐƠN_HÀNG', 'CHI_TIẾT_ĐƠN_HÀNG',
  'GIAO_HÀNG', 'CHI_TIẾT_GIAO_HÀNG', 'THANH_TOÁN', 'NHẬT_KÝ', 'DASHBOARD'
];

const KD_HEADERS = {
  'CẤU_HÌNH': ['Khóa cấu hình', 'Giá trị', 'Mô tả'],
  'NGƯỜI_DÙNG': ['Mã nhân viên', 'Tên nhân viên', 'Vai trò', 'Email đăng nhập'],
  'KHÁCH_HÀNG': ['Mã khách hàng', 'Tên khách hàng', 'Nhóm khách hàng', 'Khu vực', 'Người phụ trách', 'Trạng thái'],
  'SẢN_PHẨM': ['Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Đơn giá', 'Giá vốn', 'Thuế suất', 'Trạng thái'],
  'BÁO_GIÁ': ['Mã báo giá revision', 'Mã báo giá', 'Revision', 'Là revision mới nhất', 'Mã khách hàng', 'Ngày báo giá', 'Hạn hiệu lực', 'Trạng thái', 'Tổng thanh toán', 'Cảnh báo', 'Người phụ trách', 'Phiên bản dòng', 'Người tạo', 'Người duyệt', 'Thời điểm duyệt', 'Lý do từ chối', 'Cập nhật lúc'],
  'CHI_TIẾT_BÁO_GIÁ': ['Mã dòng', 'Mã báo giá revision', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Tỷ lệ chiết khấu', 'Thuế suất', 'Thành tiền trước CK', 'Tiền chiết khấu', 'Giá trị sau CK', 'Tiền VAT', 'Tổng tiền dòng'],
  'ĐƠN_HÀNG': ['Mã đơn hàng', 'Mã báo giá revision', 'Mã khách hàng', 'Ngày đặt', 'Hạn thanh toán', 'Kênh bán', 'Tổng đơn hàng', 'Thực thu', 'Công nợ', 'Cảnh báo', 'Trạng thái', 'Người phụ trách', 'Phiên bản dòng', 'Người tạo', 'Cập nhật lúc'],
  'CHI_TIẾT_ĐƠN_HÀNG': ['Mã dòng', 'Mã đơn hàng', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Tổng tiền dòng', 'Đã giao', 'Còn phải giao', 'Lợi nhuận gộp dự kiến'],
  'GIAO_HÀNG': ['Mã giao hàng', 'Mã đơn hàng', 'Ngày giao', 'Đợt giao', 'Trạng thái'],
  'CHI_TIẾT_GIAO_HÀNG': ['Mã dòng giao', 'Mã giao hàng', 'Mã dòng đơn hàng', 'Số lượng giao', 'Trạng thái'],
  'THANH_TOÁN': ['Mã thanh toán', 'Mã đơn hàng', 'Ngày thanh toán', 'Số tiền', 'Hình thức', 'Trạng thái'],
  'NHẬT_KÝ': ['Mã bằng chứng', 'Thời điểm', 'Thao tác', 'Thực thể', 'Mã thực thể', 'Chi tiết đã che']
};

const KD_QUOTE_STATUS = ['NHÁP', 'CHỜ DUYỆT', 'ĐÃ DUYỆT', 'ĐÃ GỬI', 'CHẤP NHẬN', 'TỪ CHỐI', 'HẾT HẠN'];
const KD_ORDER_STATUS = ['MỚI', 'XÁC NHẬN', 'ĐANG GIAO', 'GIAO MỘT PHẦN', 'HOÀN TẤT', 'HỦY'];
const KD_PAYMENT_STATUS = ['CHỜ XÁC NHẬN', 'ĐÃ XÁC NHẬN', 'HỦY'];
const KD_CONTROLLED_TABS = ['BÁO_GIÁ', 'CHI_TIẾT_BÁO_GIÁ', 'ĐƠN_HÀNG', 'GIAO_HÀNG', 'CHI_TIẾT_GIAO_HÀNG', 'THANH_TOÁN'];
const KD_QUOTE_TRANSITIONS = {
  'NHÁP': ['CHỜ DUYỆT'],
  'CHỜ DUYỆT': ['ĐÃ DUYỆT', 'TỪ CHỐI', 'NHÁP'],
  'ĐÃ DUYỆT': ['ĐÃ GỬI', 'HẾT HẠN'],
  'ĐÃ GỬI': ['CHẤP NHẬN', 'TỪ CHỐI', 'HẾT HẠN'],
  'CHẤP NHẬN': [], 'TỪ CHỐI': [], 'HẾT HẠN': []
};
const KD_APPROVER_ROLES = ['TRƯỞNG PHÒNG', 'SALES ADMIN'];
const KD_ORDER_TRANSITIONS = {
  'MỚI': ['XÁC NHẬN', 'HỦY'],
  'XÁC NHẬN': ['ĐANG GIAO', 'HỦY'],
  'ĐANG GIAO': ['GIAO MỘT PHẦN', 'HOÀN TẤT'],
  'GIAO MỘT PHẦN': ['ĐANG GIAO', 'HOÀN TẤT'],
  'HOÀN TẤT': [], 'HỦY': []
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Báo giá & Đơn hàng')
    .addItem('Cài dữ liệu Demo', 'caiDatDemoBaoGiaDonHang')
    .addItem('Cài cấu trúc Sạch', 'caiDatSachBaoGiaDonHang')
    .addItem('Kiểm tra hệ thống', 'kiemTraHeThongBaoGiaDonHang')
    .addSeparator()
    .addItem('Thiết lập người dùng hiện tại', 'thietLapNguoiDungHienTaiKD')
    .addItem('Gửi báo giá chờ duyệt', 'guiBaoGiaChoDuyetKD')
    .addItem('Duyệt báo giá', 'duyetBaoGiaKD')
    .addItem('Từ chối báo giá', 'tuChoiBaoGiaKD')
    .addItem('Đánh dấu đã gửi khách', 'danhDauBaoGiaDaGuiKD')
    .addItem('Tạo revision báo giá mới', 'taoRevisionBaoGiaKD')
    .addItem('Chuyển báo giá thành đơn', 'chuyenBaoGiaThanhDonHangKD')
    .addItem('Xem bản in / Lưu PDF', 'xemBanInBaoGiaKD')
    .addItem('Chuyển trạng thái đơn hàng', 'chuyenTrangThaiDonHangKD')
    .addItem('Xác nhận / hủy thanh toán', 'chuyenTrangThaiThanhToanKD')
    .addSeparator()
    .addItem('Sao lưu', 'saoLuuBaoGiaDonHang')
    .addItem('Khôi phục', 'khoiPhucBaoGiaDonHang')
    .addItem('Làm sạch dữ liệu', 'lamSachBaoGiaDonHang')
    .addToUi();
  syncControlSnapshotsKD_(SpreadsheetApp.getActive());
}

function onEdit(e) {
  if (!e || !e.range || e.range.getRow() < 2) return;
  const sheetName = e.range.getSheet().getName();
  if (KD_CONTROLLED_TABS.indexOf(sheetName) === -1) return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) {
    restoreControlledRangeKD_(e.source, e.range);
    e.source.toast('Vùng dán nhiều ô đã được hoàn tác từ snapshot kiểm soát.', 'Đã chặn paste nhiều ô', 8);
    return;
  }
  handleControlledEditKD_(e);
  syncControlSnapshotKD_(e.source, sheetName);
}

function handleControlledEditKD_(e) {
  if (e.range.getSheet().getName() === 'CHI_TIẾT_BÁO_GIÁ') { onEditQuoteLineKD_(e); return; }
  if (e.range.getSheet().getName() === 'THANH_TOÁN') { onEditPaymentKD_(e); return; }
  if (['GIAO_HÀNG', 'CHI_TIẾT_GIAO_HÀNG'].indexOf(e.range.getSheet().getName()) !== -1) { onEditDeliveryKD_(e); return; }
  if (e.range.getSheet().getName() === 'ĐƠN_HÀNG') { onEditOrderKD_(e); return; }
  if (e.range.getSheet().getName() !== 'BÁO_GIÁ') return;
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const column = e.range.getColumn();
  if (column === 1 && e.value && !sheet.getRange(row, 8).getValue()) {
    const actorId = auditActorIdKD_(e.source);
    sheet.getRange(row, 8).setValue('NHÁP');
    sheet.getRange(row, 12).setValue(1);
    sheet.getRange(row, 13).setValue(actorId);
    sheet.getRange(row, 17).setValue(new Date());
    logKD_(e.source, 'TẠO BÁO GIÁ', 'BÁO_GIÁ', buildQuoteAuditDetailKD_({ status: '', rowVersion: 0 }, { status: 'NHÁP', rowVersion: 1 }, actorId, ''), e.value);
    return;
  }
  if ([8, 12, 14, 15, 16, 17].indexOf(column) !== -1) {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast('Cột workflow chỉ được cập nhật bằng menu Báo giá & Đơn hàng.', 'Đã chặn sửa trực tiếp', 6);
    return;
  }
  if ([1, 2, 3, 4, 5, 6, 7, 11].indexOf(column) === -1) return;
  const status = String(sheet.getRange(row, 8).getValue() || '');
  if (status && status !== 'NHÁP') {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast('Revision đã vào workflow là bất biến. Hãy tạo revision mới để chỉnh sửa.', 'Đã chặn sửa', 6);
    return;
  }
  if (status === 'NHÁP') {
    const currentVersion = Number(sheet.getRange(row, 12).getValue() || 1);
    sheet.getRange(row, 12).setValue(currentVersion + 1);
    sheet.getRange(row, 17).setValue(new Date());
    const actorId = auditActorIdKD_(e.source);
    logKD_(e.source, 'SỬA BÁO GIÁ NHÁP', 'BÁO_GIÁ', JSON.stringify({ cot: KD_HEADERS['BÁO_GIÁ'][column - 1], phienBanTruoc: currentVersion, phienBanSau: currentVersion + 1, nguoiThucHien: actorId }), sheet.getRange(row, 1).getValue());
  }
}

function controlSnapshotNameKD_(sheetName) {
  return '__KS_' + sheetName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D').replace(/[^A-Z0-9_]/g, '_').slice(0, 70);
}

function syncControlSnapshotsKD_(ss) {
  KD_CONTROLLED_TABS.forEach(function (name) { if (ss.getSheetByName(name)) syncControlSnapshotKD_(ss, name); });
}

function syncControlSnapshotKD_(ss, sheetName) {
  const source = ss.getSheetByName(sheetName);
  if (!source) return;
  const snapshot = ensureSheetKD_(ss, controlSnapshotNameKD_(sheetName));
  const width = KD_HEADERS[sheetName].length;
  if (snapshot.getMaxRows() < KD_MAX_ROWS) snapshot.insertRowsAfter(snapshot.getMaxRows(), KD_MAX_ROWS - snapshot.getMaxRows());
  if (snapshot.getMaxColumns() < width) snapshot.insertColumnsAfter(snapshot.getMaxColumns(), width - snapshot.getMaxColumns());
  snapshot.clear();
  source.getRange(1, 1, KD_MAX_ROWS, width).copyTo(snapshot.getRange(1, 1, KD_MAX_ROWS, width), SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
  snapshot.hideSheet();
  let protection = snapshot.getProtections(SpreadsheetApp.ProtectionType.SHEET).find(function (item) { return item.getDescription() === 'Snapshot kiểm soát KD'; });
  if (!protection) protection = snapshot.protect().setDescription('Snapshot kiểm soát KD');
  protection.setWarningOnly(false);
}

function restoreControlledRangeKD_(ss, targetRange) {
  const sheetName = targetRange.getSheet().getName();
  const snapshot = ss.getSheetByName(controlSnapshotNameKD_(sheetName));
  if (!snapshot) throw new Error('Thiếu snapshot kiểm soát; hãy chạy lại bộ cài trước khi nhập dữ liệu.');
  snapshot.getRange(targetRange.getRow(), targetRange.getColumn(), targetRange.getNumRows(), targetRange.getNumColumns()).copyTo(targetRange, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);
}

function onEditQuoteLineKD_(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const currentQuoteId = String(sheet.getRange(row, 2).getValue() || '');
  const quoteIds = [currentQuoteId];
  if (e.range.getColumn() === 2 && e.oldValue) quoteIds.push(String(e.oldValue));
  const quoteSheet = e.source.getSheetByName('BÁO_GIÁ');
  const quotes = quoteSheet.getLastRow() < 2 ? [] : quoteSheet.getRange(2, 1, quoteSheet.getLastRow() - 1, 17).getValues();
  const matched = quotes.filter(function (quote) { return quoteIds.indexOf(String(quote[0])) !== -1; });
  if (matched.some(function (quote) { return quote[7] && quote[7] !== 'NHÁP'; })) {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast('Không được sửa chi tiết của revision đã vào workflow.', 'Đã chặn sửa', 6);
    return;
  }
  const quote = matched.find(function (item) { return item[0] === currentQuoteId; });
  if (quote) {
    const quoteRow = quotes.indexOf(quote) + 2;
    const currentVersion = Number(quote[11] || 1);
    quoteSheet.getRange(quoteRow, 12).setValue(currentVersion + 1);
    quoteSheet.getRange(quoteRow, 17).setValue(new Date());
    logKD_(e.source, 'SỬA CHI TIẾT BÁO GIÁ NHÁP', 'BÁO_GIÁ', JSON.stringify({ maDong: sheet.getRange(row, 1).getValue(), phienBanTruoc: currentVersion, phienBanSau: currentVersion + 1, nguoiThucHien: auditActorIdKD_(e.source) }), currentQuoteId);
  }
}

function onEditPaymentKD_(e) {
  const sheet = e.range.getSheet();
  const status = String(sheet.getRange(e.range.getRow(), 6).getValue() || '');
  if (e.range.getColumn() === 6 || (status && status !== 'CHỜ XÁC NHẬN')) {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast('Thanh toán chỉ được xác nhận/hủy bằng menu và không sửa sau quyết định.', 'Đã chặn sửa', 6);
    return;
  }
  const errors = validatePaymentRulesKD_(e.source);
  if (errors.length) {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast(errors[0], 'Đã chặn thanh toán không hợp lệ', 8);
  }
}

function onEditDeliveryKD_(e) {
  const errors = validateDeliveryRulesKD_(e.source);
  if (!errors.length) return;
  e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
  e.source.toast(errors[0], 'Đã chặn giao hàng không hợp lệ', 8);
}

function onEditOrderKD_(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const column = e.range.getColumn();
  if (column === 1 && e.value && !sheet.getRange(row, 11).getValue()) {
    const actorId = auditActorIdKD_(e.source);
    sheet.getRange(row, 11).setValue('MỚI');
    sheet.getRange(row, 13).setValue(1);
    sheet.getRange(row, 14).setValue(actorId);
    sheet.getRange(row, 15).setValue(new Date());
    logKD_(e.source, 'TẠO ĐƠN HÀNG', 'ĐƠN_HÀNG', JSON.stringify({ trangThai: 'MỚI', phienBanDong: 1, nguoiThucHien: actorId }), e.value);
    return;
  }
  if ([11, 13, 14, 15].indexOf(column) !== -1) {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast('Cột workflow chỉ được cập nhật bằng menu Báo giá & Đơn hàng.', 'Đã chặn sửa trực tiếp', 6);
    return;
  }
  if ([1, 2, 3, 4, 5, 6, 12].indexOf(column) === -1) return;
  const status = String(sheet.getRange(row, 11).getValue() || '');
  if (status && status !== 'MỚI') {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    e.source.toast('Đơn hàng đã xác nhận không được sửa trực tiếp.', 'Đã chặn sửa', 6);
    return;
  }
  if (status === 'MỚI') {
    const currentVersion = Number(sheet.getRange(row, 13).getValue() || 1);
    sheet.getRange(row, 13).setValue(currentVersion + 1);
    sheet.getRange(row, 15).setValue(new Date());
  }
}

function thietLapNguoiDungHienTaiKD() {
  const ui = SpreadsheetApp.getUi();
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('Google không cung cấp email phiên hiện tại. Hãy dùng tài khoản Workspace được nhận diện hoặc liên hệ chủ bảng.');
  const user = findUserByEmailKD_(SpreadsheetApp.getActive(), email);
  if (!user) throw new Error('Email phiên hiện tại chưa được chủ bảng ánh xạ trong NGƯỜI_DÙNG.');
  ui.alert('Đã nhận diện: ' + user.id + ' — ' + user.role + '. Vai trò lấy từ email Google đang đăng nhập.');
}

function guiBaoGiaChoDuyetKD() { return transitionSelectedQuoteKD_('CHỜ DUYỆT', ''); }
function duyetBaoGiaKD() { return transitionSelectedQuoteKD_('ĐÃ DUYỆT', ''); }
function danhDauBaoGiaDaGuiKD() { return transitionSelectedQuoteKD_('ĐÃ GỬI', ''); }

function tuChoiBaoGiaKD() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Từ chối báo giá', 'Nhập lý do từ chối bắt buộc.', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  return transitionSelectedQuoteKD_('TỪ CHỐI', response.getResponseText());
}

function chuyenBaoGiaThanhDonHangKD() {
  const selection = getSelectedQuoteKD_();
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    const quoteSheet = ss.getSheetByName('BÁO_GIÁ');
    const quote = quoteSheet.getRange(selection.row, 1, 1, KD_HEADERS['BÁO_GIÁ'].length).getValues()[0];
    if (quote[7] !== 'CHẤP NHẬN' || quote[3] !== true) throw new Error('Chỉ revision mới nhất đã CHẤP NHẬN được chuyển thành đơn hàng.');
    const orderSheet = ss.getSheetByName('ĐƠN_HÀNG');
    const existing = orderSheet.getLastRow() < 2 ? [] : orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, 2).getDisplayValues().find(function (row) { return row[1] === quote[0]; });
    if (existing) {
      ss.toast('Báo giá đã được chuyển thành ' + existing[0] + '.', 'Không tạo trùng', 5);
      return { created: false, orderId: existing[0] };
    }
    const orderIds = orderSheet.getLastRow() < 2 ? [] : orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const orderId = nextSequentialIdKD_(orderIds, 'DH');
    const createdAt = new Date();
    const dueAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const quoteLineSheet = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
    const quoteLines = quoteLineSheet.getLastRow() < 2 ? [] : quoteLineSheet.getRange(2, 1, quoteLineSheet.getLastRow() - 1, 14).getValues().filter(function (row) { return row[1] === quote[0]; });
    if (!quoteLines.length) throw new Error('Báo giá không có dòng sản phẩm để chuyển đơn.');
    const actor = currentUserKD_(ss);
    orderSheet.appendRow([orderId, quote[0], quote[4], createdAt, dueAt, 'TRỰC TIẾP', '', '', '', '', 'MỚI', quote[10], 1, actor.id, createdAt]);
    const orderLineSheet = ss.getSheetByName('CHI_TIẾT_ĐƠN_HÀNG');
    const existingLineIds = orderLineSheet.getLastRow() < 2 ? [] : orderLineSheet.getRange(2, 1, orderLineSheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const allocatedLineIds = existingLineIds.slice();
    const rows = quoteLines.map(function (line) {
      const lineId = nextSequentialIdKD_(allocatedLineIds, 'DDH');
      allocatedLineIds.push(lineId);
      return [lineId, orderId, line[2], '', '', line[5], line[6], '', '', '', ''];
    });
    orderLineSheet.getRange(orderLineSheet.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
    applyFormulasKD_(ss);
    buildDashboardKD_(ss);
    logKD_(ss, 'CHUYỂN BÁO GIÁ THÀNH ĐƠN', 'ĐƠN_HÀNG', JSON.stringify({ maBaoGiaRevision: quote[0], soDong: rows.length }), orderId);
    ss.toast('Đã tạo ' + orderId + ' từ ' + quote[0] + '.', 'Chuyển đơn thành công', 5);
    return { created: true, orderId: orderId, lineCount: rows.length };
  });
}

function taoRevisionBaoGiaKD() {
  const selection = getSelectedQuoteKD_();
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    const actor = currentUserKD_(ss);
    const sheet = ss.getSheetByName('BÁO_GIÁ');
    const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 17).getValues();
    const source = sheet.getRange(selection.row, 1, 1, 17).getValues()[0];
    if (source[3] !== true) throw new Error('Chỉ revision mới nhất được dùng để tạo revision tiếp theo.');
    const revisions = rows.filter(function (row) { return row[1] === source[1]; }).map(function (row) { return Number(row[2] || 0); });
    const nextRevision = Math.max.apply(null, revisions) + 1;
    const nextId = source[1] + '-R' + nextRevision;
    sheet.getRange(selection.row, 4).setValue(false);
    const now = new Date();
    sheet.appendRow([nextId, source[1], nextRevision, true, source[4], now, source[6], 'NHÁP', '', '', source[10], 1, actor.id, '', '', '', now]);
    const quoteLineSheet = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
    const sourceLines = quoteLineSheet.getLastRow() < 2 ? [] : quoteLineSheet.getRange(2, 1, quoteLineSheet.getLastRow() - 1, 14).getValues().filter(function (row) { return row[1] === source[0]; });
    const allocated = quoteLineSheet.getLastRow() < 2 ? [] : quoteLineSheet.getRange(2, 1, quoteLineSheet.getLastRow() - 1, 1).getDisplayValues().flat();
    const newLines = sourceLines.map(function (line) {
      const lineId = nextSequentialIdKD_(allocated, 'DBG');
      allocated.push(lineId);
      return [lineId, nextId, line[2], '', '', line[5], line[6], line[7], '', '', '', '', '', ''];
    });
    if (newLines.length) quoteLineSheet.getRange(quoteLineSheet.getLastRow() + 1, 1, newLines.length, 14).setValues(newLines);
    applyFormulasKD_(ss);
    buildDashboardKD_(ss);
    logKD_(ss, 'TẠO REVISION', 'BÁO_GIÁ', JSON.stringify({ revisionNguon: source[0], revisionMoi: nextId, soDong: newLines.length, nguoiThucHien: actor.id }), nextId);
    return { quoteRevisionId: nextId, lineCount: newLines.length };
  });
}

function nextSequentialIdKD_(ids, prefix, offset) {
  const highest = ids.reduce(function (max, id) {
    const match = String(id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return prefix + '-' + String(highest + Number(offset || 1)).padStart(3, '0');
}

function xemBanInBaoGiaKD() {
  const selection = getSelectedQuoteKD_();
  const ss = SpreadsheetApp.getActive();
  const quoteSheet = ss.getSheetByName('BÁO_GIÁ');
  const quote = quoteSheet.getRange(selection.row, 1, 1, KD_HEADERS['BÁO_GIÁ'].length).getDisplayValues()[0];
  const lineSheet = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
  const lines = lineSheet.getLastRow() < 2 ? [] : lineSheet.getRange(2, 1, lineSheet.getLastRow() - 1, 14).getDisplayValues().filter(function (row) { return row[1] === quote[0]; });
  const bodyRows = lines.map(function (line) {
    return '<tr><td>' + escapeHtmlKD_(line[2]) + '</td><td>' + escapeHtmlKD_(line[3]) + '</td><td class="num">' + escapeHtmlKD_(line[5]) + '</td><td class="num">' + escapeHtmlKD_(line[6]) + '</td><td class="num">' + escapeHtmlKD_(line[7]) + '</td><td class="num">' + escapeHtmlKD_(line[13]) + '</td></tr>';
  }).join('');
  const html = '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#202124;padding:24px}h1{color:#1f4e78}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #c9d2dc;padding:8px}th{background:#eceff1}.num{text-align:right}.total{font-size:18px;font-weight:700;text-align:right;margin-top:16px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">In / Lưu PDF</button><h1>BÁO GIÁ</h1><div class="meta"><div><b>Mã:</b> ' + escapeHtmlKD_(quote[0]) + '</div><div><b>Trạng thái:</b> ' + escapeHtmlKD_(quote[7]) + '</div><div><b>Mã khách hàng:</b> ' + escapeHtmlKD_(quote[4]) + '</div><div><b>Hiệu lực đến:</b> ' + escapeHtmlKD_(quote[6]) + '</div></div><table><thead><tr><th>Mã SP</th><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Chiết khấu</th><th>Thành tiền</th></tr></thead><tbody>' + bodyRows + '</tbody></table><div class="total">Tổng thanh toán: ' + escapeHtmlKD_(quote[8]) + '</div></body></html>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(900).setHeight(650), 'Bản in báo giá ' + quote[0]);
}

function escapeHtmlKD_(value) {
  return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function chuyenTrangThaiDonHangKD() {
  const range = SpreadsheetApp.getActiveRange();
  if (!range || range.getSheet().getName() !== 'ĐƠN_HÀNG' || range.getRow() < 2) throw new Error('Hãy chọn một dòng dữ liệu trong tab ĐƠN_HÀNG.');
  const rowNumber = range.getRow();
  const expectedRowVersion = Number(range.getSheet().getRange(rowNumber, 13).getValue() || 1);
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Chuyển trạng thái đơn hàng', 'Nhập trạng thái đích: XÁC NHẬN, ĐANG GIAO, GIAO MỘT PHẦN, HOÀN TẤT hoặc HỦY.', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const targetStatus = String(response.getResponseText() || '').trim().toUpperCase();
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName('ĐƠN_HÀNG');
    const row = sheet.getRange(rowNumber, 1, 1, KD_HEADERS['ĐƠN_HÀNG'].length).getValues()[0];
    const actor = currentUserKD_(ss);
    const before = { status: row[10], rowVersion: Number(row[12] || 1) };
    const planned = planOrderTransitionKD_({ currentStatus: before.status, targetStatus: targetStatus, currentRowVersion: before.rowVersion, expectedRowVersion: expectedRowVersion, actorRole: actor.role });
    sheet.getRange(rowNumber, 11).setValue(planned.status);
    sheet.getRange(rowNumber, 13).setValue(planned.rowVersion);
    sheet.getRange(rowNumber, 15).setValue(new Date());
    logKD_(ss, 'CHUYỂN TRẠNG THÁI', 'ĐƠN_HÀNG', buildQuoteAuditDetailKD_(before, { status: planned.status, rowVersion: planned.rowVersion }, actor.id, ''), row[0]);
    buildDashboardKD_(ss);
    ss.toast('Đã chuyển ' + row[0] + ' sang ' + planned.status + '.', 'Workflow đơn hàng', 5);
    return planned;
  });
}

function planOrderTransitionKD_(input) {
  const allowed = KD_ORDER_TRANSITIONS[input.currentStatus] || [];
  if (allowed.indexOf(input.targetStatus) === -1) throw new Error('Chuyển trạng thái đơn hàng không hợp lệ.');
  if (!Number.isInteger(input.currentRowVersion) || input.currentRowVersion < 1 || input.currentRowVersion !== input.expectedRowVersion) throw new Error('Phiên bản dòng không khớp. Hãy tải lại bảng trước khi thao tác.');
  const privileged = ['TRƯỞNG PHÒNG', 'SALES ADMIN'];
  const deliveryRoles = privileged.concat(['GIAO NHẬN']);
  if (['XÁC NHẬN', 'HỦY'].indexOf(input.targetStatus) !== -1 && privileged.indexOf(input.actorRole) === -1) throw new Error('Vai trò không có quyền xác nhận hoặc hủy đơn hàng.');
  if (['ĐANG GIAO', 'GIAO MỘT PHẦN', 'HOÀN TẤT'].indexOf(input.targetStatus) !== -1 && deliveryRoles.indexOf(input.actorRole) === -1) throw new Error('Vai trò không có quyền cập nhật giao hàng.');
  return { status: input.targetStatus, rowVersion: input.currentRowVersion + 1 };
}

function chuyenTrangThaiThanhToanKD() {
  const range = SpreadsheetApp.getActiveRange();
  if (!range || range.getSheet().getName() !== 'THANH_TOÁN' || range.getRow() < 2) throw new Error('Hãy chọn một dòng trong tab THANH_TOÁN.');
  const rowNumber = range.getRow();
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Quyết định thanh toán', 'Nhập ĐÃ XÁC NHẬN hoặc HỦY.', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const targetStatus = String(response.getResponseText() || '').trim().toUpperCase();
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    const actor = currentUserKD_(ss);
    if (['TRƯỞNG PHÒNG', 'SALES ADMIN', 'KẾ TOÁN'].indexOf(actor.role) === -1) throw new Error('Vai trò không có quyền quyết định thanh toán.');
    if (['ĐÃ XÁC NHẬN', 'HỦY'].indexOf(targetStatus) === -1) throw new Error('Trạng thái thanh toán đích không hợp lệ.');
    const sheet = ss.getSheetByName('THANH_TOÁN');
    const row = sheet.getRange(rowNumber, 1, 1, 6).getValues()[0];
    if (row[5] !== 'CHỜ XÁC NHẬN') throw new Error('Chỉ thanh toán CHỜ XÁC NHẬN được quyết định.');
    if (targetStatus === 'ĐÃ XÁC NHẬN') {
      const orderSheet = ss.getSheetByName('ĐƠN_HÀNG');
      const orders = orderSheet.getLastRow() < 2 ? [] : orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, 11).getValues();
      const matchedOrder = orders.find(function (o) { return String(o[0]) === String(row[1]); });
      if (matchedOrder && matchedOrder[10] === 'HỦY') throw new Error('Không thể xác nhận thanh toán cho đơn hàng đã hủy: ' + row[1]);
      if (Number(row[3] || 0) <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0.');
    }
    sheet.getRange(rowNumber, 6).setValue(targetStatus);
    logKD_(ss, 'QUYẾT ĐỊNH THANH TOÁN', 'THANH_TOÁN', JSON.stringify({ truoc: 'CHỜ XÁC NHẬN', sau: targetStatus, nguoiThucHien: actor.id, soTien: Number(row[3]) }), row[0]);
    buildDashboardKD_(ss);
    return { paymentId: row[0], status: targetStatus };
  });
}

function transitionSelectedQuoteKD_(targetStatus, rejectionReason) {
  const selection = getSelectedQuoteKD_();
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName('BÁO_GIÁ');
    const row = sheet.getRange(selection.row, 1, 1, KD_HEADERS['BÁO_GIÁ'].length).getValues()[0];
    const actor = currentUserKD_(ss);
    const separateRoles = String(getConfigKD_(ss, 'TACH_VAI_TRO_DUYET', 'TRUE')).toUpperCase() !== 'FALSE';
    const before = { status: row[7], rowVersion: Number(row[11] || 1) };
    const planned = planQuoteTransitionKD_({
      currentStatus: before.status,
      targetStatus: targetStatus,
      currentRowVersion: before.rowVersion,
      expectedRowVersion: selection.expectedRowVersion,
      actorId: actor.id,
      actorRole: actor.role,
      creatorId: String(row[12] || row[10] || ''),
      separateApprover: separateRoles,
      rejectionReason: rejectionReason
    });
    const now = new Date();
    sheet.getRange(selection.row, 8).setValue(planned.status);
    sheet.getRange(selection.row, 12).setValue(planned.rowVersion);
    if (planned.approverId) sheet.getRange(selection.row, 14).setValue(planned.approverId);
    if (planned.approvedAt) sheet.getRange(selection.row, 15).setValue(now);
    sheet.getRange(selection.row, 16).setValue(planned.rejectionReason);
    sheet.getRange(selection.row, 17).setValue(now);
    if (before.status === 'NHÁP' && planned.status !== 'NHÁP') {
      chotDonGiaBaoGiaKD_(ss, row[0]);
    }
    const after = { status: planned.status, rowVersion: planned.rowVersion };
    logKD_(ss, 'CHUYỂN TRẠNG THÁI', 'BÁO_GIÁ', buildQuoteAuditDetailKD_(before, after, actor.id, rejectionReason), row[0]);
    ss.toast('Đã chuyển ' + row[0] + ' sang ' + planned.status + '.', 'Workflow báo giá', 5);
    return planned;
  });
}

function getSelectedQuoteKD_() {
  const range = SpreadsheetApp.getActiveRange();
  if (!range || range.getSheet().getName() !== 'BÁO_GIÁ' || range.getRow() < 2) throw new Error('Hãy chọn một dòng dữ liệu trong tab BÁO_GIÁ.');
  const version = Number(range.getSheet().getRange(range.getRow(), 12).getValue() || 1);
  return { row: range.getRow(), expectedRowVersion: version };
}

function currentUserKD_(ss) {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('Không xác định được email Google đang đăng nhập.');
  const user = findUserByEmailKD_(ss, email);
  if (!user) throw new Error('Email phiên hiện tại chưa được ánh xạ trong NGƯỜI_DÙNG.');
  return user;
}

function findUserKD_(ss, userId) {
  const sheet = ss.getSheetByName('NGƯỜI_DÙNG');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getDisplayValues();
  const row = rows.find(function (item) { return item[0] === userId; });
  return row ? { id: row[0], role: row[2] } : null;
}

function findUserByEmailKD_(ss, email) {
  const sheet = ss.getSheetByName('NGƯỜI_DÙNG');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getDisplayValues();
  const normalized = String(email || '').trim().toLowerCase();
  const row = rows.find(function (item) { return String(item[3] || '').trim().toLowerCase() === normalized; });
  return row ? { id: row[0], role: row[2], email: normalized } : null;
}

function auditActorIdKD_(ss) {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const user = email ? findUserByEmailKD_(ss, email) : null;
  return user ? user.id : 'NGƯỜI_DÙNG_HỆ_THỐNG';
}

function getConfigKD_(ss, key, fallback) {
  const sheet = ss.getSheetByName('CẤU_HÌNH');
  if (!sheet || sheet.getLastRow() < 2) return fallback;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
  const row = rows.find(function (item) { return item[0] === key; });
  return row ? row[1] : fallback;
}

function planQuoteTransitionKD_(input) {
  const allowed = KD_QUOTE_TRANSITIONS[input.currentStatus] || [];
  if (allowed.indexOf(input.targetStatus) === -1) throw new Error('Chuyển trạng thái báo giá không hợp lệ.');
  if (!Number.isInteger(input.currentRowVersion) || input.currentRowVersion < 1 || input.currentRowVersion !== input.expectedRowVersion) throw new Error('Phiên bản dòng không khớp. Hãy tải lại bảng trước khi thao tác.');
  const approvalAction = ['ĐÃ DUYỆT', 'TỪ CHỐI'].indexOf(input.targetStatus) !== -1;
  if (approvalAction && KD_APPROVER_ROLES.indexOf(input.actorRole) === -1) throw new Error('Vai trò không có quyền duyệt báo giá.');
  if (approvalAction && input.separateApprover && input.actorId === input.creatorId) throw new Error('Người tạo không được tự duyệt báo giá.');
  const rejectionReason = String(input.rejectionReason || '').trim();
  if (input.targetStatus === 'TỪ CHỐI' && !rejectionReason) throw new Error('Lý do từ chối là bắt buộc.');
  return {
    status: input.targetStatus,
    rowVersion: input.currentRowVersion + 1,
    approverId: approvalAction ? input.actorId : '',
    approvedAt: approvalAction,
    rejectionReason: input.targetStatus === 'TỪ CHỐI' ? rejectionReason.slice(0, 200) : ''
  };
}

function buildQuoteAuditDetailKD_(before, after, actorId, rejectionReason) {
  return JSON.stringify({
    truoc: { trangThai: before.status, phienBanDong: before.rowVersion },
    sau: { trangThai: after.status, phienBanDong: after.rowVersion },
    nguoiThucHien: String(actorId || '').slice(0, 40),
    lyDoTuChoi: String(rejectionReason || '').replace(/[\r\n]/g, ' ').slice(0, 200)
  });
}

function chotDonGiaBaoGiaKD_(ss, quoteRevisionId) {
  const lineSheet = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
  if (!lineSheet || lineSheet.getLastRow() < 2) return;
  const numRows = lineSheet.getLastRow() - 1;
  const lines = lineSheet.getRange(2, 1, numRows, 14).getValues();
  const productSheet = ss.getSheetByName('SẢN_PHẨM');
  const products = productSheet && productSheet.getLastRow() >= 2
    ? Object.fromEntries(productSheet.getRange(2, 1, productSheet.getLastRow() - 1, 4).getValues().map(function (p) { return [String(p[0]), Number(p[3] || 0)]; }))
    : {};
  for (let i = 0; i < lines.length; i++) {
    if (String(lines[i][1]) === String(quoteRevisionId)) {
      let currentVal = lines[i][6];
      if (currentVal === '' || currentVal === null || isNaN(Number(currentVal))) {
        const productId = String(lines[i][2]);
        currentVal = products[productId] || 0;
      } else {
        currentVal = Number(currentVal);
      }
      lineSheet.getRange(i + 2, 7).setValue(currentVal);
    }
  }
}

function caiDatDemoBaoGiaDonHang() {
  return withLockKD_(function () { requireAdminKD_(SpreadsheetApp.getActive(), true); return installKD_('demo', true); });
}

function caiDatSachBaoGiaDonHang() {
  return withLockKD_(function () { requireAdminKD_(SpreadsheetApp.getActive(), true); return installKD_('clean', false); });
}

function caiDatBusinessBaoGiaDonHang() {
  return withLockKD_(function () { requireAdminKD_(SpreadsheetApp.getActive(), true); return installKD_('business', false); });
}

function taoDuLieuDemoBaoGiaDonHang() {
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    requireAdminKD_(ss, false);
    ensureStructureKD_(ss, 'demo');
    seedDemoKD_(ss);
    applyFormulasKD_(ss);
    buildDashboardKD_(ss);
    logKD_(ss, 'TẠO DỮ LIỆU DEMO', 'HỆ THỐNG', '50 bản ghi nghiệp vụ');
    buildStartKD_(ss, 'demo');
    return { created: 50, version: KD_VERSION };
  });
}

function kiemTraHeThongBaoGiaDonHang() {
  const ss = SpreadsheetApp.getActive();
  const missing = KD_TABS.filter(function (name) { return !ss.getSheetByName(name); });
  const duplicateErrors = [];
  Object.keys(KD_HEADERS).forEach(function (tab) {
    const sheet = ss.getSheetByName(tab);
    if (!sheet || sheet.getLastRow() < 2) return;
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat().filter(String);
    const seen = {};
    ids.forEach(function (id) { if (seen[id]) duplicateErrors.push(tab + ': ' + id); seen[id] = true; });
  });
  const refErrors = validateRefsKD_(ss);
  Array.prototype.push.apply(refErrors, validateDeliveryRulesKD_(ss));
  Array.prototype.push.apply(refErrors, validatePaymentRulesKD_(ss));
  return { valid: missing.length === 0 && duplicateErrors.length === 0 && refErrors.length === 0, missing: missing, duplicateIds: duplicateErrors, refErrors: refErrors, version: KD_VERSION };
}

function saoLuuBaoGiaDonHang() {
  return withLockKD_(function () { const ss = SpreadsheetApp.getActive(); requireAdminKD_(ss, false); return backupKD_(ss, 'Sao lưu thủ công'); });
}

function khoiPhucBaoGiaDonHang() {
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    requireAdminKD_(ss, false);
    const backupSheet = ss.getSheetByName('__SAO_LƯU_KD');
    if (!backupSheet || backupSheet.getLastRow() < 1) throw new Error('Chưa có bản sao lưu để khôi phục.');
    const backupRows = backupSheet.getRange(1, 1, backupSheet.getLastRow(), Math.max(7, backupSheet.getLastColumn())).getValues();
    const latest = readLatestBackupKD_(backupRows);
    const payload = latest.payload;
    const savedChecksum = latest.checksum;
    if (checksumKD_(payload) !== savedChecksum) throw new Error('Bản sao lưu không toàn vẹn.');
    const sheets = JSON.parse(payload);
    sheets.forEach(function (saved) {
      const sheet = ensureSheetKD_(ss, saved.name);
      sheet.clear();
      if (saved.values.length && saved.values[0].length) {
        sheet.getRange(1, 1, saved.values.length, saved.values[0].length).setValues(saved.values.map(function (row) { return row.map(reviveBackupValueKD_); }));
        saved.formulas.forEach(function (row, r) { row.forEach(function (formula, c) { if (formula) sheet.getRange(r + 1, c + 1).setFormula(formula); }); });
      }
    });
    ensureStructureKD_(ss, 'restore');
    applyFormulasKD_(ss);
    applyValidationsKD_(ss);
    protectFormulaRangesKD_(ss);
    protectAdminSheetsKD_(ss);
    buildDashboardKD_(ss);
    logKD_(ss, 'KHÔI PHỤC', 'HỆ THỐNG', 'Khôi phục bản sao lưu ' + latest.id, latest.id);
    buildStartKD_(ss, 'restore');
    return { restored: true, backupId: latest.id };
  });
}

function lamSachBaoGiaDonHang() {
  return withLockKD_(function () {
    const ss = SpreadsheetApp.getActive();
    requireAdminKD_(ss, false);
    const backupId = backupKD_(ss, 'Sao lưu tự động trước làm sạch');
    ['KHÁCH_HÀNG', 'SẢN_PHẨM', 'BÁO_GIÁ', 'CHI_TIẾT_BÁO_GIÁ', 'ĐƠN_HÀNG', 'CHI_TIẾT_ĐƠN_HÀNG', 'GIAO_HÀNG', 'CHI_TIẾT_GIAO_HÀNG', 'THANH_TOÁN'].forEach(function (name) {
      const sheet = ss.getSheetByName(name);
      if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getMaxColumns()).clearContent();
    });
    applyFormulasKD_(ss);
    buildDashboardKD_(ss);
    logKD_(ss, 'LÀM SẠCH', 'HỆ THỐNG', backupId);
    buildStartKD_(ss, 'clean');
    return { backupId: backupId, cleaned: true };
  });
}

function installKD_(mode, seedDemo) {
  const ss = SpreadsheetApp.getActive();
  ensureStructureKD_(ss, mode);
  if (seedDemo) seedDemoKD_(ss);
  applyFormulasKD_(ss);
  applyValidationsKD_(ss);
  protectFormulaRangesKD_(ss);
  protectAdminSheetsKD_(ss);
  buildDashboardKD_(ss);
  PropertiesService.getDocumentProperties().setProperties({ KD_VERSION: KD_VERSION, KD_MODE: mode, KD_INSTALLED_AT: new Date().toISOString() });
  logKD_(ss, 'CÀI ĐẶT', 'HỆ THỐNG', mode);
  buildStartKD_(ss, mode);
  return { installed: true, mode: mode, seeded: seedDemo, version: KD_VERSION };
}

function withLockKD_(work) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const result = work();
    syncControlSnapshotsKD_(SpreadsheetApp.getActive());
    return result;
  } finally { lock.releaseLock(); }
}

function requireAdminKD_(ss, allowBootstrap) {
  const activeEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  if (allowBootstrap && activeEmail && effectiveEmail && activeEmail === effectiveEmail) return { id: 'CHỦ_CÀI_ĐẶT', role: 'CHỦ SỞ HỮU' };
  const user = activeEmail ? findUserByEmailKD_(ss, activeEmail) : null;
  if (!user || ['TRƯỞNG PHÒNG', 'SALES ADMIN'].indexOf(user.role) === -1) throw new Error('Chỉ chủ cài đặt, TRƯỞNG PHÒNG hoặc SALES ADMIN được thực hiện thao tác quản trị này.');
  return user;
}

function ensureStructureKD_(ss, mode) {
  ss.setSpreadsheetLocale('vi_VN');
  ss.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  KD_TABS.forEach(function (name) { ensureSheetKD_(ss, name); });
  Object.keys(KD_HEADERS).forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    const headers = KD_HEADERS[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleTableKD_(sheet, headers.length);
  });
  buildGuideKD_(ss, mode);
  applyValidationsKD_(ss);
}

function ensureSheetKD_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function styleTableKD_(sheet, columnCount) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount).setFontWeight('bold').setBackground('#ECEFF1').setFontColor('#202124').setHorizontalAlignment('center');
  sheet.getRange(1, 1, KD_MAX_ROWS, columnCount).setFontFamily('Arial').setVerticalAlignment('middle');
  const existingFilter = sheet.getFilter();
  if (existingFilter && existingFilter.getRange().getNumColumns() !== columnCount) existingFilter.remove();
  if (!sheet.getFilter()) sheet.getRange(1, 1, KD_MAX_ROWS, columnCount).createFilter();
  sheet.autoResizeColumns(1, columnCount);
}

function buildGuideKD_(ss, mode) {
  const sheet = ss.getSheetByName('HƯỚNG_DẪN');
  sheet.clear();
  const rows = [
    ['QUẢN LÝ BÁO GIÁ VÀ ĐƠN HÀNG', '3.0.0-vi'],
    ['Chế độ cài', mode],
    ['Bắt đầu', 'Cập nhật CẤU_HÌNH, NGƯỜI_DÙNG, KHÁCH_HÀNG và SẢN_PHẨM trước khi lập báo giá.'],
    ['Thao tác hằng ngày', 'Lập báo giá → duyệt → gửi → chấp nhận → chuyển đơn → ghi nhận thanh toán.'],
    ['Quy tắc công nợ', 'Chỉ thanh toán ĐÃ XÁC NHẬN làm giảm công nợ.'],
    ['An toàn', 'Làm sạch luôn tạo sao lưu; không dùng dữ liệu khách hàng thật trong Demo.']
  ];
  sheet.getRange(1, 1, rows.length, 2).setValues(rows).setWrap(true).setFontFamily('Arial');
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setFontSize(15);
  sheet.setColumnWidth(1, 180); sheet.setColumnWidth(2, 620); sheet.setFrozenRows(1);
}

function applyValidationsKD_(ss) {
  setDropdownKD_(ss.getSheetByName('BÁO_GIÁ'), 8, KD_QUOTE_STATUS);
  setDropdownKD_(ss.getSheetByName('ĐƠN_HÀNG'), 11, KD_ORDER_STATUS);
  setDropdownKD_(ss.getSheetByName('THANH_TOÁN'), 6, KD_PAYMENT_STATUS);
  setDropdownKD_(ss.getSheetByName('GIAO_HÀNG'), 5, ['CHỜ GIAO', 'ĐANG GIAO', 'ĐÃ GIAO', 'HỦY']);
  setDropdownKD_(ss.getSheetByName('CHI_TIẾT_GIAO_HÀNG'), 5, ['ĐÃ GIAO', 'HỦY DÒNG']);
  setDropdownKD_(ss.getSheetByName('NGƯỜI_DÙNG'), 3, ['TRƯỞNG PHÒNG', 'SALES ADMIN', 'KINH DOANH', 'KẾ TOÁN', 'GIAO NHẬN']);
  setDropdownKD_(ss.getSheetByName('ĐƠN_HÀNG'), 6, ['TRỰC TIẾP', 'ĐIỆN THOẠI', 'WEBSITE', 'ĐỐI TÁC']);
  const rateRule = SpreadsheetApp.newDataValidation().requireNumberBetween(0, 1).setAllowInvalid(false).setHelpText('Nhập tỷ lệ từ 0 đến 1, ví dụ 0,1 tương ứng 10%.').build();
  ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ').getRange('H2:H500').setDataValidation(rateRule).setNumberFormat('0.00%');
  const rowVersionRule = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(1).setAllowInvalid(false).setHelpText('Phiên bản dòng là số nguyên từ 1 và chỉ được cập nhật qua menu workflow.').build();
  ss.getSheetByName('BÁO_GIÁ').getRange('L2:L500').setDataValidation(rowVersionRule).setNumberFormat('0');
  ss.getSheetByName('ĐƠN_HÀNG').getRange('M2:M500').setDataValidation(rowVersionRule).setNumberFormat('0');
}

function setDropdownKD_(sheet, column, values) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sheet.getRange(2, column, KD_MAX_ROWS - 1, 1).setDataValidation(rule);
}

function applyFormulasKD_(ss) {
  const quoteLines = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
  clearUnexpectedDiscountFormulasKD_(quoteLines);
  quoteLines.getRange(2, 4, KD_MAX_ROWS - 1, 2).setFormulasR1C1(Array.from({ length: KD_MAX_ROWS - 1 }, function () { return [
    '=IF(RC[-1]="";"";IFNA(VLOOKUP(RC[-1];\'SẢN_PHẨM\'!C1:C7;2;FALSE);""))',
    '=IF(RC[-2]="";"";IFNA(VLOOKUP(RC[-2];\'SẢN_PHẨM\'!C1:C7;3;FALSE);""))'
  ]; }));
  applyQuoteUnitPricesKD_(ss);
  quoteLines.getRange(2, 9, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-6]="";"";IFNA(VLOOKUP(RC[-6];\'SẢN_PHẨM\'!C1:C7;6;FALSE);""))');
  quoteLines.getRange(2, 10, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(OR(RC[-4]="";RC[-3]="");"";RC[-4]*RC[-3])');
  quoteLines.getRange(2, 11, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-1]="";"";RC[-1]*RC[-3])');
  quoteLines.getRange(2, 12, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-2]="";"";RC[-2]-RC[-1])');
  quoteLines.getRange(2, 13, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-1]="";"";RC[-1]*RC[-4])');
  quoteLines.getRange(2, 14, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-2]="";"";RC[-2]+RC[-1])');

  const quotes = ss.getSheetByName('BÁO_GIÁ');
  quotes.getRange(2, 9, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-8]="";"";SUMIFS(\'CHI_TIẾT_BÁO_GIÁ\'!C14;\'CHI_TIẾT_BÁO_GIÁ\'!C2;RC[-8]))');
  quotes.getRange(2, 10, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-9]="";"";IF(AND(RC[-2]="ĐÃ GỬI";RC[-3]<TODAY());"HẾT HẠN";""))');

  const orderLines = ss.getSheetByName('CHI_TIẾT_ĐƠN_HÀNG');
  orderLines.getRange(2, 4, KD_MAX_ROWS - 1, 2).setFormulasR1C1(Array.from({ length: KD_MAX_ROWS - 1 }, function () { return [
    '=IF(RC[-1]="";"";IFNA(VLOOKUP(RC[-1];\'SẢN_PHẨM\'!C1:C7;2;FALSE);""))',
    '=IF(RC[-2]="";"";IFNA(VLOOKUP(RC[-2];\'SẢN_PHẨM\'!C1:C7;3;FALSE);""))'
  ]; }));
  orderLines.getRange(2, 8, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(OR(RC[-2]="";RC[-1]="");"";RC[-2]*RC[-1])');
  orderLines.getRange(2, 9, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-8]="";"";SUMIFS(\'CHI_TIẾT_GIAO_HÀNG\'!C4;\'CHI_TIẾT_GIAO_HÀNG\'!C3;RC[-8];\'CHI_TIẾT_GIAO_HÀNG\'!C5;"ĐÃ GIAO"))');
  orderLines.getRange(2, 10, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-9]="";"";MAX(0;RC[-4]-RC[-1]))');
  orderLines.getRange(2, 11, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-10]="";"";RC[-3]-(RC[-5]*IFNA(VLOOKUP(RC[-8];\'SẢN_PHẨM\'!C1:C7;5;FALSE);0)))');

  const orders = ss.getSheetByName('ĐƠN_HÀNG');
  orders.getRange(2, 7, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-6]="";"";SUMIFS(\'CHI_TIẾT_ĐƠN_HÀNG\'!C8;\'CHI_TIẾT_ĐƠN_HÀNG\'!C2;RC[-6]))');
  orders.getRange(2, 8, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-7]="";"";SUMIFS(\'THANH_TOÁN\'!C4;\'THANH_TOÁN\'!C2;RC[-7];\'THANH_TOÁN\'!C6;"ĐÃ XÁC NHẬN"))');
  orders.getRange(2, 9, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-8]="";"";MAX(0;RC[-2]-RC[-1]))');
  orders.getRange(2, 10, KD_MAX_ROWS - 1, 1).setFormulaR1C1('=IF(RC[-9]="";"";IF(AND(RC[-5]<TODAY();RC[-1]>0;RC[1]<>"HỦY");"QUÁ HẠN";""))');

  [quoteLines.getRange('G2:G500'), quoteLines.getRange('J2:N500'), orders.getRange('G2:I500'), orderLines.getRange('G2:H500'), orderLines.getRange('K2:K500'), ss.getSheetByName('THANH_TOÁN').getRange('D2:D500')].forEach(function (range) { range.setNumberFormat('#,##0 "₫"'); });
  [quoteLines.getRange('H2:I500'), ss.getSheetByName('SẢN_PHẨM').getRange('F2:F500')].forEach(function (range) { range.setNumberFormat('0.00%'); });
}

function applyQuoteUnitPricesKD_(ss) {
  const quoteSheet = ss.getSheetByName('BÁO_GIÁ');
  const quoteLines = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
  if (!quoteLines) return;
  const quoteStatuses = quoteSheet && quoteSheet.getLastRow() >= 2
    ? Object.fromEntries(quoteSheet.getRange(2, 1, quoteSheet.getLastRow() - 1, 8).getValues().map(function (row) { return [String(row[0]), String(row[7] || '')]; }))
    : {};
  const lastRow = quoteLines.getLastRow();
  if (lastRow >= 2) {
    const lines = quoteLines.getRange(2, 1, lastRow - 1, 7).getValues();
    for (let i = 0; i < lines.length; i++) {
      const qId = String(lines[i][1]);
      const status = quoteStatuses[qId];
      const hasFixedPrice = lines[i][6] !== '' && lines[i][6] !== null && !isNaN(Number(lines[i][6]));
      if (status && status !== 'NHÁP') {
        if (!hasFixedPrice) chotDonGiaBaoGiaKD_(ss, qId);
      } else {
        if (!hasFixedPrice) {
          quoteLines.getRange(i + 2, 7).setFormulaR1C1('=IF(RC[-4]="";"";IFNA(VLOOKUP(RC[-4];\'SẢN_PHẨM\'!C1:C7;4;FALSE);""))');
        }
      }
    }
  }
  if (KD_MAX_ROWS > lastRow) {
    quoteLines.getRange(Math.max(2, lastRow + 1), 7, KD_MAX_ROWS - Math.max(2, lastRow + 1) + 1, 1)
      .setFormulaR1C1('=IF(RC[-4]="";"";IFNA(VLOOKUP(RC[-4];\'SẢN_PHẨM\'!C1:C7;4;FALSE);""))');
  }
}

function clearUnexpectedDiscountFormulasKD_(quoteLines) {
  const range = quoteLines.getRange('H2:H500');
  const formulas = range.getFormulas();
  formulas.forEach(function (row, index) {
    if (row[0]) quoteLines.getRange(index + 2, 8).clearContent();
  });
}

function buildStartKD_(ss, mode) {
  const sheet = ss.getSheetByName('BẮT_ĐẦU');
  const properties = PropertiesService.getDocumentProperties();
  const sourceCommit = properties.getProperty('KD_SOURCE_COMMIT') || 'Không khai báo trong runtime';
  const rows = [
    ['QUẢN LÝ BÁO GIÁ VÀ ĐƠN HÀNG', '3.0.0-vi'],
    ['Trạng thái', 'Đã cài đặt'],
    ['Chế độ', mode],
    ['Mức xác minh', 'local_verified'],
    ['G2 Google Sheets/Apps Script', 'BLOCKED_EXTERNAL'],
    ['Source commit', sourceCommit],
    ['Tình trạng nguồn', 'Sạch khi đóng gói'],
    ['Hướng dẫn', 'Dùng menu Báo giá & Đơn hàng để kiểm tra hệ thống, sao lưu hoặc làm sạch dữ liệu.']
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows).setWrap(true).setFontFamily('Arial');
  sheet.getRange('A1:B1').setBackground('#1F4E78').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(14);
  sheet.getRange('A2:A8').setFontWeight('bold').setBackground('#ECEFF1');
  sheet.setColumnWidth(1, 220); sheet.setColumnWidth(2, 560); sheet.setFrozenRows(1); sheet.setHiddenGridlines(true);
}

function protectFormulaRangesKD_(ss) {
  const ranges = [
    ['CHI_TIẾT_BÁO_GIÁ', 'D2:E500'], ['CHI_TIẾT_BÁO_GIÁ', 'G2:G500'], ['CHI_TIẾT_BÁO_GIÁ', 'I2:N500'],
    ['BÁO_GIÁ', 'H2:J500'], ['BÁO_GIÁ', 'L2:Q500'], ['CHI_TIẾT_ĐƠN_HÀNG', 'D2:E500'], ['CHI_TIẾT_ĐƠN_HÀNG', 'H2:K500'], ['ĐƠN_HÀNG', 'G2:K500'], ['ĐƠN_HÀNG', 'M2:O500']
  ];
  ranges.forEach(function (item) {
    const range = ss.getSheetByName(item[0]).getRange(item[1]);
    const existing = range.getProtections(SpreadsheetApp.ProtectionType.RANGE).find(function (p) { return p.getDescription() === 'Cột công thức KD'; });
    if (!existing) range.protect().setDescription('Cột công thức KD').setWarningOnly(true);
  });
}

function protectAdminSheetsKD_(ss) {
  ['CẤU_HÌNH', 'NGƯỜI_DÙNG'].forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    let protection = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).find(function (item) { return item.getDescription() === 'Quản trị KD — chỉ chủ cài đặt'; });
    if (!protection) protection = sheet.protect().setDescription('Quản trị KD — chỉ chủ cài đặt');
    protection.setWarningOnly(false);
    const effectiveUser = Session.getEffectiveUser();
    protection.addEditor(effectiveUser);
    const removable = protection.getEditors().filter(function (editor) { return editor.getEmail() !== effectiveUser.getEmail(); });
    if (removable.length) protection.removeEditors(removable);
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
  });
}

function seedDemoKD_(ss) {
  const data = demoDataKD_();
  Object.keys(data).forEach(function (tab) {
    const sheet = ss.getSheetByName(tab);
    if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getMaxColumns()).clearContent();
    if (data[tab].length) sheet.getRange(2, 1, data[tab].length, data[tab][0].length).setValues(data[tab].map(function (row) { return row.map(sanitizeKD_); }));
  });
}

function demoDataKD_() {
  return {
    'CẤU_HÌNH': [['THUE_SUAT_MAC_DINH', '0.08', 'Thuế suất mặc định'], ['TIEN_TE', 'VND', 'Đơn vị tiền tệ'], ['SO_NGAY_HIEU_LUC', '15', 'Số ngày hiệu lực báo giá'], ['TACH_VAI_TRO_DUYET', 'TRUE', 'Không cho người tạo tự duyệt báo giá']],
    'NGƯỜI_DÙNG': [['NV-001', 'Nguyễn Minh An', 'TRƯỞNG PHÒNG', 'truong.phong@example.invalid'], ['NV-002', 'Trần Hoài Phương', 'SALES ADMIN', 'sales.admin@example.invalid'], ['NV-003', 'Lê Gia Hân', 'KINH DOANH', 'kinh.doanh.1@example.invalid'], ['NV-004', 'Phạm Quốc Bảo', 'KINH DOANH', 'kinh.doanh.2@example.invalid'], ['NV-005', 'Vũ Thu Hà', 'KẾ TOÁN', 'ke.toan@example.invalid'], ['NV-006', 'Đỗ Hải Nam', 'GIAO NHẬN', 'giao.nhan@example.invalid']],
    'KHÁCH_HÀNG': [['KH-001', 'Công ty Sao Khuê', 'DOANH NGHIỆP', 'Hà Nội', 'NV-003', 'ĐANG HOẠT ĐỘNG'], ['KH-002', 'Hộ kinh doanh Mây Việt', 'HỘ KINH DOANH', 'Đà Nẵng', 'NV-004', 'ĐANG HOẠT ĐỘNG'], ['KH-003', 'Công ty Ánh Dương', 'DOANH NGHIỆP', 'Hải Phòng', 'NV-003', 'ĐANG HOẠT ĐỘNG'], ['KH-004', 'Cửa hàng Gió Mới', 'HỘ KINH DOANH', 'Cần Thơ', 'NV-004', 'ĐANG HOẠT ĐỘNG'], ['KH-005', 'Công ty Trúc Xanh', 'DOANH NGHIỆP', 'Bình Dương', 'NV-003', 'ĐANG HOẠT ĐỘNG'], ['KH-006', 'Xưởng Mộc Bình Minh', 'HỘ KINH DOANH', 'Lâm Đồng', 'NV-004', 'ĐANG HOẠT ĐỘNG']],
    'SẢN_PHẨM': [['SP-001', 'Gói tư vấn khởi động', 'Gói', 100000, 60000, 0.08, 'ĐANG KINH DOANH'], ['SP-002', 'Bộ biểu mẫu bán hàng', 'Bộ', 250000, 120000, 0.08, 'ĐANG KINH DOANH'], ['SP-003', 'Dịch vụ cấu hình dữ liệu', 'Gói', 400000, 220000, 0.08, 'ĐANG KINH DOANH'], ['SP-004', 'Giờ đào tạo vận hành', 'Giờ', 150000, 70000, 0.08, 'ĐANG KINH DOANH'], ['SP-005', 'Gói hỗ trợ tiêu chuẩn', 'Tháng', 300000, 140000, 0.08, 'ĐANG KINH DOANH'], ['SP-006', 'Gói hỗ trợ nâng cao', 'Tháng', 500000, 240000, 0.08, 'ĐANG KINH DOANH'], ['SP-007', 'Báo cáo quản trị tùy chỉnh', 'Gói', 600000, 320000, 0.08, 'ĐANG KINH DOANH'], ['SP-008', 'Buổi rà soát quy trình', 'Gói', 200000, 90000, 0.08, 'ĐANG KINH DOANH']],
    'BÁO_GIÁ': [['BG-001-R1', 'BG-001', 1, false, 'KH-001', new Date('2026-08-01'), new Date('2026-08-15'), 'ĐÃ DUYỆT', '', '', 'NV-003', 3, 'NV-003', 'NV-001', new Date('2026-08-02'), '', new Date('2026-08-02')], ['BG-001-R2', 'BG-001', 2, true, 'KH-001', new Date('2026-08-05'), new Date('2026-08-20'), 'CHẤP NHẬN', '', '', 'NV-003', 6, 'NV-003', 'NV-001', new Date('2026-08-06'), '', new Date('2026-08-08')], ['BG-002-R1', 'BG-002', 1, true, 'KH-002', new Date('2026-08-12'), new Date('2026-08-26'), 'TỪ CHỐI', '', '', 'NV-004', 3, 'NV-004', 'NV-002', new Date('2026-08-13'), 'Ngân sách chưa phù hợp', new Date('2026-08-13')], ['BG-003-R1', 'BG-003', 1, true, 'KH-003', new Date('2026-09-01'), new Date('2026-09-15'), 'HẾT HẠN', '', '', 'NV-003', 5, 'NV-003', 'NV-001', new Date('2026-09-02'), '', new Date('2026-09-16')], ['BG-004-R1', 'BG-004', 1, true, 'KH-004', new Date('2026-09-20'), new Date('2026-10-04'), 'CHỜ DUYỆT', '', '', 'NV-004', 2, 'NV-004', '', '', '', new Date('2026-09-20')], ['BG-005-R1', 'BG-005', 1, true, 'KH-005', new Date('2026-09-25'), new Date('2026-10-10'), 'NHÁP', '', '', 'NV-003', 1, 'NV-003', '', '', '', new Date('2026-09-25')]],
    'CHI_TIẾT_BÁO_GIÁ': [['DBG-001', 'BG-001-R1', 'SP-001', '', '', 2, 100000, 0.1, '', '', '', '', '', ''], ['DBG-002', 'BG-001-R1', 'SP-002', '', '', 1, 250000, 0, '', '', '', '', '', ''], ['DBG-003', 'BG-001-R2', 'SP-001', '', '', 2, 100000, 0.1, '', '', '', '', '', ''], ['DBG-004', 'BG-001-R2', 'SP-003', '', '', 1, 400000, 0, '', '', '', '', '', ''], ['DBG-005', 'BG-002-R1', 'SP-004', '', '', 4, 150000, 0.05, '', '', '', '', '', ''], ['DBG-006', 'BG-002-R1', 'SP-005', '', '', 1, 300000, 0, '', '', '', '', '', ''], ['DBG-007', 'BG-003-R1', 'SP-006', '', '', 1, 500000, 0.1, '', '', '', '', '', ''], ['DBG-009', 'BG-004-R1', 'SP-002', '', '', 2, 250000, 0, '', '', '', '', '', ''], ['DBG-011', 'BG-005-R1', 'SP-003', '', '', 1, 400000, 0, '', '', '', '', '', '']],
    'ĐƠN_HÀNG': [['DH-001', 'BG-001-R2', 'KH-001', new Date('2026-08-21'), new Date('2026-09-20'), 'TRỰC TIẾP', '', '', '', '', 'XÁC NHẬN', 'NV-003', 2, 'NV-003', new Date('2026-08-21')], ['DH-002', '', 'KH-002', new Date('2026-09-05'), new Date('2026-10-05'), 'ĐIỆN THOẠI', '', '', '', '', 'ĐANG GIAO', 'NV-004', 3, 'NV-004', new Date('2026-09-20')], ['DH-003', '', 'KH-003', new Date('2026-08-10'), new Date('2026-09-10'), 'ĐỐI TÁC', '', '', '', '', 'HOÀN TẤT', 'NV-003', 4, 'NV-003', new Date('2026-08-25')], ['DH-004', '', 'KH-004', new Date('2026-09-18'), new Date('2026-10-18'), 'WEBSITE', '', '', '', '', 'HỦY', 'NV-004', 2, 'NV-004', new Date('2026-09-19')], ['DH-005', '', 'KH-006', new Date('2026-08-15'), new Date('2026-09-15'), 'TRỰC TIẾP', '', '', '', '', 'GIAO MỘT PHẦN', 'NV-003', 4, 'NV-003', new Date('2026-09-10')]],
    'CHI_TIẾT_ĐƠN_HÀNG': [['DDH-001', 'DH-001', 'SP-003', '', '', 2, 400000, '', '', '', ''], ['DDH-002', 'DH-002', 'SP-001', '', '', 10, 100000, '', '', '', ''], ['DDH-003', 'DH-002', 'SP-004', '', '', 2, 150000, '', '', '', ''], ['DDH-004', 'DH-003', 'SP-006', '', '', 1, 500000, '', '', '', ''], ['DDH-005', 'DH-003', 'SP-008', '', '', 1, 200000, '', '', '', ''], ['DDH-006', 'DH-004', 'SP-002', '', '', 1, 250000, '', '', '', ''], ['DDH-007', 'DH-005', 'SP-007', '', '', 1, 600000, '', '', '', ''], ['DDH-008', 'DH-005', 'SP-005', '', '', 1, 300000, '', '', '', '']],
    'THANH_TOÁN': [['TT-001', 'DH-001', new Date('2026-09-01'), 500000, 'CHUYỂN KHOẢN', 'ĐÃ XÁC NHẬN'], ['TT-002', 'DH-002', new Date('2026-09-25'), 300000, 'CHUYỂN KHOẢN', 'CHỜ XÁC NHẬN'], ['TT-003', 'DH-003', new Date('2026-08-25'), 700000, 'TIỀN MẶT', 'ĐÃ XÁC NHẬN'], ['TT-005', 'DH-005', new Date('2026-09-10'), 200000, 'CHUYỂN KHOẢN', 'ĐÃ XÁC NHẬN']],
    'GIAO_HÀNG': [['GH-001', 'DH-002', new Date('2026-09-20'), 1, 'ĐÃ GIAO'], ['GH-002', 'DH-002', new Date('2026-09-27'), 2, 'ĐÃ GIAO']],
    'CHI_TIẾT_GIAO_HÀNG': [['DGH-001', 'GH-001', 'DDH-002', 6, 'ĐÃ GIAO'], ['DGH-002', 'GH-002', 'DDH-002', 4, 'ĐÃ GIAO']]
  };
}

function buildDashboardKD_(ss) {
  const sheet = ss.getSheetByName('DASHBOARD');
  const savedFilters = sheet.getMaxColumns() >= 8 ? sheet.getRangeList(['B3', 'D3', 'F3', 'H3', 'B4']).getRanges().map(function (range) { return range.getValue(); }) : ['', '', 'TẤT CẢ', 'TẤT CẢ', 'TẤT CẢ'];
  sheet.getDataRange().breakApart();
  sheet.clear();
  sheet.getCharts().forEach(function (chart) { sheet.removeChart(chart); });

  sheet.getRange('A1:B1').setValues([['DASHBOARD BÁO GIÁ VÀ ĐƠN HÀNG', 'Cập nhật động từ dữ liệu nguồn']]);
  sheet.getRange('A3:H4').setValues([
    ['Từ ngày', '', 'Đến ngày', '', 'Trạng thái báo giá', 'TẤT CẢ', 'Trạng thái đơn', 'TẤT CẢ'],
    ['Người phụ trách', 'TẤT CẢ', '', '', '', '', '', '']
  ]);
  sheet.getRange('B3').setValue(savedFilters[0] || '');
  sheet.getRange('D3').setValue(savedFilters[1] || '');
  sheet.getRange('F3').setValue(savedFilters[2] || 'TẤT CẢ');
  sheet.getRange('H3').setValue(savedFilters[3] || 'TẤT CẢ');
  sheet.getRange('B4').setValue(savedFilters[4] || 'TẤT CẢ');

  const orderScope = '(\'ĐƠN_HÀNG\'!A2:A500<>"")' +
    '*(\'ĐƠN_HÀNG\'!D2:D500>=IF(B3="";DATE(1900;1;1);B3))' +
    '*(\'ĐƠN_HÀNG\'!D2:D500<=IF(D3="";DATE(2999;12;31);D3))' +
    '*IF(H3="TẤT CẢ";1;--(\'ĐƠN_HÀNG\'!K2:K500=H3))' +
    '*IF(B4="TẤT CẢ";1;--(\'ĐƠN_HÀNG\'!L2:L500=B4))';
  const activeOrderFilter = orderScope + '*(\'ĐƠN_HÀNG\'!K2:K500<>"HỦY")';
  const quoteScope = '(\'BÁO_GIÁ\'!A2:A500<>"")' +
    '*(\'BÁO_GIÁ\'!F2:F500>=IF(B3="";DATE(1900;1;1);B3))' +
    '*(\'BÁO_GIÁ\'!F2:F500<=IF(D3="";DATE(2999;12;31);D3))' +
    '*(\'BÁO_GIÁ\'!D2:D500=TRUE)' +
    '*IF(F3="TẤT CẢ";1;--(\'BÁO_GIÁ\'!H2:H500=F3))' +
    '*IF(B4="TẤT CẢ";1;--(\'BÁO_GIÁ\'!K2:K500=B4))';
  const orderLineScope = '(\'CHI_TIẾT_ĐƠN_HÀNG\'!A2:A500<>"")' +
    '*(IFNA(VLOOKUP(\'CHI_TIẾT_ĐƠN_HÀNG\'!B2:B500;\'ĐƠN_HÀNG\'!A2:L500;4;FALSE);0)>=IF(B3="";DATE(1900;1;1);B3))' +
    '*(IFNA(VLOOKUP(\'CHI_TIẾT_ĐƠN_HÀNG\'!B2:B500;\'ĐƠN_HÀNG\'!A2:L500;4;FALSE);0)<=IF(D3="";DATE(2999;12;31);D3))' +
    '*IF(H3="TẤT CẢ";1;--(IFNA(VLOOKUP(\'CHI_TIẾT_ĐƠN_HÀNG\'!B2:B500;\'ĐƠN_HÀNG\'!A2:L500;11;FALSE);"")=H3))' +
    '*IF(B4="TẤT CẢ";1;--(IFNA(VLOOKUP(\'CHI_TIẾT_ĐƠN_HÀNG\'!B2:B500;\'ĐƠN_HÀNG\'!A2:L500;12;FALSE);"")=B4))';
  const kpis = [
    ['Chỉ số', 'Giá trị', 'Định nghĩa KPI'],
    ['Giá trị báo giá đã gửi', '=SUMPRODUCT(' + quoteScope + '*--(((\'BÁO_GIÁ\'!H2:H500="ĐÃ GỬI")+(\'BÁO_GIÁ\'!H2:H500="CHẤP NHẬN")+(\'BÁO_GIÁ\'!H2:H500="TỪ CHỐI")+(\'BÁO_GIÁ\'!H2:H500="HẾT HẠN"))>0)*\'BÁO_GIÁ\'!I2:I500)', 'Tổng giá trị báo giá đã gửi hoặc đã quyết định theo bộ lọc'],
    ['Tỷ lệ chuyển đổi', '=IFERROR(SUMPRODUCT(' + quoteScope + '*--(\'BÁO_GIÁ\'!H2:H500="CHẤP NHẬN"))/SUMPRODUCT(' + quoteScope + '*--(((\'BÁO_GIÁ\'!H2:H500="CHẤP NHẬN")+(\'BÁO_GIÁ\'!H2:H500="TỪ CHỐI")+(\'BÁO_GIÁ\'!H2:H500="HẾT HẠN"))>0));0)', 'Báo giá chấp nhận / báo giá đã quyết định theo bộ lọc'],
    ['Giá trị đơn hàng', '=SUMPRODUCT(' + activeOrderFilter + '*\'ĐƠN_HÀNG\'!G2:G500)', 'Tổng giá trị đơn không hủy theo bộ lọc'],
    ['Thực thu', '=SUMPRODUCT(' + activeOrderFilter + '*\'ĐƠN_HÀNG\'!H2:H500)', 'Chỉ thanh toán đã xác nhận theo bộ lọc'],
    ['Công nợ phải thu', '=SUMPRODUCT(' + activeOrderFilter + '*\'ĐƠN_HÀNG\'!I2:I500)', 'Giá trị đơn trừ thực thu đã xác nhận theo bộ lọc'],
    ['Đơn quá hạn', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!J2:J500="QUÁ HẠN"))', 'Đơn còn công nợ sau hạn thanh toán theo bộ lọc'],
    ['Đơn giao thiếu', '=SUMPRODUCT(' + orderLineScope + '*--(\'CHI_TIẾT_ĐƠN_HÀNG\'!J2:J500>0))', 'Dòng đơn còn số lượng phải giao theo bộ lọc'],
    ['Lợi nhuận gộp dự kiến', '=SUMPRODUCT(' + orderLineScope + '*\'CHI_TIẾT_ĐƠN_HÀNG\'!K2:K500)', 'Doanh thu dòng trừ giá vốn dự kiến theo bộ lọc'],
    ['Đơn hoàn tất', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500="HOÀN TẤT"))', 'Số đơn hoàn tất theo bộ lọc'],
    ['Đơn đang xử lý', '=SUMPRODUCT(' + orderScope + '*--(((\'ĐƠN_HÀNG\'!K2:K500="ĐANG GIAO")+(\'ĐƠN_HÀNG\'!K2:K500="GIAO MỘT PHẦN")+(\'ĐƠN_HÀNG\'!K2:K500="XÁC NHẬN"))>0))', 'Đơn chưa hoàn tất và chưa hủy theo bộ lọc'],
    ['Đơn hủy', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500="HỦY"))', 'Số đơn hủy theo bộ lọc'],
    ['Giá trị báo giá chấp nhận', '=SUMPRODUCT(' + quoteScope + '*--(\'BÁO_GIÁ\'!H2:H500="CHẤP NHẬN")*\'BÁO_GIÁ\'!I2:I500)', 'Giá trị báo giá đã chấp nhận theo bộ lọc']
  ];
  sheet.getRange(6, 1, kpis.length, 3).setValues(kpis);

  sheet.getRange('A21:B25').setValues([
    ['Kênh bán', 'Doanh số'],
    ['TRỰC TIẾP', '=SUMPRODUCT(' + activeOrderFilter + '*--(\'ĐƠN_HÀNG\'!F2:F500=A22)*\'ĐƠN_HÀNG\'!G2:G500)'],
    ['ĐIỆN THOẠI', '=SUMPRODUCT(' + activeOrderFilter + '*--(\'ĐƠN_HÀNG\'!F2:F500=A23)*\'ĐƠN_HÀNG\'!G2:G500)'],
    ['WEBSITE', '=SUMPRODUCT(' + activeOrderFilter + '*--(\'ĐƠN_HÀNG\'!F2:F500=A24)*\'ĐƠN_HÀNG\'!G2:G500)'],
    ['ĐỐI TÁC', '=SUMPRODUCT(' + activeOrderFilter + '*--(\'ĐƠN_HÀNG\'!F2:F500=A25)*\'ĐƠN_HÀNG\'!G2:G500)']
  ]);
  sheet.getRange('D21:E26').setValues([
    ['Trạng thái đơn', 'Số lượng'],
    ['XÁC NHẬN', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500=D22))'],
    ['ĐANG GIAO', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500=D23))'],
    ['GIAO MỘT PHẦN', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500=D24))'],
    ['HOÀN TẤT', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500=D25))'],
    ['HỦY', '=SUMPRODUCT(' + orderScope + '*--(\'ĐƠN_HÀNG\'!K2:K500=D26))']
  ]);
  sheet.getRange('G21:H22').setValues([
    ['Hiệu suất nhân viên', 'Doanh số'],
    ['=QUERY(\'ĐƠN_HÀNG\'!A:L;"select L,sum(G) where A is not null and K <> \'HỦY\' group by L label L \'Người phụ trách\', sum(G) \'Doanh số\'";1)', '']
  ]);
  sheet.getRange('J21:K22').setValues([
    ['Top sản phẩm', 'Doanh số'],
    ['=QUERY(\'CHI_TIẾT_ĐƠN_HÀNG\'!A:H;"select C,sum(H) where A is not null group by C order by sum(H) desc label C \'Mã sản phẩm\', sum(H) \'Doanh số\'";1)', '']
  ]);
  sheet.getRange('A32:B34').setValues([
    ['Xu hướng', 'Số lượng'],
    ['Báo giá đã quyết định', '=SUMPRODUCT(' + quoteScope + '*--(((\'BÁO_GIÁ\'!H2:H500="CHẤP NHẬN")+(\'BÁO_GIÁ\'!H2:H500="TỪ CHỐI")+(\'BÁO_GIÁ\'!H2:H500="HẾT HẠN"))>0))'],
    ['Đơn hàng không hủy', '=SUMPRODUCT(' + activeOrderFilter + ')']
  ]);

  const quoteStatusRule = SpreadsheetApp.newDataValidation().requireValueInList(['TẤT CẢ'].concat(KD_QUOTE_STATUS), true).setAllowInvalid(false).build();
  const orderStatusRule = SpreadsheetApp.newDataValidation().requireValueInList(['TẤT CẢ'].concat(KD_ORDER_STATUS), true).setAllowInvalid(false).build();
  const users = ss.getSheetByName('NGƯỜI_DÙNG').getRange('A2:A500').getDisplayValues().flat().filter(String);
  const userRule = SpreadsheetApp.newDataValidation().requireValueInList(['TẤT CẢ'].concat(Array.from(new Set(users))), true).setAllowInvalid(false).build();
  sheet.getRange('F3').setDataValidation(quoteStatusRule);
  sheet.getRange('H3').setDataValidation(orderStatusRule);
  sheet.getRange('B4').setDataValidation(userRule);

  sheet.getRange('A1:F1').setBackground('#1F4E78').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(14);
  sheet.getRange('A3:H4').setBackground('#FFF9D6');
  sheet.getRange('A6:C6').setBackground('#ECEFF1').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('B7:B18').setBackground('#E3F2FD').setFontWeight('bold');
  sheet.getRangeList(['A21:B21', 'D21:E21', 'G21:H21', 'J21:K21', 'A32:B32']).setBackground('#ECEFF1').setFontWeight('bold');
  sheet.getRange('B7').setNumberFormat('#,##0 "₫"');
  sheet.getRange('B8').setNumberFormat('0.00%');
  sheet.getRangeList(['B9:B11', 'B14', 'B18', 'B22:B25', 'H22:H30', 'K22:K30']).setNumberFormat('#,##0 "₫"');
  sheet.getRange('A1:K40').setFontFamily('Arial').setVerticalAlignment('middle');
  sheet.setFrozenRows(6);
  sheet.setHiddenGridlines(true);
  sheet.setColumnWidth(1, 220); sheet.setColumnWidth(2, 160); sheet.setColumnWidth(3, 380);

  const channelChart = sheet.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sheet.getRange('A21:B25')).setPosition(1, 13, 0, 0).setOption('title', 'Doanh số theo kênh').setOption('legend', { position: 'none' }).build();
  const statusChart = sheet.newChart().setChartType(Charts.ChartType.PIE).addRange(sheet.getRange('D21:E26')).setPosition(19, 13, 0, 0).setOption('title', 'Cơ cấu trạng thái đơn').build();
  const trendChart = sheet.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sheet.getRange('A32:B34')).setPosition(37, 13, 0, 0).setOption('title', 'Chuyển đổi báo giá → đơn hàng').setOption('legend', { position: 'none' }).build();
  sheet.insertChart(channelChart); sheet.insertChart(statusChart); sheet.insertChart(trendChart);
}

function validateRefsKD_(ss) {
  const errors = [];
  const ids = function (tab) { const s = ss.getSheetByName(tab); return new Set(s.getLastRow() < 2 ? [] : s.getRange(2, 1, s.getLastRow() - 1, 1).getDisplayValues().flat().filter(String)); };
  const customers = ids('KHÁCH_HÀNG'); const products = ids('SẢN_PHẨM'); const quotes = ids('BÁO_GIÁ'); const orders = ids('ĐƠN_HÀNG'); const orderLines = ids('CHI_TIẾT_ĐƠN_HÀNG'); const deliveries = ids('GIAO_HÀNG');
  checkRefColumnKD_(ss.getSheetByName('BÁO_GIÁ'), 5, customers, 'BÁO_GIÁ.Mã khách hàng', errors);
  checkRefColumnKD_(ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ'), 2, quotes, 'CHI_TIẾT_BÁO_GIÁ.Mã báo giá', errors);
  checkRefColumnKD_(ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ'), 3, products, 'CHI_TIẾT_BÁO_GIÁ.Mã sản phẩm', errors);
  checkRefColumnKD_(ss.getSheetByName('ĐƠN_HÀNG'), 3, customers, 'ĐƠN_HÀNG.Mã khách hàng', errors);
  checkRefColumnKD_(ss.getSheetByName('CHI_TIẾT_ĐƠN_HÀNG'), 2, orders, 'CHI_TIẾT_ĐƠN_HÀNG.Mã đơn hàng', errors);
  checkRefColumnKD_(ss.getSheetByName('GIAO_HÀNG'), 2, orders, 'GIAO_HÀNG.Mã đơn hàng', errors);
  checkRefColumnKD_(ss.getSheetByName('CHI_TIẾT_GIAO_HÀNG'), 2, deliveries, 'CHI_TIẾT_GIAO_HÀNG.Mã giao hàng', errors);
  checkRefColumnKD_(ss.getSheetByName('CHI_TIẾT_GIAO_HÀNG'), 3, orderLines, 'CHI_TIẾT_GIAO_HÀNG.Mã dòng đơn hàng', errors);
  checkRefColumnKD_(ss.getSheetByName('THANH_TOÁN'), 2, orders, 'THANH_TOÁN.Mã đơn hàng', errors);
  return errors;
}

function checkRefColumnKD_(sheet, column, allowed, label, errors) {
  if (sheet.getLastRow() < 2) return;
  sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getDisplayValues().flat().filter(String).forEach(function (value) { if (!allowed.has(value)) errors.push(label + ': ' + value); });
}

function validateDeliveryRulesKD_(ss) {
  const errors = [];
  const read = function (name, width) {
    const sheet = ss.getSheetByName(name);
    return !sheet || sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues().filter(function (row) { return row[0]; });
  };
  const orders = Object.fromEntries(read('ĐƠN_HÀNG', 15).map(function (row) { return [String(row[0]), { status: row[10] }]; }));
  const orderLines = Object.fromEntries(read('CHI_TIẾT_ĐƠN_HÀNG', 11).map(function (row) { return [String(row[0]), { orderId: String(row[1]), ordered: Number(row[5] || 0) }]; }));
  const deliveries = Object.fromEntries(read('GIAO_HÀNG', 5).map(function (row) { return [String(row[0]), { orderId: String(row[1]), status: row[4] }]; }));
  const delivered = {};
  read('CHI_TIẾT_GIAO_HÀNG', 5).forEach(function (row) {
    const delivery = deliveries[String(row[1])];
    const orderLine = orderLines[String(row[2])];
    if (!delivery || !orderLine) return;
    if (delivery.orderId !== orderLine.orderId) errors.push('Dòng giao ' + row[0] + ' không cùng đơn hàng với phiếu giao.');
    if (orders[delivery.orderId] && orders[delivery.orderId].status === 'HỦY') errors.push('Đơn hủy không được phát sinh giao hàng: ' + delivery.orderId);
    if (Number(row[3] || 0) <= 0) errors.push('Số lượng giao phải lớn hơn 0: ' + row[0]);
    if (row[4] === 'ĐÃ GIAO' && delivery.status !== 'HỦY') delivered[String(row[2])] = (delivered[String(row[2])] || 0) + Number(row[3] || 0);
  });
  Object.keys(delivered).forEach(function (lineId) { if (delivered[lineId] > orderLines[lineId].ordered) errors.push('Tổng giao vượt số lượng đặt: ' + lineId); });
  return errors;
}

function validatePaymentRulesKD_(ss) {
  const errors = [];
  const read = function (name, width) {
    const sheet = ss.getSheetByName(name);
    return !sheet || sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues().filter(function (row) { return row[0]; });
  };
  const orders = Object.fromEntries(read('ĐƠN_HÀNG', 15).map(function (row) { return [String(row[0]), { status: row[10], total: Number(row[6] || 0) }]; }));
  const orderLines = read('CHI_TIẾT_ĐƠN_HÀNG', 8);
  const orderTotals = {};
  orderLines.forEach(function (row) {
    const orderId = String(row[1]);
    orderTotals[orderId] = (orderTotals[orderId] || 0) + (Number(row[5] || 0) * Number(row[6] || 0));
  });
  const paidByOrder = {};
  read('THANH_TOÁN', 6).forEach(function (row) {
    const paymentId = String(row[0]);
    const orderId = String(row[1]);
    const amount = Number(row[3] || 0);
    const status = String(row[5] || '');
    if (!orders[orderId]) return;
    if (orders[orderId].status === 'HỦY') {
      errors.push('Đơn hủy không được phát sinh thanh toán: ' + orderId);
    }
    if (amount <= 0) {
      errors.push('Số tiền thanh toán phải lớn hơn 0: ' + paymentId);
    }
    if (status === 'ĐÃ XÁC NHẬN') {
      paidByOrder[orderId] = (paidByOrder[orderId] || 0) + amount;
    }
  });
  Object.keys(paidByOrder).forEach(function (orderId) {
    const expectedTotal = orderTotals[orderId] !== undefined ? orderTotals[orderId] : (orders[orderId] ? orders[orderId].total : 0);
    if (expectedTotal > 0 && paidByOrder[orderId] > expectedTotal) {
      errors.push('Tổng thanh toán vượt giá trị đơn hàng: ' + orderId);
    }
  });
  return errors;
}

function backupKD_(ss, reason) {
  const name = '__SAO_LƯU_KD';
  const sheet = ensureSheetKD_(ss, name); sheet.hideSheet();
  const data = KD_TABS.map(function (tab) {
    const source = ss.getSheetByName(tab);
    const lastRow = lastMeaningfulRowKD_(source);
    const lastColumn = Math.max(1, source.getLastColumn());
    const range = source.getRange(1, 1, lastRow, lastColumn);
    return { name: tab, values: range.getValues(), formulas: range.getFormulas() };
  });
  const payload = JSON.stringify(data);
  const id = 'SAO-LUU-' + Utilities.getUuid();
  const chunks = chunkStringKD_(payload, 40000);
  const digest = checksumKD_(payload);
  const createdAt = new Date();
  const rows = chunks.map(function (chunk, index) { return [id, createdAt, reason, digest, index + 1, chunks.length, chunk]; });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  return id;
}

function lastMeaningfulRowKD_(sheet) {
  const lastRow = Math.max(1, sheet.getLastRow());
  const values = sheet.getRange(1, 1, lastRow, 1).getDisplayValues();
  for (let index = values.length - 1; index >= 0; index -= 1) if (String(values[index][0]).trim()) return index + 1;
  return 1;
}

function chunkStringKD_(value, size) {
  if (!Number.isInteger(size) || size < 1) throw new Error('Kích thước chunk sao lưu không hợp lệ.');
  const chunks = [];
  for (let index = 0; index < value.length; index += size) chunks.push(value.slice(index, index + size));
  return chunks.length ? chunks : [''];
}

function readLatestBackupKD_(rows) {
  if (!rows.length) throw new Error('Chưa có bản sao lưu để khôi phục.');
  const latestRow = rows[rows.length - 1];
  const id = latestRow[0];
  const matching = rows.filter(function (row) { return row[0] === id; });
  if (!latestRow[5]) return { id: id, checksum: latestRow[3], payload: latestRow[4] };
  const expectedCount = Number(latestRow[5]);
  if (matching.length !== expectedCount) throw new Error('Bản sao lưu thiếu chunk dữ liệu.');
  matching.sort(function (a, b) { return Number(a[4]) - Number(b[4]); });
  matching.forEach(function (row, index) {
    if (Number(row[4]) !== index + 1 || Number(row[5]) !== expectedCount || row[3] !== latestRow[3]) throw new Error('Thứ tự chunk sao lưu không hợp lệ.');
  });
  return { id: id, checksum: latestRow[3], payload: matching.map(function (row) { return row[6]; }).join('') };
}

function reviveBackupValueKD_(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ? new Date(value) : value;
}

function checksumKD_(payload) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload, Utilities.Charset.UTF_8).map(function (item) { const value = item < 0 ? item + 256 : item; return ('0' + value.toString(16)).slice(-2); }).join('');
}

function sanitizeKD_(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value;
}

function logKD_(ss, action, entity, detail, entityId) {
  const sheet = ss.getSheetByName('NHẬT_KÝ');
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 6).setValues([[Utilities.getUuid(), new Date(), action, entity, String(entityId || '').slice(0, 80), String(detail || '').replace(/[\r\n]/g, ' ').slice(0, 500)]]);
}
