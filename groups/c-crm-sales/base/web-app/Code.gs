/**
 * GROUP-C-SALES-CORE — Web App Template đầu tiên
 * Pilot: GS-007 — Quản lý Báo giá
 * Runtime: Google Apps Script V8, container-bound với workbook Nhóm C.
 *
 * Trước khi deploy:
 * 1. Import GROUP-C-SALES-CORE-1.0.0-vi.xlsx thành Google Sheets.
 * 2. Chạy setupFirstWebAppTemplate() một lần trong Apps Script Editor.
 * 3. Deploy Web app với "Execute as: User accessing the web app" và yêu cầu đăng nhập.
 */

const WEB_APP_VERSION = '1.0.0-vi';
const WEB_APP_TIMEZONE = 'Asia/Ho_Chi_Minh';
const WEB_MAX_LINES = 50;

const WEB_REQUIRED_HEADERS = Object.freeze({
  'NGƯỜI_DÙNG': ['Mã nhân viên', 'Tên nhân viên', 'Vai trò', 'Email đăng nhập'],
  'KHÁCH_HÀNG': ['Mã khách hàng', 'Tên khách hàng', 'Nhóm khách hàng', 'Khu vực', 'Người phụ trách', 'Trạng thái'],
  'SẢN_PHẨM': ['Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Đơn giá', 'Giá vốn', 'Thuế suất', 'Trạng thái'],
  'BÁO_GIÁ': ['Mã báo giá revision', 'Mã báo giá', 'Revision', 'Là revision mới nhất', 'Mã khách hàng', 'Ngày báo giá', 'Hạn hiệu lực', 'Trạng thái', 'Tổng thanh toán', 'Cảnh báo', 'Người phụ trách', 'Phiên bản dòng', 'Người tạo', 'Người duyệt', 'Thời điểm duyệt', 'Lý do từ chối', 'Cập nhật lúc'],
  'CHI_TIẾT_BÁO_GIÁ': ['Mã dòng', 'Mã báo giá revision', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Tỷ lệ chiết khấu', 'Thuế suất', 'Thành tiền trước CK', 'Tiền chiết khấu', 'Giá trị sau CK', 'Tiền VAT', 'Tổng tiền dòng'],
  'ĐƠN_HÀNG': ['Mã đơn hàng', 'Mã báo giá revision', 'Mã khách hàng', 'Ngày đặt', 'Hạn thanh toán', 'Kênh bán', 'Tổng đơn hàng', 'Thực thu', 'Công nợ', 'Cảnh báo', 'Trạng thái', 'Người phụ trách', 'Phiên bản dòng', 'Người tạo', 'Cập nhật lúc'],
  'CHI_TIẾT_ĐƠN_HÀNG': ['Mã dòng', 'Mã đơn hàng', 'Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Tổng tiền dòng', 'Đã giao', 'Còn phải giao', 'Lợi nhuận gộp dự kiến'],
  'NHẬT_KÝ': ['Mã bằng chứng', 'Thời điểm', 'Thao tác', 'Thực thể', 'Mã thực thể', 'Chi tiết đã che']
});

const WEB_QUOTE_TRANSITIONS = Object.freeze({
  'NHÁP': ['CHỜ DUYỆT'],
  'CHỜ DUYỆT': ['ĐÃ DUYỆT', 'TỪ CHỐI', 'NHÁP'],
  'ĐÃ DUYỆT': ['ĐÃ GỬI'],
  'ĐÃ GỬI': ['CHẤP NHẬN', 'TỪ CHỐI', 'HẾT HẠN'],
  'CHẤP NHẬN': [],
  'TỪ CHỐI': [],
  'HẾT HẠN': []
});

const WEB_ROLES = Object.freeze({
  ADMIN: ['TRƯỞNG PHÒNG', 'SALES ADMIN'],
  SALES: ['TRƯỞNG PHÒNG', 'SALES ADMIN', 'KINH DOANH']
});

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Quản lý Báo giá')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Chạy một lần trong Apps Script Editor trước khi deploy. Không xóa dữ liệu. */
function setupFirstWebAppTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Hãy mở Apps Script từ chính file Google Sheets cần triển khai.');
  assertWorkbookContractWeb_(ss);
  ss.setSpreadsheetLocale('vi_VN');
  ss.setSpreadsheetTimeZone(WEB_APP_TIMEZONE);
  PropertiesService.getDocumentProperties().setProperties({
    WEB_SPREADSHEET_ID: ss.getId(),
    WEB_APP_VERSION: WEB_APP_VERSION,
    WEB_APP_SETUP_AT: new Date().toISOString()
  });
  const owner = registerCurrentOwnerWeb_(ss);
  logWeb_(ss, 'THIẾT LẬP WEB APP', 'HỆ_THỐNG', 'GROUP-C-SALES-CORE@' + WEB_APP_VERSION, {
    actorId: owner.id,
    version: WEB_APP_VERSION
  });
  return {
    ok: true,
    spreadsheetId: ss.getId(),
    owner: owner,
    next: 'Deploy Web app với Execute as: User accessing the web app.'
  };
}

/** Kiểm tra nhanh trong Apps Script Editor trước khi deploy. */
function healthCheckWebApp() {
  const ss = getSpreadsheetWeb_();
  assertWorkbookContractWeb_(ss);
  const result = {
    ok: true,
    version: WEB_APP_VERSION,
    spreadsheetId: ss.getId(),
    locale: ss.getSpreadsheetLocale(),
    timezone: ss.getSpreadsheetTimeZone(),
    sheets: Object.keys(WEB_REQUIRED_HEADERS),
    checkedAt: new Date().toISOString()
  };
  console.log(JSON.stringify(result));
  return result;
}

/** API tải dữ liệu ban đầu cho giao diện. */
function getBootstrapData() {
  const ss = getSpreadsheetWeb_();
  assertWorkbookContractWeb_(ss);
  const actor = getActorWeb_(ss, false);
  requireRoleWeb_(actor, WEB_ROLES.SALES, 'truy cập Web App báo giá');
  const customers = readObjectsWeb_(ss, 'KHÁCH_HÀNG')
    .filter(function (item) { return normalizeWeb_(item['Trạng thái']) !== 'NGỪNG HOẠT ĐỘNG'; })
    .map(function (item) {
      return {
        id: String(item['Mã khách hàng'] || ''),
        name: String(item['Tên khách hàng'] || ''),
        ownerId: String(item['Người phụ trách'] || '')
      };
    });
  const products = readObjectsWeb_(ss, 'SẢN_PHẨM')
    .filter(function (item) { return normalizeWeb_(item['Trạng thái']) !== 'NGỪNG KINH DOANH'; })
    .map(function (item) {
      return {
        id: String(item['Mã sản phẩm'] || ''),
        name: String(item['Tên sản phẩm'] || ''),
        unit: String(item['Đơn vị tính'] || ''),
        price: numberWeb_(item['Đơn giá'], 'Đơn giá'),
        cost: numberWeb_(item['Giá vốn'], 'Giá vốn'),
        vatRate: rateWeb_(item['Thuế suất'], 'Thuế suất')
      };
    });
  const quotes = listQuotesWeb_(ss, actor, 100);
  return {
    ok: true,
    app: { name: 'Quản lý Báo giá', version: WEB_APP_VERSION },
    actor: actor,
    permissions: {
      canCreate: WEB_ROLES.SALES.indexOf(actor.role) !== -1,
      canApprove: WEB_ROLES.ADMIN.indexOf(actor.role) !== -1
    },
    dashboard: buildDashboardWeb_(ss, actor),
    customers: customers,
    products: products,
    quotes: quotes
  };
}

/** API tạo báo giá mới với nhiều dòng. */
function createQuote(payload) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const ss = getSpreadsheetWeb_();
    const actor = getActorWeb_(ss, false);
    requireRoleWeb_(actor, WEB_ROLES.SALES, 'lập báo giá');
    const input = validateCreateQuoteWeb_(ss, payload);
    const now = new Date();
    const quoteNumber = nextSequenceIdWeb_('BG', now);
    const revisionId = quoteNumber + '-R1';
    const ownerId = input.ownerId || actor.id;
    const quoteSheet = ss.getSheetByName('BÁO_GIÁ');
    const lineSheet = ss.getSheetByName('CHI_TIẾT_BÁO_GIÁ');
    const quoteRow = quoteSheet.getLastRow() + 1;

    quoteSheet.getRange(quoteRow, 1, 1, 17).setValues([[
      revisionId, quoteNumber, 1, true, input.customer.id, now, input.expiryDate,
      'NHÁP', '', '', ownerId, 1, actor.id, '', '', '', now
    ].map(sanitizeCellWeb_)]);

    const lineRows = input.lines.map(function (line, index) {
      const totals = calculateLineWeb_(line.quantity, line.product.price, line.discountRate, line.product.vatRate);
      return [
        'DBG-' + quoteNumber.replace('BG-', '') + '-' + String(index + 1).padStart(2, '0'),
        revisionId,
        line.product.id,
        line.product.name,
        line.product.unit,
        line.quantity,
        line.product.price,
        line.discountRate,
        line.product.vatRate,
        totals.subtotal,
        totals.discountAmount,
        totals.netBeforeVat,
        totals.vatAmount,
        totals.total
      ];
    });
    lineSheet.getRange(lineSheet.getLastRow() + 1, 1, lineRows.length, 14)
      .setValues(lineRows.map(function (row) { return row.map(sanitizeCellWeb_); }));

    const total = lineRows.reduce(function (sum, row) { return sum + Number(row[13] || 0); }, 0);
    quoteSheet.getRange(quoteRow, 9).setValue(total).setNumberFormat('#,##0 "₫"');
    quoteSheet.getRange(quoteRow, 10).setFormulaR1C1('=IF(RC[-9]="";"";IF(AND(RC[-2]="ĐÃ GỬI";RC[-3]<TODAY());"HẾT HẠN";""))');
    quoteSheet.getRange(quoteRow, 6, 1, 2).setNumberFormat('dd/MM/yyyy');
    quoteSheet.getRange(quoteRow, 15).setNumberFormat('dd/MM/yyyy HH:mm');
    quoteSheet.getRange(quoteRow, 17).setNumberFormat('dd/MM/yyyy HH:mm');

    logWeb_(ss, 'TẠO BÁO GIÁ', 'BÁO_GIÁ', revisionId, {
      actorId: actor.id,
      customerId: input.customer.id,
      lineCount: lineRows.length,
      total: total,
      rowVersion: 1
    });
    SpreadsheetApp.flush();
    return { ok: true, quoteId: revisionId, quoteNumber: quoteNumber, total: total };
  } finally {
    lock.releaseLock();
  }
}

/** API xem một báo giá và các dòng chi tiết. */
function getQuoteDetails(revisionId) {
  const ss = getSpreadsheetWeb_();
  const actor = getActorWeb_(ss, false);
  const quote = findObjectWeb_(ss, 'BÁO_GIÁ', 'Mã báo giá revision', requiredTextWeb_(revisionId, 'Mã báo giá'));
  if (!quote) throw new Error('Không tìm thấy báo giá.');
  assertQuoteAccessWeb_(quote, actor);
  const customer = findObjectWeb_(ss, 'KHÁCH_HÀNG', 'Mã khách hàng', quote['Mã khách hàng']);
  const lines = readObjectsWeb_(ss, 'CHI_TIẾT_BÁO_GIÁ')
    .filter(function (item) { return String(item['Mã báo giá revision']) === String(revisionId); })
    .map(function (item) {
      return {
        id: String(item['Mã dòng'] || ''),
        productId: String(item['Mã sản phẩm'] || ''),
        productName: String(item['Tên sản phẩm'] || ''),
        unit: String(item['Đơn vị tính'] || ''),
        quantity: Number(item['Số lượng'] || 0),
        unitPrice: Number(item['Đơn giá'] || 0),
        discountRate: Number(item['Tỷ lệ chiết khấu'] || 0),
        vatRate: Number(item['Thuế suất'] || 0),
        total: Number(item['Tổng tiền dòng'] || 0)
      };
    });
  return {
    ok: true,
    quote: quoteViewWeb_(quote, customer, actor),
    lines: lines,
    total: lines.reduce(function (sum, item) { return sum + item.total; }, 0)
  };
}

/** API chuyển trạng thái báo giá, có kiểm tra RowVersion và vai trò. */
function transitionQuote(revisionId, targetStatus, expectedRowVersion, rejectionReason) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const ss = getSpreadsheetWeb_();
    const actor = getActorWeb_(ss, false);
    const sheet = ss.getSheetByName('BÁO_GIÁ');
    const rowIndex = findRowIndexWeb_(sheet, 1, requiredTextWeb_(revisionId, 'Mã báo giá'));
    if (rowIndex < 2) throw new Error('Không tìm thấy báo giá.');
    const row = sheet.getRange(rowIndex, 1, 1, 17).getValues()[0];
    assertQuoteAccessWeb_({ 'Người phụ trách': row[10], 'Người tạo': row[12] }, actor);
    const sourceStatus = normalizeWeb_(row[7]);
    const target = normalizeWeb_(requiredTextWeb_(targetStatus, 'Trạng thái đích'));
    const currentVersion = Number(row[11] || 1);
    if (currentVersion !== Number(expectedRowVersion)) throw new Error('Báo giá đã được người khác cập nhật. Hãy tải lại dữ liệu.');
    validateTransitionWeb_(sourceStatus, target, actor.role, String(row[12] || ''), actor.id, rejectionReason);

    const now = new Date();
    sheet.getRange(rowIndex, 8).setValue(target);
    sheet.getRange(rowIndex, 12).setValue(currentVersion + 1);
    sheet.getRange(rowIndex, 17).setValue(now);
    if (target === 'ĐÃ DUYỆT' || target === 'TỪ CHỐI') {
      sheet.getRange(rowIndex, 14, 1, 2).setValues([[actor.id, now]]);
    }
    sheet.getRange(rowIndex, 16).setValue(target === 'TỪ CHỐI' ? sanitizeCellWeb_(requiredTextWeb_(rejectionReason, 'Lý do từ chối')) : '');
    logWeb_(ss, 'CHUYỂN TRẠNG THÁI BÁO GIÁ', 'BÁO_GIÁ', revisionId, {
      actorId: actor.id,
      from: sourceStatus,
      to: target,
      rowVersionBefore: currentVersion,
      rowVersionAfter: currentVersion + 1,
      reason: target === 'TỪ CHỐI' ? String(rejectionReason).slice(0, 200) : ''
    });
    return { ok: true, quoteId: revisionId, status: target, rowVersion: currentVersion + 1 };
  } finally {
    lock.releaseLock();
  }
}

/** API chuyển báo giá đã chấp nhận thành đơn hàng. Chạy lại không tạo trùng. */
function convertQuoteToOrder(revisionId) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const ss = getSpreadsheetWeb_();
    const actor = getActorWeb_(ss, false);
    requireRoleWeb_(actor, WEB_ROLES.SALES, 'chuyển báo giá thành đơn');
    const quote = findObjectWeb_(ss, 'BÁO_GIÁ', 'Mã báo giá revision', requiredTextWeb_(revisionId, 'Mã báo giá'));
    if (!quote) throw new Error('Không tìm thấy báo giá.');
    assertQuoteAccessWeb_(quote, actor);
    if (normalizeWeb_(quote['Trạng thái']) !== 'CHẤP NHẬN' || quote['Là revision mới nhất'] !== true) {
      throw new Error('Chỉ revision mới nhất ở trạng thái CHẤP NHẬN được chuyển thành đơn.');
    }
    const existing = findObjectWeb_(ss, 'ĐƠN_HÀNG', 'Mã báo giá revision', revisionId);
    if (existing) return { ok: true, created: false, orderId: String(existing['Mã đơn hàng']) };

    const lines = readObjectsWeb_(ss, 'CHI_TIẾT_BÁO_GIÁ')
      .filter(function (item) { return String(item['Mã báo giá revision']) === String(revisionId); });
    if (!lines.length) throw new Error('Báo giá không có dòng chi tiết.');
    const now = new Date();
    const due = new Date(now.getTime());
    due.setDate(due.getDate() + 30);
    const orderId = nextSequenceIdWeb_('DH', now);
    const orderSheet = ss.getSheetByName('ĐƠN_HÀNG');
    const orderLineSheet = ss.getSheetByName('CHI_TIẾT_ĐƠN_HÀNG');
    const total = lines.reduce(function (sum, line) { return sum + Number(line['Tổng tiền dòng'] || 0); }, 0);
    orderSheet.appendRow([
      orderId, revisionId, quote['Mã khách hàng'], now, due, 'WEBSITE', total, 0, total, '',
      'MỚI', quote['Người phụ trách'] || actor.id, 1, actor.id, now
    ].map(sanitizeCellWeb_));

    const products = indexByWeb_(readObjectsWeb_(ss, 'SẢN_PHẨM'), 'Mã sản phẩm');
    const orderLines = lines.map(function (line, index) {
      const product = products[String(line['Mã sản phẩm'])] || {};
      const quantity = Number(line['Số lượng'] || 0);
      const unitPrice = Number(line['Đơn giá'] || 0);
      const lineTotal = Number(line['Tổng tiền dòng'] || 0);
      const expectedGrossProfit = lineTotal - quantity * Number(product['Giá vốn'] || 0);
      return [
        'DDH-' + orderId.replace('DH-', '') + '-' + String(index + 1).padStart(2, '0'),
        orderId,
        line['Mã sản phẩm'],
        line['Tên sản phẩm'],
        line['Đơn vị tính'],
        quantity,
        unitPrice,
        lineTotal,
        0,
        quantity,
        expectedGrossProfit
      ];
    });
    orderLineSheet.getRange(orderLineSheet.getLastRow() + 1, 1, orderLines.length, 11).setValues(orderLines);
    logWeb_(ss, 'CHUYỂN BÁO GIÁ THÀNH ĐƠN', 'ĐƠN_HÀNG', orderId, {
      actorId: actor.id,
      quoteRevisionId: revisionId,
      lineCount: orderLines.length,
      total: total
    });
    return { ok: true, created: true, orderId: orderId };
  } finally {
    lock.releaseLock();
  }
}

function getSpreadsheetWeb_() {
  const id = PropertiesService.getDocumentProperties().getProperty('WEB_SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Chưa cấu hình Spreadsheet ID. Hãy chạy setupFirstWebAppTemplate() trong Apps Script Editor.');
}

function assertWorkbookContractWeb_(ss) {
  Object.keys(WEB_REQUIRED_HEADERS).forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error('Thiếu sheet bắt buộc: ' + name);
    const expected = WEB_REQUIRED_HEADERS[name];
    const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
    expected.forEach(function (header, index) {
      if (String(actual[index]).trim() !== header) {
        throw new Error('Sai schema ' + name + ' cột ' + (index + 1) + ': cần "' + header + '".');
      }
    });
  });
}

function registerCurrentOwnerWeb_(ss) {
  const email = currentEmailWeb_(true);
  if (!email) throw new Error('Không đọc được email chủ cài đặt. Hãy cấp quyền Google Workspace rồi chạy lại.');
  const users = readObjectsWeb_(ss, 'NGƯỜI_DÙNG');
  const existing = users.find(function (item) {
    return String(item['Email đăng nhập'] || '').trim().toLowerCase() === email;
  });
  if (existing) {
    return { id: String(existing['Mã nhân viên']), name: String(existing['Tên nhân viên']), role: String(existing['Vai trò']), email: email };
  }
  const id = 'OWNER-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  ss.getSheetByName('NGƯỜI_DÙNG').appendRow([id, 'Chủ sở hữu', 'TRƯỞNG PHÒNG', email]);
  return { id: id, name: 'Chủ sở hữu', role: 'TRƯỞNG PHÒNG', email: email };
}

function getActorWeb_(ss, allowEffectiveUser) {
  const email = currentEmailWeb_(allowEffectiveUser);
  if (!email) {
    throw new Error('Không xác định được người dùng. Hãy deploy với Execute as: User accessing the web app và yêu cầu đăng nhập Google.');
  }
  const user = readObjectsWeb_(ss, 'NGƯỜI_DÙNG').find(function (item) {
    return String(item['Email đăng nhập'] || '').trim().toLowerCase() === email;
  });
  if (!user) throw new Error('Email ' + email + ' chưa có trong sheet NGƯỜI_DÙNG.');
  return {
    id: String(user['Mã nhân viên'] || ''),
    name: String(user['Tên nhân viên'] || ''),
    role: normalizeWeb_(user['Vai trò']),
    email: email
  };
}

function currentEmailWeb_(allowEffectiveUser) {
  const active = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (active) return active;
  return allowEffectiveUser ? String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase() : '';
}

function listQuotesWeb_(ss, actor, limit) {
  const customers = indexByWeb_(readObjectsWeb_(ss, 'KHÁCH_HÀNG'), 'Mã khách hàng');
  return readObjectsWeb_(ss, 'BÁO_GIÁ')
    .filter(function (item) { return item['Mã báo giá revision']; })
    .filter(function (item) { return canAccessQuoteWeb_(item, actor); })
    .map(function (item) { return quoteViewWeb_(item, customers[String(item['Mã khách hàng'])], actor); })
    .sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); })
    .slice(0, limit);
}

function quoteViewWeb_(quote, customer, actor) {
  const status = normalizeWeb_(quote['Trạng thái']);
  return {
    id: String(quote['Mã báo giá revision'] || ''),
    number: String(quote['Mã báo giá'] || ''),
    revision: Number(quote['Revision'] || 1),
    latest: quote['Là revision mới nhất'] === true,
    customerId: String(quote['Mã khách hàng'] || ''),
    customerName: customer ? String(customer['Tên khách hàng'] || '') : '',
    quoteDate: formatDateWeb_(quote['Ngày báo giá']),
    expiryDate: formatDateWeb_(quote['Hạn hiệu lực']),
    status: status,
    total: Number(quote['Tổng thanh toán'] || 0),
    warning: String(quote['Cảnh báo'] || ''),
    ownerId: String(quote['Người phụ trách'] || ''),
    rowVersion: Number(quote['Phiên bản dòng'] || 1),
    creatorId: String(quote['Người tạo'] || ''),
    updatedAt: formatDateTimeWeb_(quote['Cập nhật lúc']),
    actions: availableActionsWeb_(status, actor.role, String(quote['Người tạo'] || ''), actor.id)
  };
}

function buildDashboardWeb_(ss, actor) {
  const isAdmin = WEB_ROLES.ADMIN.indexOf(actor.role) !== -1;
  const quotes = readObjectsWeb_(ss, 'BÁO_GIÁ').filter(function (item) {
    return item['Mã báo giá revision'] && canAccessQuoteWeb_(item, actor);
  });
  const orders = readObjectsWeb_(ss, 'ĐƠN_HÀNG').filter(function (item) {
    return item['Mã đơn hàng'] && (isAdmin || String(item['Người phụ trách'] || '') === actor.id || String(item['Người tạo'] || '') === actor.id);
  });
  const latest = quotes.filter(function (item) { return item['Là revision mới nhất'] === true; });
  const decided = latest.filter(function (item) { return ['CHẤP NHẬN', 'TỪ CHỐI', 'HẾT HẠN'].indexOf(normalizeWeb_(item['Trạng thái'])) !== -1; });
  const accepted = decided.filter(function (item) { return normalizeWeb_(item['Trạng thái']) === 'CHẤP NHẬN'; }).length;
  const activeOrders = orders.filter(function (item) { return normalizeWeb_(item['Trạng thái']) !== 'HỦY'; });
  return {
    quoteCount: quotes.length,
    conversionRate: decided.length ? accepted / decided.length : 0,
    orderValue: activeOrders.reduce(function (sum, item) { return sum + Number(item['Tổng đơn hàng'] || 0); }, 0),
    collected: activeOrders.reduce(function (sum, item) { return sum + Number(item['Thực thu'] || 0); }, 0),
    receivable: activeOrders.reduce(function (sum, item) { return sum + Number(item['Công nợ'] || 0); }, 0)
  };
}

function validateCreateQuoteWeb_(ss, payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Dữ liệu báo giá không hợp lệ.');
  const customerId = requiredTextWeb_(payload.customerId, 'Khách hàng');
  const customer = findObjectWeb_(ss, 'KHÁCH_HÀNG', 'Mã khách hàng', customerId);
  if (!customer) throw new Error('Khách hàng không tồn tại: ' + customerId);
  if (normalizeWeb_(customer['Trạng thái']) === 'NGỪNG HOẠT ĐỘNG') throw new Error('Khách hàng đã ngừng hoạt động.');
  if (!Array.isArray(payload.lines) || !payload.lines.length || payload.lines.length > WEB_MAX_LINES) {
    throw new Error('Báo giá phải có từ 1 đến ' + WEB_MAX_LINES + ' dòng.');
  }
  const products = indexByWeb_(readObjectsWeb_(ss, 'SẢN_PHẨM'), 'Mã sản phẩm');
  const lines = payload.lines.map(function (raw, index) {
    const productId = requiredTextWeb_(raw.productId, 'Sản phẩm dòng ' + (index + 1));
    const product = products[productId];
    if (!product) throw new Error('Sản phẩm không tồn tại: ' + productId);
    if (normalizeWeb_(product['Trạng thái']) === 'NGỪNG KINH DOANH') throw new Error('Sản phẩm đã ngừng kinh doanh: ' + productId);
    return {
      product: {
        id: productId,
        name: String(product['Tên sản phẩm'] || ''),
        unit: String(product['Đơn vị tính'] || ''),
        price: numberWeb_(product['Đơn giá'], 'Đơn giá ' + productId),
        vatRate: rateWeb_(product['Thuế suất'], 'Thuế suất ' + productId)
      },
      quantity: positiveNumberWeb_(raw.quantity, 'Số lượng dòng ' + (index + 1)),
      discountRate: rateWeb_(raw.discountRate || 0, 'Chiết khấu dòng ' + (index + 1))
    };
  });
  const expiryDate = payload.expiryDate ? new Date(payload.expiryDate + 'T00:00:00') : defaultExpiryWeb_();
  if (Number.isNaN(expiryDate.getTime())) throw new Error('Hạn hiệu lực không hợp lệ.');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiryDate < today) throw new Error('Hạn hiệu lực không được nhỏ hơn ngày hiện tại.');
  return { customer: customer, ownerId: String(customer['Người phụ trách'] || ''), expiryDate: expiryDate, lines: lines };
}

function defaultExpiryWeb_() {
  const value = new Date();
  value.setDate(value.getDate() + 15);
  value.setHours(0, 0, 0, 0);
  return value;
}

function calculateLineWeb_(quantity, unitPrice, discountRate, vatRate) {
  const qty = positiveNumberWeb_(quantity, 'Số lượng');
  const price = nonNegativeNumberWeb_(unitPrice, 'Đơn giá');
  const discount = rateWeb_(discountRate, 'Tỷ lệ chiết khấu');
  const vat = rateWeb_(vatRate, 'Thuế suất');
  const subtotal = roundMoneyWeb_(qty * price);
  const discountAmount = roundMoneyWeb_(subtotal * discount);
  const netBeforeVat = roundMoneyWeb_(subtotal - discountAmount);
  const vatAmount = roundMoneyWeb_(netBeforeVat * vat);
  return { subtotal: subtotal, discountAmount: discountAmount, netBeforeVat: netBeforeVat, vatAmount: vatAmount, total: roundMoneyWeb_(netBeforeVat + vatAmount) };
}

function validateTransitionWeb_(source, target, role, creatorId, actorId, reason) {
  const allowed = WEB_QUOTE_TRANSITIONS[source] || [];
  if (allowed.indexOf(target) === -1) throw new Error('Chuyển trạng thái từ ' + source + ' sang ' + target + ' không hợp lệ.');
  if (target === 'ĐÃ DUYỆT' || target === 'TỪ CHỐI') {
    if (WEB_ROLES.ADMIN.indexOf(role) === -1) throw new Error('Chỉ TRƯỞNG PHÒNG hoặc SALES ADMIN được duyệt/từ chối báo giá.');
    if (creatorId && creatorId === actorId) throw new Error('Người tạo không được tự duyệt báo giá.');
  } else if (WEB_ROLES.SALES.indexOf(role) === -1) {
    throw new Error('Vai trò không có quyền chuyển trạng thái báo giá.');
  }
  if (target === 'TỪ CHỐI' && !String(reason || '').trim()) throw new Error('Lý do từ chối là bắt buộc.');
  return true;
}

function availableActionsWeb_(status, role, creatorId, actorId) {
  return (WEB_QUOTE_TRANSITIONS[status] || []).filter(function (target) {
    try {
      validateTransitionWeb_(status, target, role, creatorId, actorId, target === 'TỪ CHỐI' ? 'Sẽ nhập khi thao tác' : '');
      return true;
    } catch (error) {
      return false;
    }
  });
}

function requireRoleWeb_(actor, roles, action) {
  if (roles.indexOf(actor.role) === -1) throw new Error('Vai trò ' + actor.role + ' không được phép ' + action + '.');
}

function canAccessQuoteWeb_(quote, actor) {
  if (WEB_ROLES.ADMIN.indexOf(actor.role) !== -1) return true;
  return String(quote['Người phụ trách'] || '') === actor.id || String(quote['Người tạo'] || '') === actor.id;
}

function assertQuoteAccessWeb_(quote, actor) {
  if (!canAccessQuoteWeb_(quote, actor)) throw new Error('Bạn không có quyền truy cập báo giá này.');
}

function readObjectsWeb_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn).getValues();
  return values.map(function (row) {
    return headers.reduce(function (item, header, index) {
      item[String(header)] = row[index];
      return item;
    }, {});
  });
}

function findObjectWeb_(ss, sheetName, key, value) {
  const needle = String(value || '');
  return readObjectsWeb_(ss, sheetName).find(function (item) { return String(item[key] || '') === needle; }) || null;
}

function findRowIndexWeb_(sheet, column, value) {
  if (sheet.getLastRow() < 2) return -1;
  const values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getDisplayValues();
  for (let index = 0; index < values.length; index++) if (String(values[index][0]) === String(value)) return index + 2;
  return -1;
}

function indexByWeb_(rows, key) {
  return rows.reduce(function (index, item) {
    index[String(item[key] || '')] = item;
    return index;
  }, {});
}

function nextSequenceIdWeb_(prefix, date) {
  const period = Utilities.formatDate(date, WEB_APP_TIMEZONE, 'yyyyMM');
  const key = 'WEB_SEQUENCE_' + prefix + '_' + period;
  const props = PropertiesService.getDocumentProperties();
  const next = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(next));
  return prefix + '-' + period + '-' + String(next).padStart(4, '0');
}

function logWeb_(ss, action, entity, entityId, detail) {
  const sheet = ss.getSheetByName('NHẬT_KÝ');
  if (!sheet) return;
  const safeDetail = JSON.stringify(detail || {}).slice(0, 2000);
  sheet.appendRow([
    'EV-' + Utilities.getUuid().slice(0, 12).toUpperCase(),
    new Date(),
    sanitizeCellWeb_(action),
    sanitizeCellWeb_(entity),
    sanitizeCellWeb_(entityId),
    sanitizeCellWeb_(safeDetail)
  ]);
}

function sanitizeCellWeb_(value) {
  if (typeof value !== 'string') return value;
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function requiredTextWeb_(value, label) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  if (!text) throw new Error(label + ' là bắt buộc.');
  if (text.length > 250) throw new Error(label + ' quá dài.');
  return text;
}

function normalizeWeb_(value) {
  return String(value || '').trim().toUpperCase();
}

function numberWeb_(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(label + ' phải là số.');
  return number;
}

function positiveNumberWeb_(value, label) {
  const number = numberWeb_(value, label);
  if (number <= 0) throw new Error(label + ' phải lớn hơn 0.');
  return number;
}

function nonNegativeNumberWeb_(value, label) {
  const number = numberWeb_(value, label);
  if (number < 0) throw new Error(label + ' không được âm.');
  return number;
}

function rateWeb_(value, label) {
  const number = numberWeb_(value, label);
  if (number < 0 || number > 1) throw new Error(label + ' phải nằm trong khoảng 0–1.');
  return number;
}

function roundMoneyWeb_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatDateWeb_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : Utilities.formatDate(date, WEB_APP_TIMEZONE, 'dd/MM/yyyy');
}

function formatDateTimeWeb_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : Utilities.formatDate(date, WEB_APP_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}
