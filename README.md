# GSheet Product Factory V2

Kho mã nguồn mới để tạo và kiểm chứng sản phẩm Google Sheets/Web App theo danh mục chuẩn trước khi đưa lên storefront.

## Vertical slice đầu tiên

- Nhóm: `C` — CRM, bán hàng & khách hàng
- Template gốc: `GROUP-C-SALES-CORE`
- Sản phẩm pilot: `GS-007` — Quản lý Báo giá
- Bản triển khai tham chiếu: `KD_BAO_GIA_DON_HANG 3.0.0-vi`

## Gate phát hành

1. `G0_SOURCE`: schema, fixture, module manifest và source cùng phiên bản.
2. `G1_LOCAL`: test nghiệp vụ và kiểm tra workbook đều đạt.
3. `G2_GOOGLE`: import vào Google Sheets và chạy Apps Script bằng tài khoản thật.
4. `G3_ASSET`: ghi Spreadsheet ID, template/copy URL và evidence vào registry.
5. `G4_STOREFRONT`: trang sản phẩm chỉ được publish sau khi G2–G3 đạt.

Hiện checkpoint này chỉ được phép công bố tới `G1_LOCAL`. Không dùng link giả, ID giả hoặc trạng thái production giả.

## Lệnh kiểm tra

```bash
npm test
npm run build:group-c
```
