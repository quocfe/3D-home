# Nếp — Cấu hình tủ bếp module

Demo **Vite + React + TypeScript + React Three Fiber/Drei + Zustand**, giao diện tiếng Việt. Đây là bộ cấu hình bếp thẳng/chữ L theo module, **không còn là trình đặt đồ tự do trong phòng**. Không backend, tài khoản, API trả phí, asset/model hoặc font tải ngoài. Mô hình 3D dựng bằng các khối procedural; chưa có AI ảnh → 3D.

## Chạy demo

- URL trên máy chủ: **http://localhost:5180/** hoặc **http://127.0.0.1:5180/**.
- Hai hostname có localStorage riêng. Máy khác cần IP máy chủ và quyền truy cập mạng; không tự mở firewall.
- Thư mục: `/home/dev/data/room-planner-demo`.
- Preview bind `0.0.0.0`, phục vụ `dist/`; không tự khởi động sau reboot.

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5181 --strictPort
# Bản production:
npm run build
npm run preview -- --host 0.0.0.0 --port 5180 --strictPort
```

Không chạy thêm preview nếu cổng 5180 đang dùng. Đã kiểm tra với Node 26.9.0 / npm 11.19.1; khi triển khai hãy dùng Node được các dependency trong lockfile hỗ trợ.

## Quy trình sử dụng

1. Chọn **Thẳng / Chữ L**, nhập chiều dài nhánh bằng **mm**, Enter hoặc rời ô để áp dụng. Chiều dài nhánh 1.000–10.000 mm; rộng vùng 100–10.000 mm.
2. Năm vùng cố định: **Thực phẩm, Dụng cụ, Rửa, Sơ chế, Nấu**. Chọn nhánh, đổi thứ tự bằng mũi tên và phân bổ chiều rộng. Thứ tự trên mỗi nhánh tính từ góc/đầu trái ra ngoài.
3. Nhấp vùng trên mặt đứng, chú giải hoặc danh sách để lọc danh mục tương thích. Thêm nhiều module vào một vùng; có thể sao chép, xóa, đổi thứ tự hoặc chuyển sang vùng tương thích.
4. Chọn biến thể **rộng × cao × sâu**, vật liệu/màu hoàn thiện. Mỗi biến thể có kích thước cố định, không kéo giãn. Giá và hình cập nhật ngay.
5. Đọc dung lượng từng tầng và các cảnh báo trước khi xem bảng giá từng module, từng vùng và tổng. **Giá là số liệu demo, không phải báo giá thi công.**

### Quy tắc bố trí

- Bếp L giữ **góc chết 650 × 650 mm**, trừ 650 mm đầu **cả hai nhánh, cả tầng dưới và trên**. Nhãn hiển thị chiều dài hữu dụng riêng với tổng chiều dài. Góc không có tủ; nẹp bù chưa tính giá.
- Tủ dưới và tủ trên xếp độc lập từ đầu vùng. Tủ cao chiếm tầng dưới và chặn phần tầng trên giao với nó. Không tự chèn khoảng trống; đổi thứ tự tủ dưới/cao để tránh chặn.
- Thêm mới không vừa bị chặn kèm lý do. Thu nhỏ, đổi kiểu, đổi biến thể, chuyển vùng hoặc nhập cấu hình **không xóa sản phẩm đã chọn**: giữ dữ liệu và báo lỗi để sửa. Nhánh B khi chuyển về bếp thẳng vẫn được giữ trong dữ liệu, không dựng trong 3D.
- Mặt đứng SVG trực giao trên nền sáng là trình chỉnh sửa chính. 3D tổng thể tải lười, kéo để xoay/cuộn để zoom/nhấp tủ để chọn vùng. Nếu khởi tạo WebGL lỗi, giao diện vẫn hoạt động và có thể quay về **Trực diện**.
- **Hoàn tác / Làm lại** hoặc Ctrl/Cmd Z, Ctrl/Cmd Shift Z, Ctrl Y; tối đa 100 bước, không lưu lịch sử qua reload.

## Danh mục và giá

`src/kitchen/catalog.ts` là nguồn dữ liệu: tủ kho cao, tủ dưới hai cánh, tủ ba ngăn kéo, khoang chậu rửa, khoang bếp, tủ trên hai cánh và tủ kính mẫu. Vật liệu/màu là các gói kết hợp Melamine trắng ấm, Laminate vân sồi, Laminate xanh xám; không phải hai bộ chọn độc lập. Các biến thể hiện tại chủ yếu khác chiều rộng; cao/sâu cố định theo dòng tủ.

Giá VND nguyên = giá biến thể + phụ thu hoàn thiện từng module. Tủ kính mẫu có giá `null`: bảng ghi **Chưa có giá**, tổng chuyển sang **Tạm cộng phần đã có giá**, không coi giá thiếu là 0. Tình trạng đủ giá và tình trạng bố trí hợp lệ được xét riêng.

**Không gồm** thiết bị, chậu/vòi, mặt đá, phụ kiện bổ sung, góc chết/nẹp bù, lắp đặt, vận chuyển và VAT. Cần khảo sát thực tế và xác nhận đơn vị thi công.

## Tự lưu, nhập và xuất

- Khóa mới **`nep-kitchen-v1`**; không đụng bản phòng cũ `nep-layout-v1`.
- Xuất **`nep-bep-v1.json`**; schema `version: 1`, `catalogVersion`, `shape`, `runs`, `zones`. Trong mỗi vùng có `id`, `kind`, `run`, `width`, `modules`; module có `id`, `productId`, `variant`, `finish`.
- Nhập được kiểm tra toàn bộ trước khi thay trạng thái, có thể hoàn tác một bước. Tệp sai không thay cấu hình hoặc bản tự lưu.
- Giới hạn 100.000 byte UTF-8, 100 module, đúng năm loại vùng không trùng, ID duy nhất, số nguyên trong khoảng, catalog/variant/finish được cho phép; từ chối trường lạ, URL asset và giá do tệp cung cấp.
- Tệp khác catalogVersion được cảnh báo và tính lại theo danh mục hiện tại. Giá không lưu trong JSON.
- Cấu hình sai hình học nhưng đúng schema được giữ và báo lỗi, không tự sửa/xóa.
- Nếu localStorage bị chặn/đầy, chỉ báo không nhận là đã lưu; hãy xuất JSON. Dữ liệu hỏng được giữ đến lần chỉnh sửa tiếp theo. Không đồng bộ đám mây/đa tab.

## Kiểm thử

```bash
npm test
npm run build
npx playwright install chromium
# Preview production 5180 phải đang chạy:
npm run test:browser
# Hoặc:
BASE_URL=http://127.0.0.1:5181 npm run test:browser
```

Kết quả phiên hoàn thiện: **27 unit test / 6 file**, **11 browser test**, build TypeScript/Vite thành công. Browser chạy trên bản production tại 5180 bằng Chromium + ANGLE SwiftShader. Có test mất WebGL, storage lỗi, import nguyên tử, sửa/giữ module khi thu nhỏ/chuyển kiểu, tầng độc lập/tủ cao, báo giá thiếu và cấu hình hoàn chỉnh.

- `artifacts/verification-kitchen.md`: báo cáo thực nghiệm và giới hạn.
- `artifacts/kitchen-*-tests.log`, `artifacts/kitchen-build.log`: log kiểm thử/build.
- `artifacts/kitchen-full.png`, `kitchen-3d-detail.png`, `kitchen-mobile.png`: ảnh trình duyệt thật.
- `playwright-report/`, `test-results/`: báo cáo lần chạy gần nhất.

Artifacts, dist, node_modules và tệp môi trường không commit. Artifact phòng cũ có thể còn trong máy; chỉ dùng file `kitchen-*` và `verification-kitchen.md` cho bản này.

## Kiến trúc

```text
src/kitchen/catalog.ts       Catalog/biến thể/vật liệu/giá demo
src/kitchen/domain.ts        Bố trí theo nhánh/tầng, góc chết, kiểm tra dung lượng
src/kitchen/pricing.ts       Giá module và tổng phần đã biết
src/kitchen/persistence.ts   Parser chặt chẽ, storage adapter
src/kitchen/store.ts         Giao dịch chỉnh sửa, lịch sử, import nguyên tử
src/kitchen/runtime.ts       Kết nối React và browser storage
src/kitchen/Elevation.tsx    Mặt đứng SVG, chọn vùng
src/kitchen/model.ts         Hình học procedural theo kích thước variant
src/kitchen/KitchenScene.tsx Tổng thể R3F, camera và chọn vùng
src/kitchen/SceneBoundary.tsx Cô lập lỗi khởi tạo 3D khỏi editor
src/kitchen/ModulePanel.tsx  Danh mục lọc và chỉnh từng module
src/kitchen/Quote.tsx        Bảng giá demo có cảnh báo
src/kitchen/App.tsx          Quy trình cấu hình, import/export, phím tắt
```

## Giới hạn

- Mô hình minh họa, không GLB/PBR/texture thật; không thiết kế điện/nước, thiết bị, cửa mở, công thái học hoặc bản vẽ sản xuất. Không AI ảnh → 3D, PDF/CAD, cộng tác hay backend.
- Chỉ bếp thẳng/L, năm vùng cố định và catalog demo nhỏ. Không bếp đảo/U, module góc chức năng, thay chiều cao lắp đặt hoặc chỉnh offset tự do.
- Chromium desktop đã nghiệm thu; responsive 390 px đã kiểm tra không tràn ngang nhưng chưa nghiệm thu touch đầy đủ, Safari/Firefox hoặc GPU thật. Mobile là trang cuộn dài.
- Cô lập lỗi khởi tạo WebGL đã kiểm tra; tự phục hồi context bị mất giữa phiên chưa nghiệm thu. 100 module là giới hạn dữ liệu, không cam kết FPS.
- Chunk 3D trên 500 kB tạo cảnh báo Vite; tải lười nên không chặn trình chỉnh sửa SVG ban đầu.
