# Template gốc Nhóm C

Template này là lõi dùng lại cho các sản phẩm CRM/bán hàng. Phiên bản đầu khóa một luồng dọc hoàn chỉnh:

`Khách hàng → Báo giá có revision/phê duyệt → Đơn hàng → Giao hàng → Thanh toán → Dashboard`

## Ranh giới module

| Module | Bảng chính | Trách nhiệm |
|---|---|---|
| customers | KHÁCH_HÀNG, NGƯỜI_DÙNG | Khách hàng và người phụ trách |
| products | SẢN_PHẨM | Danh mục, giá bán, giá vốn, VAT |
| quotations | BÁO_GIÁ, CHI_TIẾT_BÁO_GIÁ | Revision, chiết khấu, VAT, tổng tiền |
| approvals | BÁO_GIÁ, NHẬT_KÝ | Phê duyệt, từ chối, bất biến sau workflow |
| orders | ĐƠN_HÀNG, CHI_TIẾT_ĐƠN_HÀNG | Chuyển báo giá và theo dõi đơn |
| deliveries | GIAO_HÀNG, CHI_TIẾT_GIAO_HÀNG | Giao nhiều đợt, chặn giao vượt |
| payments | THANH_TOÁN | Chỉ khoản đã xác nhận làm giảm công nợ |
| dashboard | DASHBOARD | KPI, bộ lọc và biểu đồ |
| audit | NHẬT_KÝ | Bằng chứng thao tác đã che dữ liệu nhạy cảm |

## Trạng thái

- Workbook `.xlsx`: dùng để kiểm tra trực quan và import vào Google Sheets.
- `apps-script/installer.gs`: nguồn cài đặt native trong Google Sheets.
- Chưa có Spreadsheet ID thật cho tới khi chạy G2 bằng Google Drive/Apps Script.
