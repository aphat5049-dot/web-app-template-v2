import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/demo.vi.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/expected-cases.json'), 'utf8'));
const engine = require(path.join(root, 'engine/sales-core.cjs'));

function copy(value) { return JSON.parse(JSON.stringify(value)); }

test('Fixture có đúng 50 bản ghi nghiệp vụ theo phân bổ đã khóa', () => {
  const expectedCounts = { KHACH_HANG: 6, SAN_PHAM: 8, BAO_GIA: 6, CHI_TIET_BAO_GIA: 9, DON_HANG: 5, CHI_TIET_DON_HANG: 8, GIAO_HANG: 2, CHI_TIET_GIAO_HANG: 2, THANH_TOAN: 4 };
  assert.deepEqual(Object.fromEntries(Object.keys(expectedCounts).map(key => [key, fixture[key].length])), expectedCounts);
  assert.equal(Object.values(expectedCounts).reduce((a, b) => a + b, 0), 50);
  assert.equal(fixture.meta.business_record_count, 50);
});

test('Fixture có ref hợp lệ và ID duy nhất', () => {
  assert.equal(engine.validateDataset(fixture), true);
});

test('Oracle dòng báo giá 2 × 100.000, giảm 10%, VAT 8% bằng 194.400', () => {
  const c = expected.quote_line_oracle;
  assert.deepEqual(engine.calculateQuoteLine(c.quantity, c.unit_price, c.discount_rate, c.vat_rate), {
    subtotal: 200000,
    discountAmount: 20000,
    netBeforeVat: 180000,
    vatAmount: 14400,
    total: 194400
  });
});

test('Dòng trống trả kết quả trống và không sinh số ảo', () => {
  assert.deepEqual(engine.calculateQuoteLine('', '', 0, 0.08), { subtotal: null, discountAmount: null, netBeforeVat: null, vatAmount: null, total: null });
});

test('Tỷ lệ và số tiền không hợp lệ bị chặn', () => {
  assert.throws(() => engine.calculateQuoteLine(1, -1, 0, 0.08), /không âm/);
  assert.throws(() => engine.calculateQuoteLine(1, 100, 1.2, 0.08), /0–1/);
});

test('Mọi tỷ lệ chiết khấu fixture nằm trong khoảng 0 đến 1', () => {
  for (const line of fixture.CHI_TIET_BAO_GIA) {
    assert.equal(Number.isFinite(line.TY_LE_CHIET_KHAU), true, line.MA_DONG_BAO_GIA);
    assert.ok(line.TY_LE_CHIET_KHAU >= 0 && line.TY_LE_CHIET_KHAU <= 1, line.MA_DONG_BAO_GIA);
  }
});

test('Tiền chiết khấu bằng thành tiền trước chiết khấu nhân tỷ lệ', () => {
  const result = engine.calculateQuoteLine(3, 125000, 0.12, 0.08);
  assert.equal(result.subtotal, 375000);
  assert.equal(result.discountAmount, result.subtotal * 0.12);
});

test('Thanh toán không tham gia cột tỷ lệ chiết khấu hoặc tổng báo giá', () => {
  const changed = copy(fixture);
  changed.THANH_TOAN[0].SO_TIEN = 999999999;
  assert.deepEqual(
    engine.calculateQuoteTotals(changed.BAO_GIA, changed.CHI_TIET_BAO_GIA),
    engine.calculateQuoteTotals(fixture.BAO_GIA, fixture.CHI_TIET_BAO_GIA)
  );
  assert.doesNotMatch(engine.FORMULAS.quoteLine.discount, /THANH_TOAN|THANH_TOÁN/);
  assert.match(engine.FORMULAS.quoteLine.discount, /J2\*H2/);
});

test('Tổng báo giá thay đổi đúng khi thay đổi tỷ lệ chiết khấu', () => {
  const changed = copy(fixture);
  changed.CHI_TIET_BAO_GIA.find(line => line.MA_DONG_BAO_GIA === 'DBG-001').TY_LE_CHIET_KHAU = 0.2;
  const before = engine.calculateQuoteTotals(fixture.BAO_GIA, fixture.CHI_TIET_BAO_GIA);
  const after = engine.calculateQuoteTotals(changed.BAO_GIA, changed.CHI_TIET_BAO_GIA);
  assert.equal(before['BG-001-R1'], 464400);
  assert.equal(after['BG-001-R1'], 442800);
  assert.equal(before['BG-001-R1'] - after['BG-001-R1'], 21600);
});

test('Tổng báo giá tách theo revision và revision cũ giữ nguyên', () => {
  const totals = engine.calculateQuoteTotals(fixture.BAO_GIA, fixture.CHI_TIET_BAO_GIA);
  assert.equal(totals['BG-001-R1'], 464400);
  assert.equal(totals['BG-001-R2'], 626400);
  assert.notEqual(totals['BG-001-R1'], totals['BG-001-R2']);
});

test('Tỷ lệ chuyển đổi chỉ dùng báo giá đã quyết định', () => {
  assert.equal(engine.calculateConversionRate(fixture.BAO_GIA), expected.conversion_oracle.rate);
});

test('Thanh toán chờ xác nhận không làm giảm công nợ', () => {
  const receivables = engine.calculateReceivables(fixture.DON_HANG, fixture.CHI_TIET_DON_HANG, fixture.THANH_TOAN);
  assert.deepEqual(receivables['DH-002'], { orderTotal: 1300000, confirmedPaid: 0, receivable: 1300000 });
});

test('Đơn 800.000 thu xác nhận 500.000 còn công nợ 300.000', () => {
  const receivables = engine.calculateReceivables(fixture.DON_HANG, fixture.CHI_TIET_DON_HANG, fixture.THANH_TOAN);
  assert.deepEqual(receivables['DH-001'], { orderTotal: 800000, confirmedPaid: 500000, receivable: 300000 });
});

test('Xác nhận một thanh toán làm thực thu tăng và công nợ/KPI giảm đúng', () => {
  const before = engine.calculateDashboard(fixture);
  const changed = copy(fixture);
  changed.THANH_TOAN.find(payment => payment.MA_THANH_TOAN === 'TT-002').TRANG_THAI = 'ĐÃ XÁC NHẬN';
  const after = engine.calculateDashboard(changed);
  assert.equal(after.confirmedCollected - before.confirmedCollected, 300000);
  assert.equal(before.receivable - after.receivable, 300000);
  assert.equal(after.confirmedOrderValue, before.confirmedOrderValue);
});

test('Tạo revision mới không sửa object revision cũ', () => {
  const sourceBefore = copy(fixture.BAO_GIA.find(q => q.MA_BAO_GIA_REVISION === 'BG-001-R2'));
  const result = engine.createQuoteRevision(fixture.BAO_GIA, 'BG-001-R2', { HAN_HIEU_LUC: '2026-09-30' });
  assert.deepEqual(fixture.BAO_GIA.find(q => q.MA_BAO_GIA_REVISION === 'BG-001-R2'), sourceBefore);
  assert.equal(result.revision.MA_BAO_GIA_REVISION, 'BG-001-R3');
  assert.equal(result.revision.TRANG_THAI, 'NHÁP');
});

test('Workflow hợp lệ tăng RowVersion', () => {
  const entity = { type: 'BAO_GIA', TRANG_THAI: 'NHÁP', PHIEN_BAN_DONG: 2 };
  const updated = engine.transitionStatus(entity, 'CHỜ DUYỆT', 2, 'KINH DOANH');
  assert.equal(updated.TRANG_THAI, 'CHỜ DUYỆT');
  assert.equal(updated.PHIEN_BAN_DONG, 3);
});

test('Workflow sai bị chặn', () => {
  assert.throws(() => engine.transitionStatus({ type: 'BAO_GIA', TRANG_THAI: 'NHÁP', PHIEN_BAN_DONG: 1 }, 'CHẤP NHẬN', 1, 'TRƯỞNG PHÒNG'), /không hợp lệ/);
});

test('RowVersion lệch bị chặn', () => {
  assert.throws(() => engine.transitionStatus({ type: 'DON_HANG', TRANG_THAI: 'MỚI', PHIEN_BAN_DONG: 3 }, 'XÁC NHẬN', 2, 'SALES ADMIN'), /không khớp/);
});

test('Nhân viên kinh doanh không tự duyệt báo giá', () => {
  assert.throws(() => engine.transitionStatus({ type: 'BAO_GIA', TRANG_THAI: 'CHỜ DUYỆT', PHIEN_BAN_DONG: 1 }, 'ĐÃ DUYỆT', 1, 'KINH DOANH'), /không có quyền/);
});

test('Tách vai trò chặn người tạo tự duyệt và từ chối bắt buộc có lý do', () => {
  const quote = { type: 'BAO_GIA', TRANG_THAI: 'CHỜ DUYỆT', PHIEN_BAN_DONG: 2, NGUOI_TAO: 'NV-001' };
  assert.throws(() => engine.transitionStatus(quote, 'ĐÃ DUYỆT', 2, 'TRƯỞNG PHÒNG', { actorId: 'NV-001', separateApprover: true }), /không được tự duyệt/);
  assert.throws(() => engine.transitionStatus(quote, 'TỪ CHỐI', 2, 'SALES ADMIN', { actorId: 'NV-002', separateApprover: true }), /Lý do từ chối/);
  const rejected = engine.transitionStatus(quote, 'TỪ CHỐI', 2, 'SALES ADMIN', { actorId: 'NV-002', separateApprover: true, rejectionReason: 'Chưa đủ điều kiện' });
  assert.equal(rejected.TRANG_THAI, 'TỪ CHỐI');
  assert.equal(rejected.PHIEN_BAN_DONG, 3);
  assert.equal(rejected.NGUOI_DUYET, 'NV-002');
  assert.equal(rejected.LY_DO_TU_CHOI, 'Chưa đủ điều kiện');
});

test('Chuyển báo giá chấp nhận thành đơn là idempotent', () => {
  const first = engine.convertAcceptedQuote(fixture.BAO_GIA, [], 'BG-001-R2');
  const second = engine.convertAcceptedQuote(fixture.BAO_GIA, first.orders, 'BG-001-R2');
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(second.orders.length, 1);
  assert.equal(second.order.MA_BAO_GIA_REVISION, 'BG-001-R2');
});

test('Không chuyển revision cũ hoặc báo giá chưa chấp nhận thành đơn', () => {
  assert.throws(() => engine.convertAcceptedQuote(fixture.BAO_GIA, [], 'BG-001-R1'), /revision mới nhất/);
  assert.throws(() => engine.convertAcceptedQuote(fixture.BAO_GIA, [], 'BG-004-R1'), /revision mới nhất/);
});

test('Giao 6 rồi 4 cho đơn 10 có tổng giao 10 và còn 0', () => {
  assert.deepEqual(engine.calculateDelivery(expected.delivery_oracle.ordered, expected.delivery_oracle.shipments), { delivered: 10, remaining: 0 });
  const rows = fixture.CHI_TIET_GIAO_HANG.filter(item => item.MA_DONG_DON_HANG === 'DDH-002' && item.TRANG_THAI === 'ĐÃ GIAO');
  assert.deepEqual(rows.map(item => item.SO_LUONG_GIAO), [6, 4]);
});

test('Giao vượt và giao cho đơn hủy bị chặn', () => {
  assert.throws(() => engine.calculateDelivery(10, [6, 5]), /vượt/);
  assert.throws(() => engine.calculateDelivery(10, [1], true), /Đơn hủy/);
  assert.deepEqual(engine.calculateDelivery(10, [], true), { delivered: 0, remaining: 10 });
});

test('Validation phát hiện giao hàng không cùng đơn hàng', () => {
  const badFixture = copy(fixture);
  badFixture.CHI_TIET_GIAO_HANG[0].MA_DONG_DON_HANG = 'DDH-001';
  assert.throws(() => engine.validateDataset(badFixture), /không cùng đơn hàng/);
});

test('Validation chặn thanh toán cho đơn hàng đã hủy', () => {
  const badFixture = copy(fixture);
  badFixture.THANH_TOAN.push({
    MA_THANH_TOAN: 'TT-999',
    MA_DON_HANG: 'DH-004',
    NGAY_THANH_TOAN: '2026-09-20',
    SO_TIEN: 100000,
    HINH_THUC: 'CHUYỂN KHOẢN',
    TRANG_THAI: 'CHỜ XÁC NHẬN'
  });
  assert.throws(() => engine.validateDataset(badFixture), /Đơn hủy không được phát sinh thanh toán/);
});

test('Số tiền thanh toán phải lớn hơn 0', () => {
  const badFixture = copy(fixture);
  badFixture.THANH_TOAN[0].SO_TIEN = 0;
  assert.throws(() => engine.validateDataset(badFixture), /phải là số lớn hơn 0/);
});

test('Tổng thanh toán xác nhận vượt giá trị đơn hàng bị chặn', () => {
  const badFixture = copy(fixture);
  badFixture.THANH_TOAN.push({
    MA_THANH_TOAN: 'TT-099',
    MA_DON_HANG: 'DH-001',
    NGAY_THANH_TOAN: '2026-09-10',
    SO_TIEN: 400000,
    HINH_THUC: 'TIỀN MẶT',
    TRANG_THAI: 'ĐÃ XÁC NHẬN'
  });
  assert.throws(() => engine.calculateReceivables(badFixture.DON_HANG, badFixture.CHI_TIET_DON_HANG, badFixture.THANH_TOAN), /vượt giá trị đơn hàng/);
});

test('Chốt đơn giá báo giá bảo vệ lịch sử khi catalog sản phẩm đổi giá', () => {
  const lines = copy(fixture.CHI_TIET_BAO_GIA);
  const frozen = engine.freezeQuotePrices('BG-001-R1', lines, fixture.SAN_PHAM);
  const r1Lines = frozen.filter(l => l.MA_BAO_GIA_REVISION === 'BG-001-R1');
  assert.equal(r1Lines.find(l => l.MA_DONG_BAO_GIA === 'DBG-001').DON_GIA, 100000);
  assert.equal(r1Lines.find(l => l.MA_DONG_BAO_GIA === 'DBG-002').DON_GIA, 250000);
  const alteredProducts = copy(fixture.SAN_PHAM);
  alteredProducts.find(p => p.MA_SAN_PHAM === 'SP-001').DON_GIA = 999999;
  assert.equal(r1Lines.find(l => l.MA_DONG_BAO_GIA === 'DBG-001').DON_GIA, 100000);
  const totals = engine.calculateQuoteTotals(fixture.BAO_GIA, frozen);
  assert.equal(totals['BG-001-R1'], 464400);
});

test('Formula injection bị vô hiệu hóa khi import', () => {
  for (const value of ['=IMPORTXML("x")', '+1+1', '-2+2', '@SUM(A:A)']) assert.ok(engine.sanitizeImportValue(value).startsWith("'"));
  assert.equal(engine.sanitizeImportValue('Nội dung an toàn'), 'Nội dung an toàn');
});

test('Demo rerun cùng request không nhân đôi dữ liệu hoặc mất công thức', () => {
  const model = engine.createWorkbookModel();
  engine.installDemo(model, fixture, 'YEU-CAU-001');
  const before = JSON.stringify(model);
  engine.installDemo(model, fixture, 'YEU-CAU-001');
  assert.equal(JSON.stringify(model), before);
  assert.equal(model.data.KHACH_HANG.length, 6);
  assert.equal(model.formulas.receivable.includes('MAX'), true);
});

test('Clean tạo backup và Restore phục hồi dữ liệu, công thức, validation, dashboard', () => {
  const model = engine.installDemo(engine.createWorkbookModel(), fixture, 'YEU-CAU-002');
  const dashboardBefore = copy(model.dashboard);
  const backup = engine.cleanWorkbook(model);
  assert.equal(model.data.DON_HANG.length, 0);
  assert.equal(model.backups.length, 1);
  engine.restoreWorkbook(model, backup.id);
  assert.equal(model.data.DON_HANG.length, 5);
  assert.deepEqual(model.dashboard, dashboardBefore);
  assert.ok(model.formulas.quoteTotal);
  assert.ok(model.validations.paymentStatus.includes('ĐÃ XÁC NHẬN'));
});

test('Chế độ Sạch không seed Demo nhưng vẫn giữ công thức và validation', () => {
  const model = engine.installClean(engine.createWorkbookModel());
  assert.equal(Object.values(model.data).reduce((sum, rows) => sum + rows.length, 0), 0);
  assert.ok(model.formulas.quoteLine.total);
  assert.ok(model.validations.orderStatus.includes('HỦY'));
});

test('Installer Apps Script có cú pháp JavaScript hợp lệ', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  assert.doesNotThrow(() => new vm.Script(source));
});

test('Installer có policy workflow báo giá thuần để kiểm thử local', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  const base = { currentStatus: 'CHỜ DUYỆT', targetStatus: 'ĐÃ DUYỆT', currentRowVersion: 4, expectedRowVersion: 4, actorId: 'NV-001', actorRole: 'TRƯỞNG PHÒNG', creatorId: 'NV-003', separateApprover: true, rejectionReason: '' };
  assert.deepEqual({ ...context.planQuoteTransitionKD_(base) }, { status: 'ĐÃ DUYỆT', rowVersion: 5, approverId: 'NV-001', approvedAt: true, rejectionReason: '' });
  assert.throws(() => context.planQuoteTransitionKD_({ ...base, expectedRowVersion: 3 }), /Phiên bản dòng không khớp/);
  assert.throws(() => context.planQuoteTransitionKD_({ ...base, actorId: 'NV-003' }), /không được tự duyệt/);
  assert.throws(() => context.planQuoteTransitionKD_({ ...base, targetStatus: 'TỪ CHỐI' }), /Lý do từ chối/);
  assert.throws(() => context.planQuoteTransitionKD_({ ...base, currentStatus: 'NHÁP', targetStatus: 'CHẤP NHẬN' }), /không hợp lệ/);
});

test('Audit workflow chỉ lưu trạng thái, phiên bản, actor và lý do đã giới hạn', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  const detail = context.buildQuoteAuditDetailKD_({ status: 'CHỜ DUYỆT', rowVersion: 2 }, { status: 'TỪ CHỐI', rowVersion: 3 }, 'NV-002', 'Thiếu phê duyệt\nngân sách');
  const parsed = JSON.parse(detail);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.truoc)), { trangThai: 'CHỜ DUYỆT', phienBanDong: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.sau)), { trangThai: 'TỪ CHỐI', phienBanDong: 3 });
  assert.equal(parsed.nguoiThucHien, 'NV-002');
  assert.equal(detail.includes('\n'), false);
  assert.doesNotMatch(detail, /khách hàng|điện thoại|địa chỉ/i);
});

test('Backup Apps Script chia chunk dưới giới hạn ô và ghép đúng thứ tự', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  const payload = 'x'.repeat(90005);
  const chunks = context.chunkStringKD_(payload, 40000);
  assert.deepEqual(Array.from(chunks, value => value.length), [40000, 40000, 10005]);
  const rows = chunks.map((chunk, index) => ['SAO-LUU-1', 'time', 'reason', 'digest', index + 1, chunks.length, chunk]);
  const restored = context.readLatestBackupKD_(rows);
  assert.equal(restored.payload, payload);
  assert.equal(restored.id, 'SAO-LUU-1');
  assert.throws(() => context.readLatestBackupKD_(rows.slice(0, 2)), /thiếu chunk/);
});

test('Installer sinh ID tuần tự và escape bản in an toàn', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.equal(context.nextSequentialIdKD_(['DH-001', 'DH-009', 'không hợp lệ'], 'DH'), 'DH-010');
  assert.equal(context.escapeHtmlKD_('<img src=x onerror="alert(1)">&\''), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
});

test('Installer kiểm soát workflow đơn hàng bằng RowVersion và vai trò', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.deepEqual({ ...context.planOrderTransitionKD_({ currentStatus: 'MỚI', targetStatus: 'XÁC NHẬN', currentRowVersion: 1, expectedRowVersion: 1, actorRole: 'SALES ADMIN' }) }, { status: 'XÁC NHẬN', rowVersion: 2 });
  assert.throws(() => context.planOrderTransitionKD_({ currentStatus: 'MỚI', targetStatus: 'XÁC NHẬN', currentRowVersion: 1, expectedRowVersion: 1, actorRole: 'KINH DOANH' }), /không có quyền/);
  assert.throws(() => context.planOrderTransitionKD_({ currentStatus: 'XÁC NHẬN', targetStatus: 'HOÀN TẤT', currentRowVersion: 2, expectedRowVersion: 2, actorRole: 'GIAO NHẬN' }), /không hợp lệ/);
  assert.throws(() => context.planOrderTransitionKD_({ currentStatus: 'ĐANG GIAO', targetStatus: 'HOÀN TẤT', currentRowVersion: 3, expectedRowVersion: 2, actorRole: 'GIAO NHẬN' }), /Phiên bản dòng không khớp/);
});

test('Installer có đủ entrypoint và cơ chế an toàn bắt buộc', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  for (const name of ['caiDatDemoBaoGiaDonHang', 'caiDatSachBaoGiaDonHang', 'caiDatBusinessBaoGiaDonHang', 'taoDuLieuDemoBaoGiaDonHang', 'kiemTraHeThongBaoGiaDonHang', 'thietLapNguoiDungHienTaiKD', 'guiBaoGiaChoDuyetKD', 'duyetBaoGiaKD', 'tuChoiBaoGiaKD', 'danhDauBaoGiaDaGuiKD', 'taoRevisionBaoGiaKD', 'chuyenBaoGiaThanhDonHangKD', 'xemBanInBaoGiaKD', 'chuyenTrangThaiDonHangKD', 'chuyenTrangThaiThanhToanKD', 'saoLuuBaoGiaDonHang', 'khoiPhucBaoGiaDonHang', 'lamSachBaoGiaDonHang']) assert.match(source, new RegExp(`function ${name}\\(`));
  for (const required of ['LockService.getDocumentLock', 'PropertiesService.getDocumentProperties', 'setDataValidation', '.protect()', 'backupKD_']) assert.ok(source.includes(required));
  for (const forbidden of ['MailApp', 'GmailApp', 'doGet(', 'doPost(']) assert.equal(source.includes(forbidden), false);
  assert.ok(source.includes('Session.getActiveUser().getEmail()'));
  assert.equal(source.includes("setProperty('KD_USER_ID'"), false);
  assert.ok(source.includes('validateDeliveryRulesKD_'));
  assert.ok(source.includes('validatePaymentRulesKD_'));
  assert.ok(source.includes('restoreControlledRangeKD_'));
  assert.ok(source.includes('syncControlSnapshotsKD_'));
  assert.ok(source.includes('chotDonGiaBaoGiaKD_'));
  assert.ok(source.includes('applyQuoteUnitPricesKD_'));
});

test('Installer hỗ trợ snapshot kiểm soát để hoàn tác paste nhiều ô', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.equal(context.controlSnapshotNameKD_('BÁO_GIÁ'), '__KS_BAO_GIA');
  assert.equal(context.controlSnapshotNameKD_('CHI_TIẾT_BÁO_GIÁ'), '__KS_CHI_TIET_BAO_GIA');
  assert.equal(typeof context.restoreControlledRangeKD_, 'function');
  assert.equal(typeof context.syncControlSnapshotKD_, 'function');
  assert.deepEqual(Array.from(vm.runInContext('KD_CONTROLLED_TABS', context)), ['BÁO_GIÁ', 'CHI_TIẾT_BÁO_GIÁ', 'ĐƠN_HÀNG', 'GIAO_HÀNG', 'CHI_TIẾT_GIAO_HÀNG', 'THANH_TOÁN']);
});

test('Installer dùng công thức vi_VN và dựng Dashboard động đủ 12 KPI, 3 biểu đồ', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  assert.match(source, /setSpreadsheetLocale\('vi_VN'\)/);
  assert.match(source, /=IF\(RC\[-1\]="";"";/);
  assert.match(source, /const kpis = \[/);
  assert.equal((source.match(/sheet\.newChart\(\)/g) || []).length, 3);
  assert.ok(source.includes("sheet.getCharts().forEach"));
  assert.ok(source.includes("['Giá trị báo giá chấp nhận'"));
  assert.ok(source.includes("['Lợi nhuận gộp dự kiến'"));
  assert.ok(source.includes("['Đơn hủy'"));
  assert.ok(source.includes("F3=\"TẤT CẢ\""));
  assert.ok(source.includes("B4=\"TẤT CẢ\""));
  assert.ok(source.includes("H3=\"TẤT CẢ\""));
  assert.ok(source.includes('D2:D500=TRUE'));
  assert.ok(source.includes('const quoteScope ='));
  assert.ok(source.includes('const orderLineScope ='));
  assert.ok(source.includes("'=SUMPRODUCT(' + activeOrderFilter"));
});

test('Installer giữ H là input chiết khấu và chỉ ghi thanh toán vào ĐƠN_HÀNG.H', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  assert.ok(source.includes("getRange('H2:H500').setDataValidation(rateRule).setNumberFormat('0.00%')"));
  assert.doesNotMatch(source, /quoteLines\.getRange\(2,\s*8[^\n]*setFormula/);
  assert.match(source, /quoteLines\.getRange\(2,\s*11[^\n]*RC\[-1\]\*RC\[-3\]/);
  assert.match(source, /orders\.getRange\(2,\s*8[^\n]*SUMIFS\(\\'THANH_TOÁN\\'/);
  assert.ok(source.includes('clearUnexpectedDiscountFormulasKD_'));
  assert.doesNotMatch(source, /orderLines\.getRange\(2,\s*7[^\n]*setFormula/);
  assert.ok(source.includes("return [lineId, orderId, line[2], '', '', line[5], line[6]"));
});

test('Metadata sau cài đặt không giữ trạng thái đang cài hoặc SHA cũ', () => {
  const source = fs.readFileSync(path.join(root, 'apps-script/installer.gs'), 'utf8');
  assert.ok(source.includes("['Trạng thái', 'Đã cài đặt']"));
  assert.ok(source.includes("['Mức xác minh', 'local_verified']"));
  assert.ok(source.includes("['G2 Google Sheets/Apps Script', 'BLOCKED_EXTERNAL']"));
  assert.ok(source.includes("getProperty('KD_SOURCE_COMMIT')"));
  assert.doesNotMatch(source, /Đang cài dữ liệu Demo|thay đổi local chưa commit|\b[0-9a-f]{40}\b/);
});
