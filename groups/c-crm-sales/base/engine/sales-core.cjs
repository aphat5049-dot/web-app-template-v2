const crypto = require('node:crypto');

const BUSINESS_TABLES = Object.freeze([
  'KHACH_HANG',
  'SAN_PHAM',
  'BAO_GIA',
  'CHI_TIET_BAO_GIA',
  'DON_HANG',
  'CHI_TIET_DON_HANG',
  'GIAO_HANG',
  'CHI_TIET_GIAO_HANG',
  'THANH_TOAN'
]);

const QUOTE_TRANSITIONS = Object.freeze({
  'NHÁP': ['CHỜ DUYỆT'],
  'CHỜ DUYỆT': ['ĐÃ DUYỆT', 'TỪ CHỐI', 'NHÁP'],
  'ĐÃ DUYỆT': ['ĐÃ GỬI', 'HẾT HẠN'],
  'ĐÃ GỬI': ['CHẤP NHẬN', 'TỪ CHỐI', 'HẾT HẠN'],
  'CHẤP NHẬN': [],
  'TỪ CHỐI': [],
  'HẾT HẠN': []
});

const ORDER_TRANSITIONS = Object.freeze({
  'MỚI': ['XÁC NHẬN', 'HỦY'],
  'XÁC NHẬN': ['ĐANG GIAO', 'HỦY'],
  'ĐANG GIAO': ['GIAO MỘT PHẦN', 'HOÀN TẤT'],
  'GIAO MỘT PHẦN': ['ĐANG GIAO', 'HOÀN TẤT'],
  'HOÀN TẤT': [],
  'HỦY': []
});

const FORMULAS = Object.freeze({
  quoteLine: {
    subtotal: '=IF(OR(F2="";G2="");"";F2*G2)',
    discount: '=IF(J2="";"";J2*H2)',
    net: '=IF(J2="";"";J2-K2)',
    vat: '=IF(L2="";"";L2*I2)',
    total: '=IF(L2="";"";L2+M2)'
  },
  quoteTotal: '=IF(A2="";"";SUMIFS(CHI_TIẾT_BÁO_GIÁ!$N:$N;CHI_TIẾT_BÁO_GIÁ!$B:$B;A2))',
  orderTotal: '=IF(A2="";"";SUMIFS(CHI_TIẾT_ĐƠN_HÀNG!$H:$H;CHI_TIẾT_ĐƠN_HÀNG!$B:$B;A2))',
  confirmedPaid: '=IF(A2="";"";SUMIFS(THANH_TOÁN!$D:$D;THANH_TOÁN!$B:$B;A2;THANH_TOÁN!$F:$F;"ĐÃ XÁC NHẬN"))',
  receivable: '=IF(A2="";"";MAX(0;G2-H2))'
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function assertFiniteNonNegative(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} phải là số không âm.`);
  return number;
}

function assertFinitePositive(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} phải là số lớn hơn 0.`);
  return number;
}

function assertRate(value, label) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error(`${label} phải nằm trong khoảng 0–1.`);
  return rate;
}

function calculateQuoteLine(quantity, unitPrice, discountRate, vatRate) {
  if (quantity === '' || quantity === null || quantity === undefined || unitPrice === '' || unitPrice === null || unitPrice === undefined) {
    return { subtotal: null, discountAmount: null, netBeforeVat: null, vatAmount: null, total: null };
  }
  const qty = assertFiniteNonNegative(quantity, 'Số lượng');
  const price = assertFiniteNonNegative(unitPrice, 'Đơn giá');
  const discount = assertRate(discountRate, 'Tỷ lệ chiết khấu');
  const vat = assertRate(vatRate, 'Thuế suất');
  const subtotal = roundMoney(qty * price);
  const discountAmount = roundMoney(subtotal * discount);
  const netBeforeVat = roundMoney(subtotal - discountAmount);
  const vatAmount = roundMoney(netBeforeVat * vat);
  return { subtotal, discountAmount, netBeforeVat, vatAmount, total: roundMoney(netBeforeVat + vatAmount) };
}

function calculateQuoteTotals(quotes, quoteLines) {
  const totals = new Map(quotes.map(quote => [quote.MA_BAO_GIA_REVISION, 0]));
  for (const line of quoteLines) {
    if (!totals.has(line.MA_BAO_GIA_REVISION)) throw new Error(`Ref báo giá không tồn tại: ${line.MA_BAO_GIA_REVISION}`);
    const result = calculateQuoteLine(line.SO_LUONG, line.DON_GIA, line.TY_LE_CHIET_KHAU, line.THUE_SUAT);
    totals.set(line.MA_BAO_GIA_REVISION, roundMoney(totals.get(line.MA_BAO_GIA_REVISION) + result.total));
  }
  return Object.fromEntries(totals);
}

function calculateOrderTotals(orders, orderLines) {
  const totals = new Map(orders.map(order => [order.MA_DON_HANG, 0]));
  for (const line of orderLines) {
    if (!totals.has(line.MA_DON_HANG)) throw new Error(`Ref đơn hàng không tồn tại: ${line.MA_DON_HANG}`);
    const quantity = assertFiniteNonNegative(line.SO_LUONG, 'Số lượng đặt');
    const price = assertFiniteNonNegative(line.DON_GIA, 'Đơn giá');
    totals.set(line.MA_DON_HANG, roundMoney(totals.get(line.MA_DON_HANG) + quantity * price));
  }
  return Object.fromEntries(totals);
}

function calculateReceivables(orders, orderLines, payments) {
  const totals = calculateOrderTotals(orders, orderLines);
  const paid = Object.fromEntries(orders.map(order => [order.MA_DON_HANG, 0]));
  for (const payment of payments) {
    if (!Object.prototype.hasOwnProperty.call(paid, payment.MA_DON_HANG)) throw new Error(`Ref đơn hàng không tồn tại: ${payment.MA_DON_HANG}`);
    if (payment.TRANG_THAI === 'ĐÃ XÁC NHẬN') {
      paid[payment.MA_DON_HANG] = roundMoney(paid[payment.MA_DON_HANG] + assertFiniteNonNegative(payment.SO_TIEN, 'Số tiền'));
    }
  }
  return Object.fromEntries(orders.map(order => {
    const orderId = order.MA_DON_HANG;
    const total = totals[orderId];
    const confirmedPaid = paid[orderId];
    if (confirmedPaid > total) throw new Error(`Tổng thanh toán vượt giá trị đơn hàng: ${orderId}`);
    return [orderId, { orderTotal: total, confirmedPaid, receivable: Math.max(0, roundMoney(total - confirmedPaid)) }];
  }));
}

function calculateConversionRate(quotes) {
  const latest = quotes.filter(quote => quote.LA_REVISION_MOI_NHAT === true);
  const accepted = latest.filter(quote => quote.TRANG_THAI === 'CHẤP NHẬN').length;
  const rejected = latest.filter(quote => quote.TRANG_THAI === 'TỪ CHỐI').length;
  const expired = latest.filter(quote => quote.TRANG_THAI === 'HẾT HẠN').length;
  const denominator = accepted + rejected + expired;
  return denominator === 0 ? 0 : Number((accepted / denominator).toFixed(4));
}

function calculateDashboard(fixture) {
  const quoteTotals = calculateQuoteTotals(fixture.BAO_GIA, fixture.CHI_TIET_BAO_GIA);
  const receivables = calculateReceivables(fixture.DON_HANG, fixture.CHI_TIET_DON_HANG, fixture.THANH_TOAN);
  const activeOrders = fixture.DON_HANG.filter(order => order.TRANG_THAI !== 'HỦY');
  return {
    sentQuoteValue: roundMoney(fixture.BAO_GIA.filter(q => ['ĐÃ GỬI', 'CHẤP NHẬN', 'TỪ CHỐI', 'HẾT HẠN'].includes(q.TRANG_THAI)).reduce((sum, q) => sum + quoteTotals[q.MA_BAO_GIA_REVISION], 0)),
    conversionRate: calculateConversionRate(fixture.BAO_GIA),
    confirmedOrderValue: roundMoney(activeOrders.reduce((sum, order) => sum + receivables[order.MA_DON_HANG].orderTotal, 0)),
    confirmedCollected: roundMoney(activeOrders.reduce((sum, order) => sum + receivables[order.MA_DON_HANG].confirmedPaid, 0)),
    receivable: roundMoney(activeOrders.reduce((sum, order) => sum + receivables[order.MA_DON_HANG].receivable, 0))
  };
}

function assertUnique(rows, key, table) {
  const seen = new Set();
  for (const row of rows) {
    if (!row[key]) throw new Error(`${table}.${key} không được để trống.`);
    if (seen.has(row[key])) throw new Error(`ID trùng trong ${table}: ${row[key]}`);
    seen.add(row[key]);
  }
  return seen;
}

function validateDataset(fixture) {
  const customerIds = assertUnique(fixture.KHACH_HANG, 'MA_KHACH_HANG', 'KHACH_HANG');
  const productIds = assertUnique(fixture.SAN_PHAM, 'MA_SAN_PHAM', 'SAN_PHAM');
  const quoteIds = assertUnique(fixture.BAO_GIA, 'MA_BAO_GIA_REVISION', 'BAO_GIA');
  const orderIds = assertUnique(fixture.DON_HANG, 'MA_DON_HANG', 'DON_HANG');
  const orderLineIds = assertUnique(fixture.CHI_TIET_DON_HANG, 'MA_DONG_DON_HANG', 'CHI_TIET_DON_HANG');
  const deliveryIds = assertUnique(fixture.GIAO_HANG || [], 'MA_GIAO_HANG', 'GIAO_HANG');
  assertUnique(fixture.CHI_TIET_BAO_GIA, 'MA_DONG_BAO_GIA', 'CHI_TIET_BAO_GIA');
  assertUnique(fixture.CHI_TIET_GIAO_HANG || [], 'MA_DONG_GIAO_HANG', 'CHI_TIET_GIAO_HANG');
  assertUnique(fixture.THANH_TOAN, 'MA_THANH_TOAN', 'THANH_TOAN');
  for (const quote of fixture.BAO_GIA) {
    if (!customerIds.has(quote.MA_KHACH_HANG)) throw new Error(`Ref khách hàng sai: ${quote.MA_KHACH_HANG}`);
    if (!Number.isInteger(quote.PHIEN_BAN_DONG) || quote.PHIEN_BAN_DONG < 1) throw new Error(`Phiên bản dòng báo giá sai: ${quote.MA_BAO_GIA_REVISION}`);
    if (quote.TRANG_THAI === 'TỪ CHỐI' && !String(quote.LY_DO_TU_CHOI || '').trim()) throw new Error(`Báo giá từ chối thiếu lý do: ${quote.MA_BAO_GIA_REVISION}`);
  }
  for (const line of fixture.CHI_TIET_BAO_GIA) {
    if (!quoteIds.has(line.MA_BAO_GIA_REVISION)) throw new Error(`Ref báo giá sai: ${line.MA_BAO_GIA_REVISION}`);
    if (!productIds.has(line.MA_SAN_PHAM)) throw new Error(`Ref sản phẩm sai: ${line.MA_SAN_PHAM}`);
  }
  for (const order of fixture.DON_HANG) {
    if (!customerIds.has(order.MA_KHACH_HANG)) throw new Error(`Ref khách hàng sai: ${order.MA_KHACH_HANG}`);
    if (order.MA_BAO_GIA_REVISION && !quoteIds.has(order.MA_BAO_GIA_REVISION)) throw new Error(`Ref báo giá sai: ${order.MA_BAO_GIA_REVISION}`);
    if (!Number.isInteger(order.PHIEN_BAN_DONG) || order.PHIEN_BAN_DONG < 1) throw new Error(`Phiên bản dòng đơn hàng sai: ${order.MA_DON_HANG}`);
  }
  for (const line of fixture.CHI_TIET_DON_HANG) {
    if (!orderIds.has(line.MA_DON_HANG)) throw new Error(`Ref đơn hàng sai: ${line.MA_DON_HANG}`);
    if (!productIds.has(line.MA_SAN_PHAM)) throw new Error(`Ref sản phẩm sai: ${line.MA_SAN_PHAM}`);
  }
  for (const delivery of fixture.GIAO_HANG || []) {
    if (!orderIds.has(delivery.MA_DON_HANG)) throw new Error(`Ref đơn hàng giao sai: ${delivery.MA_DON_HANG}`);
    if (fixture.DON_HANG.find(order => order.MA_DON_HANG === delivery.MA_DON_HANG).TRANG_THAI === 'HỦY') throw new Error(`Đơn hủy không được phát sinh giao hàng: ${delivery.MA_DON_HANG}`);
  }
  const deliveredByLine = {};
  const orderLineToOrder = new Map(fixture.CHI_TIET_DON_HANG.map(l => [l.MA_DONG_DON_HANG, l.MA_DON_HANG]));
  const deliveryToOrder = new Map((fixture.GIAO_HANG || []).map(d => [d.MA_GIAO_HANG, d.MA_DON_HANG]));
  for (const line of fixture.CHI_TIET_GIAO_HANG || []) {
    if (!deliveryIds.has(line.MA_GIAO_HANG)) throw new Error(`Ref giao hàng sai: ${line.MA_GIAO_HANG}`);
    if (!orderLineIds.has(line.MA_DONG_DON_HANG)) throw new Error(`Ref dòng đơn hàng giao sai: ${line.MA_DONG_DON_HANG}`);
    const delivOrder = deliveryToOrder.get(line.MA_GIAO_HANG);
    const lineOrder = orderLineToOrder.get(line.MA_DONG_DON_HANG);
    if (delivOrder && lineOrder && delivOrder !== lineOrder) {
      throw new Error(`Dòng giao ${line.MA_DONG_GIAO_HANG} không cùng đơn hàng với phiếu giao.`);
    }
    if (line.TRANG_THAI === 'ĐÃ GIAO') deliveredByLine[line.MA_DONG_DON_HANG] = (deliveredByLine[line.MA_DONG_DON_HANG] || 0) + assertFinitePositive(line.SO_LUONG_GIAO, `Số lượng giao ${line.MA_DONG_GIAO_HANG}`);
  }
  for (const line of fixture.CHI_TIET_DON_HANG) if ((deliveredByLine[line.MA_DONG_DON_HANG] || 0) > Number(line.SO_LUONG)) throw new Error(`Tổng giao vượt số lượng đặt: ${line.MA_DONG_DON_HANG}`);
  const orderMap = new Map(fixture.DON_HANG.map(o => [o.MA_DON_HANG, o]));
  for (const payment of fixture.THANH_TOAN) {
    if (!orderIds.has(payment.MA_DON_HANG)) throw new Error(`Ref đơn hàng sai: ${payment.MA_DON_HANG}`);
    const order = orderMap.get(payment.MA_DON_HANG);
    if (order && order.TRANG_THAI === 'HỦY') throw new Error(`Đơn hủy không được phát sinh thanh toán: ${payment.MA_DON_HANG}`);
    assertFinitePositive(payment.SO_TIEN, `Số tiền thanh toán ${payment.MA_THANH_TOAN}`);
  }
  calculateQuoteTotals(fixture.BAO_GIA, fixture.CHI_TIET_BAO_GIA);
  calculateReceivables(fixture.DON_HANG, fixture.CHI_TIET_DON_HANG, fixture.THANH_TOAN);
  return true;
}

function transitionStatus(entity, targetStatus, expectedRowVersion, role, options = {}) {
  const transitions = entity.type === 'BAO_GIA' ? QUOTE_TRANSITIONS : ORDER_TRANSITIONS;
  if (!transitions[entity.TRANG_THAI] || !transitions[entity.TRANG_THAI].includes(targetStatus)) throw new Error('Chuyển trạng thái không hợp lệ.');
  if (entity.PHIEN_BAN_DONG !== expectedRowVersion) throw new Error('Phiên bản dòng không khớp.');
  const approvalAction = entity.type === 'BAO_GIA' && ['ĐÃ DUYỆT', 'TỪ CHỐI'].includes(targetStatus);
  if (approvalAction && !['TRƯỞNG PHÒNG', 'SALES ADMIN'].includes(role)) throw new Error('Vai trò không có quyền duyệt báo giá.');
  if (approvalAction && options.separateApprover === true && options.actorId && options.actorId === entity.NGUOI_TAO) throw new Error('Người tạo không được tự duyệt báo giá.');
  if (entity.type === 'BAO_GIA' && targetStatus === 'TỪ CHỐI' && !String(options.rejectionReason || '').trim()) throw new Error('Lý do từ chối là bắt buộc.');
  return {
    ...entity,
    TRANG_THAI: targetStatus,
    PHIEN_BAN_DONG: expectedRowVersion + 1,
    ...(approvalAction ? { NGUOI_DUYET: options.actorId || entity.NGUOI_DUYET || '' } : {}),
    ...(targetStatus === 'TỪ CHỐI' ? { LY_DO_TU_CHOI: String(options.rejectionReason).trim() } : {})
  };
}

function createQuoteRevision(quotes, sourceRevisionId, patch) {
  const source = quotes.find(quote => quote.MA_BAO_GIA_REVISION === sourceRevisionId);
  if (!source) throw new Error('Không tìm thấy báo giá nguồn.');
  const highest = Math.max(...quotes.filter(q => q.MA_BAO_GIA === source.MA_BAO_GIA).map(q => q.REVISION));
  const next = highest + 1;
  const revisedQuotes = quotes.map(q => q.MA_BAO_GIA === source.MA_BAO_GIA ? { ...q, LA_REVISION_MOI_NHAT: false } : { ...q });
  const revision = { ...source, ...patch, MA_BAO_GIA_REVISION: `${source.MA_BAO_GIA}-R${next}`, REVISION: next, LA_REVISION_MOI_NHAT: true, TRANG_THAI: 'NHÁP', PHIEN_BAN_DONG: 1, NGUOI_DUYET: '', THOI_DIEM_DUYET: '', LY_DO_TU_CHOI: '' };
  revisedQuotes.push(revision);
  return { quotes: revisedQuotes, revision };
}

function convertAcceptedQuote(quotes, orders, quoteRevisionId) {
  const quote = quotes.find(item => item.MA_BAO_GIA_REVISION === quoteRevisionId);
  if (!quote) throw new Error('Không tìm thấy báo giá.');
  if (quote.TRANG_THAI !== 'CHẤP NHẬN' || quote.LA_REVISION_MOI_NHAT !== true) throw new Error('Chỉ revision mới nhất đã chấp nhận được chuyển đơn.');
  const existing = orders.find(order => order.MA_BAO_GIA_REVISION === quoteRevisionId);
  if (existing) return { created: false, order: existing, orders: clone(orders) };
  const nextNumber = orders.reduce((max, order) => Math.max(max, Number(String(order.MA_DON_HANG).replace(/\D/g, '')) || 0), 0) + 1;
  const order = { MA_DON_HANG: `DH-${String(nextNumber).padStart(3, '0')}`, MA_BAO_GIA_REVISION: quoteRevisionId, MA_KHACH_HANG: quote.MA_KHACH_HANG, TRANG_THAI: 'MỚI', PHIEN_BAN_DONG: 1 };
  return { created: true, order, orders: [...clone(orders), order] };
}

function calculateDelivery(orderedQuantity, shipments, cancelled = false) {
  const ordered = assertFiniteNonNegative(orderedQuantity, 'Số lượng đặt');
  if (cancelled && shipments.length) throw new Error('Đơn hủy chưa giao không được phát sinh giao hàng.');
  const delivered = cancelled ? 0 : shipments.reduce((sum, quantity) => sum + assertFiniteNonNegative(quantity, 'Số lượng giao'), 0);
  if (delivered > ordered) throw new Error('Tổng số lượng giao vượt số lượng đặt.');
  return { delivered, remaining: ordered - delivered };
}

function sanitizeImportValue(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function checksum(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function createWorkbookModel() {
  return { version: null, mode: null, installed: false, data: Object.fromEntries(BUSINESS_TABLES.map(table => [table, []])), formulas: clone(FORMULAS), validations: {}, dashboard: {}, backups: [] };
}

function installDemo(model, fixture, requestId = 'CAI-DAT-DEMO') {
  validateDataset(fixture);
  if (model.lastRequestId === requestId && model.installed) return model;
  model.version = fixture.meta.version;
  model.mode = 'demo';
  model.installed = true;
  model.data = Object.fromEntries(BUSINESS_TABLES.map(table => [table, clone(fixture[table])]));
  model.formulas = clone(FORMULAS);
  model.validations = { quoteStatus: Object.keys(QUOTE_TRANSITIONS), orderStatus: Object.keys(ORDER_TRANSITIONS), paymentStatus: ['CHỜ XÁC NHẬN', 'ĐÃ XÁC NHẬN', 'HỦY'] };
  model.dashboard = calculateDashboard(fixture);
  model.lastRequestId = requestId;
  return model;
}

function installClean(model, version = '3.0.0-vi') {
  model.version = version;
  model.mode = 'clean';
  model.installed = true;
  model.data = Object.fromEntries(BUSINESS_TABLES.map(table => [table, []]));
  model.formulas = clone(FORMULAS);
  model.validations = { quoteStatus: Object.keys(QUOTE_TRANSITIONS), orderStatus: Object.keys(ORDER_TRANSITIONS), paymentStatus: ['CHỜ XÁC NHẬN', 'ĐÃ XÁC NHẬN', 'HỦY'] };
  model.dashboard = { sentQuoteValue: 0, conversionRate: 0, confirmedOrderValue: 0, confirmedCollected: 0, receivable: 0 };
  return model;
}

function backupWorkbook(model, reason = 'Sao lưu trước thay đổi') {
  const snapshot = { version: model.version, mode: model.mode, data: clone(model.data), formulas: clone(model.formulas), validations: clone(model.validations), dashboard: clone(model.dashboard) };
  const record = { id: `SAO-LUU-${model.backups.length + 1}`, reason, checksum: checksum(snapshot), snapshot };
  model.backups.push(record);
  return record;
}

function cleanWorkbook(model) {
  const backup = backupWorkbook(model, 'Sao lưu trước làm sạch');
  model.data = Object.fromEntries(BUSINESS_TABLES.map(table => [table, []]));
  model.dashboard = { sentQuoteValue: 0, conversionRate: 0, confirmedOrderValue: 0, confirmedCollected: 0, receivable: 0 };
  return backup;
}

function restoreWorkbook(model, backupId) {
  const record = model.backups.find(item => item.id === backupId);
  if (!record) throw new Error('Không tìm thấy bản sao lưu.');
  if (record.checksum !== checksum(record.snapshot)) throw new Error('Bản sao lưu không toàn vẹn.');
  model.version = record.snapshot.version;
  model.mode = record.snapshot.mode;
  model.data = clone(record.snapshot.data);
  model.formulas = clone(record.snapshot.formulas);
  model.validations = clone(record.snapshot.validations);
  model.dashboard = clone(record.snapshot.dashboard);
  return model;
}

function freezeQuotePrices(quoteRevisionId, quoteLines, products = []) {
  const productPriceMap = new Map(products.map(p => [p.MA_SAN_PHAM, p.DON_GIA]));
  return quoteLines.map(line => {
    if (line.MA_BAO_GIA_REVISION !== quoteRevisionId) return { ...line };
    const price = line.DON_GIA !== undefined && line.DON_GIA !== '' && line.DON_GIA !== null
      ? Number(line.DON_GIA)
      : (productPriceMap.get(line.MA_SAN_PHAM) || 0);
    return { ...line, DON_GIA: price };
  });
}

module.exports = {
  BUSINESS_TABLES,
  FORMULAS,
  QUOTE_TRANSITIONS,
  ORDER_TRANSITIONS,
  calculateQuoteLine,
  calculateQuoteTotals,
  calculateOrderTotals,
  calculateReceivables,
  calculateConversionRate,
  calculateDashboard,
  validateDataset,
  transitionStatus,
  createQuoteRevision,
  convertAcceptedQuote,
  calculateDelivery,
  freezeQuotePrices,
  sanitizeImportValue,
  createWorkbookModel,
  installDemo,
  installClean,
  backupWorkbook,
  cleanWorkbook,
  restoreWorkbook
};
