import { useEffect, useRef, useState } from "react";
import Scene, { type Placement } from "./Scene";
import {
  catalog,
  fits,
  fittingAngle,
  MAX_BYTES,
  type CatalogId,
  type Room,
} from "./core";
import { planner, usePlanner, persist, bootError } from "./runtime";
import { Thumbnail } from "./furniture";
const fmt = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
export default function App() {
  const { layout, selected, past, future, message } = usePlanner((s) => s);
  const [top, setTop] = useState(false),
    [walls, setWalls] = useState(true),
    [placement, setPlacement] = useState<Placement | null>(null),
    [busy, setBusy] = useState(false),
    [cancelToken, setCancelToken] = useState(0),
    [storageError, setStorageError] = useState(bootError),
    [query, setQuery] = useState("");
  const [storageDismissed, setStorageDismissed] = useState(false);
  const [room, setRoom] = useState<Room>(layout.room),
    input = useRef<HTMLInputElement>(null);
  const item = layout.items.find((i) => i.id === selected),
    spec = item ? catalog[item.catalogId] : null;
  const invalid = layout.items.filter(
    (i) => !fits(layout.room, catalog[i.catalogId], i),
  );
  useEffect(() => {
    setRoom(layout.room);
  }, [layout.room]);
  useEffect(() => {
    return planner.subscribe((s, old) => {
      if (s.layout !== old.layout) {
        setStorageError(persist());
        setStorageDismissed(false);
      }
    });
  }, []);
  const cancel = () => {
    setPlacement(null);
    setCancelToken((t) => t + 1);
    setBusy(false);
  };
  const undo = () => {
      cancel();
      planner.getState().undo();
    },
    redo = () => {
      cancel();
      planner.getState().redo();
    };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (e.key === "Escape") {
        cancel();
        return;
      }
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" && !busy && !placement && selected)
        planner.getState().remove(selected);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, busy, placement]);
  const choose = (id: CatalogId) => {
    cancel();
    const angle = fittingAngle(layout.room, catalog[id]);
    if (angle === null) {
      planner
        .getState()
        .notify(
          catalog[id].h > layout.room.height
            ? "Không thể đặt: đồ vật cao hơn trần phòng."
            : "Không thể đặt: kích thước quá lớn, kể cả khi xoay.",
        );
      return;
    }
    planner.getState().notify("");
    setPlacement({ catalogId: id, x: 0, z: 0, angle });
  };
  const rotate = (delta: number) => {
    if (busy) return;
    if (placement) {
      setPlacement({
        ...placement,
        angle: (placement.angle + delta + Math.PI * 2) % (Math.PI * 2),
      });
      return;
    }
    if (item)
      planner
        .getState()
        .transform(item.id, {
          x: item.x,
          z: item.z,
          angle: (item.angle + delta + Math.PI * 2) % (Math.PI * 2),
        });
  };
  const exportJson = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(layout, null, 2)], { type: "application/json" }),
    );
    a.download = "nep-khong-gian.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="app">
      <header className="header">
        <a className="brand" href="/" aria-label="Nếp — trang chính">
          <span className="brand-mark">n</span>
          <span>
            nếp<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="header-divider" />
        <div>
          <span className="eyebrow">STUDIO KHÔNG GIAN</span>
          <h1>Không gian của bạn</h1>
        </div>
        <div className="header-actions">
          <span
            className={"save-state " + (storageError ? "error" : "")}
            title={storageError || "Tự lưu sau mỗi thay đổi"}
          >
            {storageError ? "● Chưa lưu" : "● Tự lưu trên máy"}
          </span>
          <button onClick={() => input.current?.click()} disabled={busy}>
            Nhập JSON
          </button>
          <button className="primary" onClick={exportJson}>
            Xuất bản vẽ <span>↗</span>
          </button>
          <input
            ref={input}
            aria-label="Nhập tệp JSON"
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              cancel();
              if (f.size > MAX_BYTES) {
                planner.getState().notify("Tệp vượt quá 100 KB.");
                return;
              }
              try {
                planner.getState().importText(await f.text());
              } catch {
                planner.getState().notify("Không đọc được tệp.");
              }
            }}
          />
        </div>
      </header>
      <main className="workspace">
        <aside className="catalog-panel">
          <div className="panel-heading">
            <span className="eyebrow">01 / BỘ SƯU TẬP</span>
            <h2>
              Đồ nội thất <span>7</span>
            </h2>
            <p>Chọn một món, đặt vào không gian.</p>
          </div>
          <label className="search">
            <span>⌕</span>
            <input
              aria-label="Tìm đồ nội thất"
              placeholder="Tìm đồ nội thất…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="catalog-list">
            {(
              Object.entries(catalog) as [
                CatalogId,
                (typeof catalog)[CatalogId],
              ][]
            )
              .filter(([, v]) =>
                v.name
                  .toLocaleLowerCase("vi")
                  .includes(query.toLocaleLowerCase("vi")),
              )
              .map(([id, v]) => (
                <button
                  className={
                    "catalog-card " +
                    (placement?.catalogId === id ? "active" : "")
                  }
                  data-testid={"catalog-" + id}
                  key={id}
                  onClick={() => choose(id)}
                  disabled={busy}
                >
                  <div className="thumb">
                    <Thumbnail id={id} />
                  </div>
                  <div className="catalog-info">
                    <small>{v.category}</small>
                    <strong>{v.name}</strong>
                    <span>
                      {fmt(v.w)} × {fmt(v.d)} × {fmt(v.h)} m
                    </span>
                  </div>
                  <span className="add-symbol">+</span>
                </button>
              ))}
          </div>
          <div className="catalog-note">
            <span className="small-circle">i</span>
            <p>
              Kích thước thực, cố định.
              <br />
              Tự do bố trí, không đổi tỷ lệ.
            </p>
          </div>
        </aside>
        <section className="canvas-panel" aria-label="Không gian thiết kế">
          <div className="canvas-toolbar">
            <div className="segmented">
              <button
                aria-pressed={!top}
                onClick={() => {
                  cancel();
                  setTop(false);
                }}
              >
                Phối cảnh
              </button>
              <button
                aria-pressed={top}
                onClick={() => {
                  cancel();
                  setTop(true);
                }}
              >
                Mặt bằng
              </button>
            </div>
            <div className="tools">
              <button
                aria-label="Hoàn tác"
                title="Hoàn tác · Ctrl Z"
                onClick={undo}
                disabled={!past.length}
              >
                ↶
              </button>
              <button
                aria-label="Làm lại"
                title="Làm lại · Ctrl Shift Z"
                onClick={redo}
                disabled={!future.length}
              >
                ↷
              </button>
              <span className="tool-divider" />
              <button
                className="wall-toggle"
                aria-pressed={walls}
                onClick={() => setWalls(!walls)}
                disabled={top}
              >
                {walls ? "Ẩn tường" : "Hiện tường"}
              </button>
            </div>
          </div>
          <div
            className={
              "scene " +
              (placement ? "placing" : "") +
              (busy ? " dragging" : "")
            }
            data-testid="scene"
            data-orbit-locked={busy || !!placement}
          >
            <Scene
              top={top}
              walls={walls}
              placement={placement}
              setPlacement={setPlacement}
              onBusy={setBusy}
              cancelToken={cancelToken}
            />
            <div className="view-label">
              <span className="eyebrow">
                {top ? "MẶT BẰNG / XZ" : "PHỐI CẢNH / 3D"}
              </span>
              <span>
                {fmt(layout.room.length)} × {fmt(layout.room.width)} m
              </span>
            </div>
            {placement && (
              <div className="placement-banner" data-testid="placement-banner">
                <span
                  className={
                    "status-dot " +
                    (!fits(layout.room, catalog[placement.catalogId], placement)
                      ? "bad"
                      : "")
                  }
                />
                <span>
                  Đang đặt <strong>{catalog[placement.catalogId].name}</strong>
                  <small>
                    {fits(layout.room, catalog[placement.catalogId], placement)
                      ? "Nhấp sàn để đặt một món"
                      : "Vượt biên phòng — chọn vị trí khác"}
                  </small>
                </span>
                <button
                  onClick={() => rotate(Math.PI / 12)}
                  aria-label="Xoay bản xem trước"
                >
                  ↻ 15°
                </button>
                <button onClick={cancel}>
                  Hủy <kbd>Esc</kbd>
                </button>
              </div>
            )}
            {busy && (
              <div className="drag-banner">
                Đang di chuyển · thả để xác nhận · Esc để hủy
              </div>
            )}
            <div className="axis">
              <span>Y ↑</span>
              <span>X → &nbsp; Z ↙</span>
            </div>
            <div className="floor-caption">
              1 đơn vị = 1 mét <span>·</span> Kích thước đúng tỷ lệ
            </div>
          </div>
          <div className="canvas-footer">
            <span data-testid="item-count">{layout.items.length} đồ vật</span>
            <span>
              {top ? "Cuộn để thu phóng" : "Kéo sàn để xoay góc nhìn"} <b>·</b>{" "}
              Kéo đồ vật để di chuyển
            </span>
            <span className="unit">MÉT</span>
          </div>
        </section>
        <aside className="properties-panel">
          <section className="property-section">
            <span className="eyebrow">02 / KHÔNG GIAN</span>
            <h2>Kích thước phòng</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                cancel();
                planner.getState().room(room);
              }}
            >
              <div className="room-fields">
                {(
                  [
                    ["length", "Dài"],
                    ["width", "Rộng"],
                    ["height", "Cao"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k}>
                    {label}
                    <div className="unit-input">
                      <input
                        aria-label={"Chiều " + label.toLowerCase()}
                        type="number"
                        step="0.1"
                        min="0.5"
                        max={k === "height" ? 10 : 30}
                        required
                        value={Number.isNaN(room[k]) ? "" : room[k]}
                        onChange={(e) =>
                          setRoom({ ...room, [k]: e.target.valueAsNumber })
                        }
                      />
                      <span>m</span>
                    </div>
                  </label>
                ))}
              </div>
              <button className="apply" type="submit" disabled={busy}>
                Áp dụng kích thước
              </button>
            </form>
            <div className="room-area">
              <span>Diện tích sàn</span>
              <strong>
                {fmt(layout.room.length * layout.room.width)} <small>m²</small>
              </strong>
            </div>
            {invalid.length > 0 && (
              <div className="warning" role="status">
                {invalid.length} đồ vật vượt biên hoặc quá cao. Vị trí được giữ
                nguyên; hãy chọn để điều chỉnh.
              </div>
            )}
          </section>
          <section className="property-section selection-section">
            <span className="eyebrow">03 / ĐỒ VẬT ĐANG CHỌN</span>
            {item && spec ? (
              <>
                <div className="selected-title">
                  <h2>{spec.name}</h2>
                  <span className="selected-dot" />
                </div>
                <div className="selected-preview">
                  <Thumbnail id={item.catalogId} />
                </div>
                <div className="fixed-size">
                  <span>Kích thước cố định</span>
                  <strong>
                    {fmt(spec.w)} × {fmt(spec.d)} × {fmt(spec.h)} m
                  </strong>
                </div>
                <div className="coordinates">
                  <div>
                    <small>X / MÉT</small>
                    <strong data-testid="x-value">{fmt(item.x)}</strong>
                  </div>
                  <div>
                    <small>Z / MÉT</small>
                    <strong data-testid="z-value">{fmt(item.z)}</strong>
                  </div>
                  <div>
                    <small>GÓC / Y</small>
                    <strong data-testid="angle-value">
                      {fmt((item.angle * 180) / Math.PI)}°
                    </strong>
                  </div>
                </div>
                <div className="rotate-controls">
                  <button
                    onClick={() => rotate(-Math.PI / 12)}
                    disabled={busy || !!placement}
                    aria-label="Xoay -15°"
                  >
                    ↶ −15°
                  </button>
                  <button
                    onClick={() => rotate(Math.PI / 12)}
                    disabled={busy || !!placement}
                    aria-label="Xoay +15°"
                  >
                    ↷ +15°
                  </button>
                </div>
                <button
                  className="delete"
                  onClick={() => planner.getState().remove(item.id)}
                  disabled={busy || !!placement}
                >
                  Xóa đồ vật
                </button>
                {!fits(layout.room, spec, item) && (
                  <p className="warning">
                    Đồ vật này không nằm trọn trong phòng hoặc cao hơn trần.
                  </p>
                )}
              </>
            ) : (
              <div className="empty-selection">
                <div className="selection-icon">⌖</div>
                <h3>Chọn một đồ vật</h3>
                <p>Nhấp vào đồ vật trong phòng để xem vị trí, xoay hoặc xóa.</p>
              </div>
            )}
          </section>
          <section className="object-section">
            <h3>
              Trong phòng <span>{layout.items.length}</span>
            </h3>
            <div className="object-list">
              {layout.items.map((i, n) => (
                <button
                  key={i.id}
                  className={i.id === selected ? "selected" : ""}
                  onClick={() => {
                    cancel();
                    planner.getState().select(i.id);
                  }}
                >
                  <span
                    className="object-swatch"
                    style={{ background: catalog[i.catalogId].color }}
                  />
                  <span>{catalog[i.catalogId].name}</span>
                  <small>
                    {!fits(layout.room, catalog[i.catalogId], i)
                      ? "⚠"
                      : String(n + 1).padStart(2, "0")}
                  </small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </main>
      {(message || (storageError && !storageDismissed)) && (
        <div className="toast" role="alert">
          <span>{message || storageError}</span>
          <button
            aria-label="Đóng thông báo"
            onClick={() => {
              planner.getState().notify("");
              setStorageDismissed(true);
            }}
          >
            ×
          </button>
        </div>
      )}
      <footer className="app-footer">
        <span>NẾP / ROOM PLANNER</span>
        <span>Một không gian, nhiều khả năng.</span>
        <span>
          <kbd>Esc</kbd> Hủy thao tác{" "}
          <span className="footer-separator">/</span> <kbd>Ctrl Z</kbd> Hoàn tác
        </span>
      </footer>
    </div>
  );
}
