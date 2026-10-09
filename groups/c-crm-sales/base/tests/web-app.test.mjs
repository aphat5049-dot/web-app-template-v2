import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const baseDir = path.resolve(import.meta.dirname, '..');
const codePath = path.join(baseDir, 'web-app/Code.gs');
const htmlPath = path.join(baseDir, 'web-app/Index.html');
const manifestPath = path.join(baseDir, 'web-app/appsscript.json');
const source = fs.readFileSync(codePath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

function loadHelpers() {
  const context = vm.createContext({ console });
  new vm.Script(source + '\nthis.__testApi={calculateLineWeb_,validateTransitionWeb_,sanitizeCellWeb_,rateWeb_,requiredTextWeb_,canAccessQuoteWeb_};', { filename: codePath }).runInContext(context);
  return context.__testApi;
}

test('Code.gs có cú pháp JavaScript hợp lệ và đủ public API', () => {
  assert.doesNotThrow(() => new vm.Script(source, { filename: codePath }));
  for (const name of ['doGet', 'setupFirstWebAppTemplate', 'healthCheckWebApp', 'getBootstrapData', 'createQuote', 'getQuoteDetails', 'transitionQuote', 'convertQuoteToOrder']) {
    assert.match(source, new RegExp(`function\\s+${name}\\s*\\(`), name);
  }
});

test('Oracle dòng báo giá 2 × 100.000, giảm 10%, VAT 8% = 194.400', () => {
  const api = loadHelpers();
  assert.deepEqual(JSON.parse(JSON.stringify(api.calculateLineWeb_(2, 100000, 0.1, 0.08))), {
    subtotal: 200000,
    discountAmount: 20000,
    netBeforeVat: 180000,
    vatAmount: 14400,
    total: 194400
  });
});

test('Validation chặn số âm, tỷ lệ ngoài 0–1 và nội dung bắt buộc trống', () => {
  const api = loadHelpers();
  assert.throws(() => api.calculateLineWeb_(0, 100000, 0, 0.08), /lớn hơn 0/);
  assert.throws(() => api.rateWeb_(1.01, 'Chiết khấu'), /0–1/);
  assert.throws(() => api.requiredTextWeb_(' ', 'Mã'), /bắt buộc/);
});

test('Workflow chặn nhảy trạng thái, tự duyệt và từ chối thiếu lý do', () => {
  const api = loadHelpers();
  assert.throws(() => api.validateTransitionWeb_('NHÁP', 'CHẤP NHẬN', 'TRƯỞNG PHÒNG', 'NV-1', 'NV-2', ''), /không hợp lệ/);
  assert.throws(() => api.validateTransitionWeb_('CHỜ DUYỆT', 'ĐÃ DUYỆT', 'TRƯỞNG PHÒNG', 'NV-1', 'NV-1', ''), /không được tự duyệt/);
  assert.throws(() => api.validateTransitionWeb_('CHỜ DUYỆT', 'TỪ CHỐI', 'SALES ADMIN', 'NV-1', 'NV-2', ''), /bắt buộc/);
  assert.equal(api.validateTransitionWeb_('CHỜ DUYỆT', 'ĐÃ DUYỆT', 'TRƯỞNG PHÒNG', 'NV-1', 'NV-2', ''), true);
});

test('Dữ liệu bắt đầu bằng ký tự công thức được vô hiệu hóa', () => {
  const api = loadHelpers();
  for (const value of ['=IMPORTXML("x")', '+1+1', '-2+2', '@SUM(A:A)']) assert.ok(api.sanitizeCellWeb_(value).startsWith("'"));
  assert.equal(api.sanitizeCellWeb_('Nội dung an toàn'), 'Nội dung an toàn');
});

test('Nhân viên chỉ truy cập báo giá do mình tạo hoặc phụ trách; quản lý xem toàn bộ', () => {
  const api = loadHelpers();
  const quote = { 'Người phụ trách': 'NV-003', 'Người tạo': 'NV-004' };
  assert.equal(api.canAccessQuoteWeb_(quote, { id: 'NV-003', role: 'KINH DOANH' }), true);
  assert.equal(api.canAccessQuoteWeb_(quote, { id: 'NV-004', role: 'KINH DOANH' }), true);
  assert.equal(api.canAccessQuoteWeb_(quote, { id: 'NV-005', role: 'KINH DOANH' }), false);
  assert.equal(api.canAccessQuoteWeb_(quote, { id: 'NV-001', role: 'TRƯỞNG PHÒNG' }), true);
});

test('Index.html có JavaScript hợp lệ và gọi đúng API backend', () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0], { filename: htmlPath }));
  for (const api of ['getBootstrapData', 'createQuote', 'getQuoteDetails', 'transitionQuote', 'convertQuoteToOrder']) assert.match(html, new RegExp(`['\"]${api}['\"]`));
  assert.match(html, /textContent/);
  assert.doesNotMatch(html, /document\.write\(|eval\(|localStorage\.(setItem|getItem)\(/);
});

test('Manifest dùng V8, timezone Việt Nam và không xin quyền Drive rộng', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.runtimeVersion, 'V8');
  assert.equal(manifest.timeZone, 'Asia/Ho_Chi_Minh');
  assert.deepEqual(manifest.oauthScopes, [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email'
  ]);
});
