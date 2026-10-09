# Web App Template đầu tiên — GS-007

## File cần dán vào Apps Script

- `Code.gs`: API backend, workflow, phân quyền, audit và ghi Google Sheets.
- `Index.html`: giao diện Dashboard, tạo và xử lý báo giá.
- `appsscript.json`: runtime V8, timezone và OAuth scope tối thiểu.

## Điều kiện trước khi deploy

1. Workbook `GROUP-C-SALES-CORE-1.0.0-vi.xlsx` đã được import thành Google Sheets.
2. Các sheet và header không đổi tên.
3. Apps Script được mở từ chính Google Sheets đó (container-bound).

## Cài đặt

1. Mở Google Sheets → **Extensions → Apps Script**.
2. Thay nội dung `Code.gs` bằng file cùng tên trong thư mục này.
3. Tạo file HTML tên chính xác `Index`, dán nội dung `Index.html`.
4. Bật hiển thị manifest trong Project Settings rồi cập nhật `appsscript.json` nếu cần.
5. Chạy `setupFirstWebAppTemplate()` một lần và cấp quyền.
6. Chạy `healthCheckWebApp()`. Kết quả phải có `ok: true`.
7. Deploy → New deployment → Web app.
8. Chọn **Execute as: User accessing the web app** và chỉ cho người dùng đã đăng nhập truy cập.

## Phân quyền

- `KINH DOANH`: lập báo giá, gửi duyệt, đánh dấu đã gửi/chấp nhận.
- `TRƯỞNG PHÒNG`, `SALES ADMIN`: thêm quyền duyệt hoặc từ chối.
- `KINH DOANH` chỉ xem và thao tác báo giá do mình tạo hoặc phụ trách.
- Người tạo không được tự duyệt.
- Email Google đăng nhập phải tồn tại trong sheet `NGƯỜI_DÙNG`.

Manifest xin quyền Google Sheets để Web App mở đúng Spreadsheet ID đã khóa trong Document Properties; không xin quyền Google Drive, Gmail hoặc dịch vụ ngoài dự án.

## Không được làm

- Không deploy “Anyone, even anonymous”.
- Không đổi header hoặc tên sheet sau khi deploy.
- Không nhúng Spreadsheet ID, mật khẩu hoặc token vào HTML.
- Không bật nút tải trên storefront trước khi hoàn thành kiểm thử G2.
