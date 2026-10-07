# Nếp — Trình bố trí phòng 3D

Demo chạy thật bằng **Vite + React + TypeScript + React Three Fiber/Drei + Zustand**. Giao diện tiếng Việt; một bố cục tự lưu trên trình duyệt, không backend, không Next.js, không tài khoản hay API trả phí.

## Mở bản demo

- Thư mục: `/home/dev/data/room-planner-demo`
- Bản xem trước: **http://localhost:5180/** (cũng dùng được `http://127.0.0.1:5180/`).
- Server bind `0.0.0.0`; máy khác cần dùng IP của máy chủ và được phép qua firewall. Không tự mở firewall.
- `localhost` và `127.0.0.1` là hai origin khác nhau: mỗi origin có bản tự lưu riêng.
- Thông tin tiến trình và kiểm chứng cuối cùng: `artifacts/verification.md`, `artifacts/server.json`.

## Chạy lại từ mã nguồn

Đã kiểm tra với Node 26 và npm 11. Vite 7 yêu cầu Node 20.19+ hoặc 22.12+; khuyến nghị Node LTS còn hỗ trợ.

```bash
cd /home/dev/data/room-planner-demo
npm ci
npm run dev -- --host 0.0.0.0 --port 5181
```

Dùng 5181 nếu bản preview 5180 vẫn đang chạy. Không dừng dịch vụ khác để lấy cổng.

```bash
npm run build
# Chạy ở cổng trống; lệnh này giữ terminal mở.
npm run preview -- --host 0.0.0.0 --port 5180 --strictPort
```

`dist/` là bản build tĩnh; có thể đưa lên static hosting. Preview hiện tại là tiến trình chạy nền của phiên làm việc, **không phải dịch vụ tự khởi động sau reboot**.

## Điều khiển

1. Sửa **Dài / Rộng / Cao**, nhấn **Áp dụng kích thước**. Đơn vị mét. Dài/rộng 0,5–30 m; cao 0,5–10 m.
2. Chọn món trong danh mục để hiện bản xem trước bán trong suốt. Di chuột trên sàn; viền xanh là hợp lệ, đỏ là vượt biên. Nhấp sàn đặt **đúng một món**, rồi tự thoát chế độ đặt. Nhấp đồ vật có sẵn không xuyên xuống sàn.
3. Nếu đồ vật chỉ vừa khi xoay, hệ thống tự chọn một góc vừa phòng khi bắt đầu đặt. Có thể xoay bản xem trước thêm 15°. Nếu không góc nào vừa hoặc món cao hơn trần, có thông báo và không vào chế độ đặt.
4. Nhấp đồ vật trong phòng hoặc danh sách **Trong phòng** để chọn. Viền xanh và bảng thuộc tính cho biết món đang chọn. Kéo chuột trái trên đồ vật để di chuyển theo mặt phẳng sàn **XZ**, không nâng theo Y. Ngưỡng 5 pixel phân biệt nhấp và kéo.
5. **−15° / +15°** xoay quanh trục Y; **Xóa đồ vật** hoặc phím **Delete** để xóa. Không cho đổi kích thước mô hình.
6. Khi kéo, camera bị khóa. Thả ở vị trí không hợp lệ sẽ quay về vị trí ban đầu. **Esc**, mất pointer capture, pointer cancel, rời canvas hoặc mất focus cửa sổ cũng hủy kéo và mở khóa camera.
7. **Esc** hủy đặt hoặc kéo. **Ctrl/Cmd Z** hoàn tác; **Ctrl/Cmd Shift Z** hoặc **Ctrl Y** làm lại. Mỗi thao tác hoàn tất tạo đúng một bước lịch sử; di chuyển chuột, chọn món và camera không tạo bước.
8. **Phối cảnh**: kéo trên vùng trống để orbit, chuột phải để pan, cuộn để zoom. **Mặt bằng**: camera orthographic nhìn từ trên xuống, không orbit; chuột phải pan và cuộn zoom. Đổi chế độ để trở về góc nhìn mặc định. Tường gần camera tự ẩn, mặt bằng luôn ẩn tường.
9. Thu nhỏ phòng **không dồn, xóa hay kẹp vị trí** đồ vật cũ. Món không vừa được đánh dấu đỏ và có cảnh báo. Có thể kéo món đó trở lại vùng hợp lệ. Nếu món nằm ngoài khung nhìn, thu nhỏ góc nhìn/pan để tìm hoặc hoàn tác kích thước phòng.

Không chặn va chạm giữa các đồ vật: có thể đặt chồng lên nhau theo chủ ý. Kiểm tra biên áp dụng cho toàn bộ hình chữ nhật đáy đã xoay, không chỉ tâm, đồng thời kiểm tra chiều cao.

## Lưu, nhập, xuất

- Một bản lưu `localStorage`, khóa `nep-layout-v1`, sau mỗi thao tác làm đổi bố cục. Lịch sử undo/redo chỉ nằm trong RAM và được đặt lại khi tải trang.
- Nút **Xuất bản vẽ** tải `nep-khong-gian.json` (dữ liệu bố cục, không phải PDF/CAD).
- **Nhập JSON** thay thế bố cục như một thao tác có thể hoàn tác. Tệp sai không làm đổi bố cục hiện tại.
- Giới hạn **100 đồ vật**, **100.000 byte UTF-8**. Kiểm tra version, số hữu hạn và khoảng hợp lệ, catalog ID cho phép, ID duy nhất, cấu trúc và trường không được phép. Không đọc URL mô hình, không tải mã hay asset từ nội dung import.
- Tệp hợp lệ về cấu trúc nhưng có món vượt biên được nhận và đánh dấu, nhằm hỗ trợ layout sau khi thu nhỏ phòng.
- Khi bộ nhớ bị chặn/đầy hoặc dữ liệu cũ hỏng, có cảnh báo. Đóng thông báo lỗi lưu không đổi trạng thái thành “đã lưu”. Hãy xuất JSON để giữ bản sao. Không đồng bộ đám mây hoặc đa tab.

Ví dụ schema v1:

```json
{
  "version": 1,
  "room": { "length": 6, "width": 5, "height": 2.8 },
  "items": [
    { "id": "sofa-1", "catalogId": "sofa", "x": 0, "z": -1, "angle": 0 }
  ]
}
```

Tọa độ gốc giữa sàn, Y hướng lên. `angle` tính bằng radian; import nhận −2π đến +2π. X/Z nhận −100 đến +100 để có thể giữ và sửa đồ vật nằm ngoài phòng. ID gồm chữ ASCII/số/gạch dưới/gạch ngang, dài 1–80 ký tự.

## Danh mục và mô hình

| ID | Món | Rộng X × sâu Z × cao Y (m) |
|---|---|---|
| sofa | Sofa Mây | 2,2 × 0,9 × 0,85 |
| coffee | Bàn trà Sồi | 1,1 × 0,6 × 0,42 |
| chair | Ghế An | 0,55 × 0,55 × 0,85 |
| desk | Bàn làm việc | 1,4 × 0,7 × 0,75 |
| bed | Giường Êm | 1,6 × 2,1 × 0,95 |
| wardrobe | Tủ áo Gỗ | 1,6 × 0,6 × 2,1 |
| shelf | Kệ Mộc | 0,9 × 0,35 × 1,8 |

Các mô hình được dựng **procedural từ khối hộp** (chân, đệm, tựa, cửa, kệ, sách), gốc ở giữa đáy và theo mét thật. **Không phải GLB**, không dùng model bên ngoài. Thumbnail SVG được chiếu từ cùng cấu trúc hình học. Unit test xác nhận mọi bộ phận nằm trong kích thước công bố, kể cả tay nắm tủ. Chữ Be Vietnam Pro lấy từ Google Fonts; nếu mất mạng sẽ dùng Arial. Logic, scene và lưu trữ không cần dịch vụ bên ngoài.

## Kiểm thử tái lập

```bash
npm test
npm run build
npx playwright install chromium
# Giữ server 5180 đang chạy ở terminal khác:
npm run test:browser
# Hoặc chỉ định server của bạn:
BASE_URL=http://127.0.0.1:5181 npm run test:browser
```

Playwright cấu hình Chromium + ANGLE SwiftShader để chạy WebGL trong môi trường không GPU. Trên Linux mới, nếu thiếu thư viện hệ thống, hãy cài theo hướng dẫn Playwright; dự án không tự chạy sudo.

- Unit: hình chữ nhật xoay/chiều cao; tìm góc vừa kể cả chỉ vừa đường chéo; schema và giới hạn import; lịch sử/undo/redo; giữ vị trí khi thu nhỏ; lưu trữ lỗi; kích thước bộ phận; tạo ID trên origin HTTP LAN không có `randomUUID`.
- Browser: đặt một lần; không xuyên đồ vật; invalid placement; chọn/xoay/xóa; kéo hợp lệ/không hợp lệ; Esc/blur/pointercancel/lost capture/rời canvas; ngưỡng click-drag; camera hoạt động lại; phòng thu nhỏ; góc xoay bị từ chối; đồ quá to/quá cao; góc đặt tự động; import/export/reload; lỗi storage; responsive; scene 20 món.
- Chu trình test-first đã được thực hiện cho hình học, parser, store/lịch sử, persistence và các luồng UI/drag chính: chạy test thất bại trước khi thêm phần triển khai tương ứng. Các test hồi quy bổ sung cũng bắt được tay nắm vượt kích thước, thiếu `randomUUID` trên HTTP LAN và chỉ báo tự lưu sai sau khi đóng cảnh báo.
- `playwright-report/index.html`: báo cáo HTML lần chạy mới nhất; trace/screenshot khi lỗi ở `test-results/`.
- `artifacts/workspace.png`, `top-view.png`, `responsive.png`, `20-items.png`: ảnh chụp trình duyệt thật.
- `artifacts/performance.json`: phép đo requestAnimationFrame trong scene 20 món, renderer, viewport, số frame và thời gian mẫu. **Không xem đây là đảm bảo FPS trên GPU thật**; SwiftShader chạy phần mềm, hiệu năng tùy máy và tải hệ thống.

## Kiến trúc

```text
src/core.ts          Kiểu dữ liệu, catalog, hình học thuần, kiểm tra JSON
src/store.ts         Zustand vanilla, thao tác nguyên tử, lịch sử tối đa 100 bước
src/persistence.ts   Adapter localStorage độc lập khỏi scene
src/runtime.ts       Kết nối store với React và browser storage
src/furniture.tsx    Bộ phận mô hình procedural + thumbnail cùng dữ liệu
src/Scene.tsx        R3F scene, camera, sàn, tường, outline, preview
src/useFloorDrag.ts  Giao dịch drag tạm thời, ray/plane, khóa/mở camera
src/App.tsx          UI ba cột, bảng thuộc tính, phím tắt, import/export
src/style.css        Thiết kế warm-neutral/teal, responsive
```

Điểm quan trọng: pointermove chỉ cập nhật draft trong scene, không ghi layout/store/history/storage. Khi thả hợp lệ, store commit một lần. Hủy bỏ chỉ xóa draft. `fits()` dùng nửa kích thước bao theo `abs(cos θ)`/`abs(sin θ)`; tương đương kiểm tra tất cả góc của hình chữ nhật xoay trong phòng chữ nhật. `fittingAngle()` tìm các giao điểm biên lượng giác, không lấy mẫu góc thưa nên không bỏ sót trường hợp vừa theo đường chéo.

## Giới hạn chủ ý / chưa nghiệm thu

- Desktop là mục tiêu chính. Bố cục responsive đã kiểm tra; **không nghiệm thu chỉnh sửa touch/mobile đầy đủ**. Browser tự động chỉ Chromium, chưa Firefox/Safari hoặc thiết bị GPU thật.
- Không model GLB/PBR cao cấp, texture gỗ thật, resize, phòng đa giác, cửa/cửa sổ, tầng, va chạm đồ vật, CAD, PDF, project manager, backend hay cộng tác.
- Tối đa 100 món là giới hạn dữ liệu, không phải cam kết FPS ở 100 món. Scene 20 món đã đo trên SwiftShader; xem số thực trong báo cáo.
- Bundle WebGL lớn: Vite có thể cảnh báo chunk trên 500 KB; build vẫn hợp lệ.
- Mất WebGL context hoặc driver lỗi có thể cần tải lại trang. Không tự phục hồi GPU context được nghiệm thu.
- Server preview không tự khởi động lại sau reboot. Không thay đổi dịch vụ khác, không push GitHub, không mở firewall.
