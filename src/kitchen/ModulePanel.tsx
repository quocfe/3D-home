import { useState } from "react";
import {
  catalog,
  functions,
  layerName,
  materials,
  product,
  vnd,
  type Finish,
  type Product,
} from "./catalog";
import {
  canAdd,
  layout,
  upperFree,
  type Kitchen,
  type Module,
  type Zone,
} from "./domain";
import { price } from "./pricing";
import { newId } from "./store";
type Props = {
  data: Kitchen;
  zone: Zone;
  edit: (fn: (s: Kitchen) => void) => void;
  notify: (s: string) => void;
};
function ProductCard({ p, data, zone, edit, notify }: Props & { p: Product }) {
  const [variant, setVariant] = useState(0),
    [finish, setFinish] = useState<Finish>("melamine");
  const m: Module = { id: "preview", productId: p.id, variant, finish };
  const error = canAdd(data, zone.id, m);
  const cost = price(m);
  return (
    <article className="product-card">
      <div className="product-top">
        <div
          className={`cabinet-icon ${p.layer}`}
          style={{ background: materials[finish].color }}
        >
          <i />
          <i />
        </div>
        <div>
          <span className="eyebrow">{layerName[p.layer]}</span>
          <h3>{p.name}</h3>
          <p>{p.detail}</p>
        </div>
      </div>
      <label className="compact-label">
        Rộng × cao × sâu (mm)
        <select
          aria-label={`Biến thể ${p.name}`}
          value={variant}
          onChange={(e) => setVariant(Number(e.target.value))}
        >
          {p.variants.map((v, i) => (
            <option key={i} value={i}>
              {v.w} × {v.h} × {v.d}
            </option>
          ))}
        </select>
      </label>
      <select
        aria-label={`Vật liệu ${p.name}`}
        value={finish}
        onChange={(e) => setFinish(e.target.value as Finish)}
      >
        {Object.entries(materials).map(([id, m]) => (
          <option key={id} value={id}>
            {m.name}
          </option>
        ))}
      </select>
      <div className="product-bottom">
        <strong>{cost === null ? "Chưa có giá" : vnd(cost)}</strong>
        <button
          className="primary"
          aria-label={`Thêm ${p.name} vào khu`}
          disabled={!!error}
          onClick={() => {
            edit((s) =>
              s.zones
                .find((z) => z.id === zone.id)!
                .modules.push({ ...m, id: newId() }),
            );
            notify(`Đã thêm ${p.name}.`);
          }}
        >
          Thêm vào khu
        </button>
      </div>
      {error && <p className="fit-note">{error}</p>}
    </article>
  );
}
export default function ModulePanel(props: Props) {
  const { data, zone, edit } = props;
  const positions = layout(data).filter((p) => p.zone.id === zone.id);
  const lower = positions
      .filter((p) => p.layer !== "wall")
      .reduce((n, p) => n + p.width, 0),
    upper = positions
      .filter((p) => p.layer === "wall")
      .reduce((n, p) => n + p.width, 0);
  const change = (id: string, fn: (m: Module) => void) =>
    edit((s) =>
      fn(
        s.zones
          .find((z) => z.id === zone.id)!
          .modules.find((m) => m.id === id)!,
      ),
    );
  return (
    <div className="catalog-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">SẢN PHẨM TRONG KHU</span>
          <h2>Đã chọn cho Khu {functions[zone.kind].name}</h2>
        </div>
        <span
          className="zone-dot"
          style={{ background: functions[zone.kind].color }}
        />
      </div>
      <p>
        {functions[zone.kind].hint} · Nhánh {zone.run}
      </p>
      <div className="capacity">
        <span>
          Dưới/cao còn{" "}
          <b className={lower > zone.width ? "danger" : ""}>
            {zone.width - lower} mm
          </b>
        </span>
        <span>
          Trên trống{" "}
          <b className={upper > zone.width ? "danger" : ""}>
            {upperFree(data, zone.id)} mm
          </b>
        </span>
      </div>
      <p className="fine">
        Khoảng trống tầng trên đã trừ tủ cao. Tủ mỗi tầng xếp liên tiếp từ đầu
        vùng; đổi thứ tự tủ dưới/cao nếu bị chắn. Đổi biến thể hoặc chuyển vùng
        vẫn giữ module và báo lỗi nếu không vừa.
      </p>
      <h3 className="section-label">Đã chọn · {zone.modules.length} sản phẩm</h3>
      {!zone.modules.length && (
        <p className="empty-note">
          Khu này chưa có sản phẩm. Chọn trực tiếp từ danh mục bên dưới để bắt đầu.
        </p>
      )}
      {zone.modules.map((m, index) => {
        const p = product(m.productId)!;
        return (
          <article className="module-row" data-testid="module-row" key={m.id}>
            <div className="row">
              <strong>{p.name}</strong>
              <button
                aria-label={`Xóa ${p.name}`}
                onClick={() =>
                  edit((s) => {
                    const z = s.zones.find((z) => z.id === zone.id)!;
                    z.modules = z.modules.filter((x) => x.id !== m.id);
                  })
                }
              >
                ×
              </button>
            </div>
            <label className="compact-label">
              Kích thước cố định
              <select
                aria-label="Biến thể module"
                value={m.variant}
                onChange={(e) =>
                  change(m.id, (x) => {
                    x.variant = Number(e.target.value);
                  })
                }
              >
                {p.variants.map((v, i) => (
                  <option key={i} value={i}>
                    {v.w} × {v.h} × {v.d} mm
                  </option>
                ))}
              </select>
            </label>
            <select
              aria-label="Vật liệu module"
              value={m.finish}
              onChange={(e) =>
                change(m.id, (x) => {
                  x.finish = e.target.value as Finish;
                })
              }
            >
              {Object.entries(materials).map(([id, v]) => (
                <option key={id} value={id}>
                  {v.name}
                </option>
              ))}
            </select>
            <div className="row">
              <select
                aria-label="Chuyển module sang vùng"
                value={zone.id}
                onChange={(e) =>
                  edit((s) => {
                    const from = s.zones.find((z) => z.id === zone.id)!;
                    const to = s.zones.find((z) => z.id === e.target.value)!;
                    from.modules = from.modules.filter((x) => x.id !== m.id);
                    to.modules.push(m);
                  })
                }
              >
                {data.zones
                  .filter((z) => p.kind.includes(z.kind))
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {functions[z.kind].name}
                    </option>
                  ))}
              </select>
              <button
                disabled={index === 0}
                aria-label={`Dịch trái module ${index + 1}`}
                onClick={() =>
                  edit((s) => {
                    const ms = s.zones.find((z) => z.id === zone.id)!.modules;
                    [ms[index - 1], ms[index]] = [ms[index], ms[index - 1]];
                  })
                }
              >
                ←
              </button>
              <button
                disabled={index === zone.modules.length - 1}
                aria-label={`Dịch phải module ${index + 1}`}
                onClick={() =>
                  edit((s) => {
                    const ms = s.zones.find((z) => z.id === zone.id)!.modules;
                    [ms[index + 1], ms[index]] = [ms[index], ms[index + 1]];
                  })
                }
              >
                →
              </button>
            </div>
            <button
              className="text-button"
              disabled={
                !!canAdd(data, zone.id, { ...m, id: "copy" }) ||
                data.zones.reduce((n, z) => n + z.modules.length, 0) >= 100
              }
              onClick={() =>
                edit((s) =>
                  s.zones
                    .find((z) => z.id === zone.id)!
                    .modules.push({ ...m, id: newId() }),
                )
              }
            >
              + Thêm bản sao
            </button>
            <span className="module-price">
              {price(m) === null ? "Chưa có giá" : vnd(price(m)!)}
            </span>
          </article>
        );
      })}
      <h3 className="section-label">Sản phẩm phù hợp với khu này</h3>
      <p className="fine">
        Giá demo / module. Phụ thu vật liệu đã tính trong giá.
      </p>
      {catalog
        .filter((p) => p.kind.includes(zone.kind))
        .map((p) => (
          <ProductCard key={zone.id + p.id} {...props} p={p} />
        ))}
    </div>
  );
}
