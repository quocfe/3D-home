import { functions, materials, product, vnd } from "./catalog";
import { type Kitchen } from "./domain";
import { quote } from "./pricing";
export const exclusions =
  "Không gồm thiết bị, chậu/vòi, mặt đá, góc chết/nẹp bù, lắp đặt, vận chuyển và VAT. Hình dựng chỉ minh họa thùng/cánh tủ, không phải bản vẽ thi công.";
export default function Quote({
  data,
  issues,
}: {
  data: Kitchen;
  issues: string[];
}) {
  const q = quote(data),
    count = data.zones.reduce((n, z) => n + z.modules.length, 0);
  return (
    <section className="quote" id="quote">
      <div className="panel-title">
        <span className="step">05</span>
        <div>
          <span className="eyebrow">CHI PHÍ THAM KHẢO</span>
          <h2>Báo giá theo vùng</h2>
        </div>
        <span className="badge">GIÁ DEMO</span>
      </div>
      <div className="quote-summary">
        <div>
          <span>
            {q.complete ? "Tổng giá module" : "Tạm cộng phần đã có giá"}
          </span>
          <strong data-testid="quote-total">{vnd(q.knownTotal)}</strong>
        </div>
        <span className="quote-status">
          {issues.length || !q.complete || !count
            ? "TẠM TÍNH · CẦN HOÀN THIỆN"
            : "CẤU HÌNH HỢP LỆ · GIÁ DEMO"}
        </span>
      </div>
      {!q.complete && (
        <p className="warning">
          Tổng chưa đầy đủ: có module chưa có giá, không được xem là 0 ₫.
        </p>
      )}
      <p className="fine">{exclusions}</p>
      <div className="quote-table">
        <table>
          <thead>
            <tr>
              <th>Vùng / module</th>
              <th>Kích thước & vật liệu</th>
              <th>Giá demo</th>
            </tr>
          </thead>
          <tbody>
            {q.zones.map((z) => (
              <ZoneRows key={z.zone.id} z={z} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine">
        Thùng MDF chống ẩm, cánh và phụ kiện cơ bản theo mô tả module. Giá niêm
        yết thử nghiệm, không phải đề nghị bán hàng; cần khảo sát thực tế trước
        khi đặt.
      </p>
    </section>
  );
}
function ZoneRows({ z }: { z: ReturnType<typeof quote>["zones"][number] }) {
  return (
    <>
      <tr className="zone-total">
        <th>
          {functions[z.zone.kind].name} · {z.zone.run}
        </th>
        <td>{z.lines.length} module</td>
        <td>
          {vnd(z.subtotal)}
          {!z.complete ? " + chưa có giá" : ""}
        </td>
      </tr>
      {z.lines.map((l) => {
        const p = product(l.module.productId)!,
          v = p.variants[l.module.variant];
        return (
          <tr key={l.module.id}>
            <td>{p.name}</td>
            <td>
              {v.w} × {v.h} × {v.d} mm
              <br />
              <small>{materials[l.module.finish].name}</small>
            </td>
            <td>{l.price === null ? "Chưa có giá" : vnd(l.price)}</td>
          </tr>
        );
      })}
    </>
  );
}
