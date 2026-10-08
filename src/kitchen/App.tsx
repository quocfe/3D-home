import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { functions, type Run } from "./catalog";
import { allocated, usable, validate } from "./domain";
import { bootError, kitchen, persist, useKitchen } from "./runtime";
import { MAX_BYTES } from "./persistence";
import { NumberField } from "./NumberField";
import Elevation from "./Elevation";
import ModulePanel from "./ModulePanel";
import Quote from "./Quote";
import { SceneBoundary } from "./SceneBoundary";
const KitchenScene = lazy(() => import("./KitchenScene"));
export default function App() {
  const { data, past, future, edit, undo, redo, notice } = useKitchen();
  const [selected, setSelected] = useState(data.zones[0].id),
    [run, setRun] = useState<Run>(data.zones[0].run),
    [view, setView] = useState<"front" | "3d">("front"),
    [message, setMessage] = useState(""),
    [storageError, setStorageError] = useState(bootError);
  const input = useRef<HTMLInputElement>(null),
    zone = data.zones.find((z) => z.id === selected) ?? data.zones[0],
    issues = validate(data);
  const select = (id: string) => {
    setSelected(id);
    const z = data.zones.find((z) => z.id === id);
    if (z) setRun(z.run);
  };
  useEffect(
    () =>
      kitchen.subscribe((s, old) => {
        if (s.data !== old.data) setStorageError(persist());
      }),
    [],
  );
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nep-bep-v1.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="app">
      <header className="header">
        <a className="brand" href="#">
          nếp<span>BẾP CỦA NHÀ</span>
        </a>
        <div className="heading">
          <span className="eyebrow">KITCHEN STUDIO / BẢN THỬ NGHIỆM</span>
          <h1>Thiết kế bếp của anh</h1>
        </div>
        <div className="header-actions">
          <span className={`save-state ${storageError ? "danger" : ""}`}>
            {storageError ? "Chưa lưu an toàn" : "Tự lưu trên máy"}
          </span>
          <button disabled={!past.length} onClick={undo}>
            Hoàn tác
          </button>
          <button disabled={!future.length} onClick={redo}>
            Làm lại
          </button>
          <button onClick={() => input.current?.click()}>Nhập JSON</button>
          <button className="primary" onClick={download}>
            Xuất JSON
          </button>
          <input
            ref={input}
            aria-label="Nhập JSON"
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > MAX_BYTES) {
                setMessage("Tệp vượt 100.000 byte.");
                return;
              }
              try {
                const error = kitchen.getState().importJSON(await file.text());
                setMessage(error || kitchen.getState().notice);
              } catch {
                setMessage("Không đọc được tệp. Cấu hình không thay đổi.");
              }
            }}
          />
        </div>
      </header>
      <nav className="workflow" aria-label="Các bước thiết kế">
        <a href="#shape">
          <b>01</b> Kiểu & kích thước
        </a>
        <a href="#zones">
          <b>02</b> Phân vùng công năng
        </a>
        <a href="#catalog">
          <b>03–04</b> Module & vật liệu
        </a>
        <a href="#quote">
          <b>05</b> Xem báo giá
        </a>
        <span>Đơn vị mm · Giá VND</span>
      </nav>
      {storageError && (
        <div className="storage-warning" role="alert">
          {storageError}
        </div>
      )}
      {(message || notice) && (
        <div className="toast" role="status">
          {message || notice}
          <button
            aria-label="Đóng thông báo"
            onClick={() => {
              setMessage("");
              kitchen.setState({ notice: "" });
            }}
          >
            ×
          </button>
        </div>
      )}
      <main className="workspace">
        <aside className="config-panel">
          <section id="shape">
            <div className="panel-title">
              <span className="step">01</span>
              <h2>Khung bếp</h2>
            </div>
            <div className="shape-options">
              <button
                aria-pressed={data.shape === "straight"}
                className={data.shape === "straight" ? "selected" : ""}
                onClick={() =>
                  edit((s) => {
                    s.shape = "straight";
                  })
                }
              >
                <span className="shape straight" />
                Thẳng
              </button>
              <button
                aria-pressed={data.shape === "L"}
                className={data.shape === "L" ? "selected" : ""}
                onClick={() =>
                  edit((s) => {
                    s.shape = "L";
                  })
                }
              >
                <span className="shape elbow" />
                Chữ L
              </button>
            </div>
            <NumberField
              label="Chiều dài nhánh A"
              value={data.runs.A}
              min={1000}
              onCommit={(n) =>
                edit((s) => {
                  s.runs.A = n;
                })
              }
            />
            {(data.shape === "L" || data.zones.some((z) => z.run === "B")) && (
              <NumberField
                label="Chiều dài nhánh B"
                value={data.runs.B}
                min={1000}
                onCommit={(n) =>
                  edit((s) => {
                    s.runs.B = n;
                  })
                }
              />
            )}
            <p className="fine">
              Đo từ giao điểm hai tường đến đầu ngoài. Thay đổi kích thước/kiểu
              bếp giữ nguyên mọi tủ; lỗi được liệt kê để anh sửa.
            </p>
            {data.shape === "L" && (
              <div className="corner-note">
                <strong>Góc chết 650 × 650 mm</strong>
                <p>
                  Trừ 650 mm ở đầu mỗi nhánh, cả tầng dưới và trên. Không đặt tủ
                  vào góc; nẹp bù chưa tính giá.
                </p>
                <svg viewBox="0 0 200 100" aria-label="Sơ đồ góc L">
                  <path
                    d="M20 85V15H190V42H47V85Z"
                    fill="#ecebe4"
                    stroke="#8c9686"
                  />
                  <rect x="20" y="15" width="27" height="27" fill="#bbb29d" />
                  <text x="100" y="33">
                    A →
                  </text>
                  <text x="26" y="70">
                    B
                  </text>
                </svg>
              </div>
            )}
          </section>
          <section id="zones">
            <div className="panel-title">
              <span className="step">02</span>
              <h2>Phân vùng công năng</h2>
            </div>
            <p className="fine">
              Thứ tự từ góc/đầu trái ra ngoài. Một vùng chứa nhiều tủ; màu vùng
              không phải màu cánh.
            </p>
            {data.zones.map((z, i) => (
              <article
                className={`zone-card ${zone.id === z.id ? "active" : ""}`}
                key={z.id}
              >
                <button
                  className="zone-select"
                  aria-label={`Chọn vùng ${functions[z.kind].name}`}
                  aria-pressed={zone.id === z.id}
                  onClick={() => select(z.id)}
                >
                  <span
                    className="zone-dot"
                    style={{ background: functions[z.kind].color }}
                  />
                  <strong>{functions[z.kind].name}</strong>
                  <span>{z.modules.length} tủ</span>
                </button>
                <div className="zone-controls">
                  <select
                    aria-label={`Nhánh của ${functions[z.kind].name}`}
                    value={z.run}
                    onChange={(e) => {
                      edit((s) => {
                        s.zones.find((x) => x.id === z.id)!.run = e.target
                          .value as Run;
                      });
                      select(z.id);
                      setRun(e.target.value as Run);
                    }}
                  >
                    <option value="A">Nhánh A</option>
                    <option value="B" disabled={data.shape === "straight"}>
                      Nhánh B{data.shape === "straight" ? " (ẩn)" : ""}
                    </option>
                  </select>
                  <button
                    aria-label={`Đưa ${functions[z.kind].name} lên`}
                    disabled={i === 0}
                    onClick={() =>
                      edit((s) => {
                        [s.zones[i - 1], s.zones[i]] = [
                          s.zones[i],
                          s.zones[i - 1],
                        ];
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Đưa ${functions[z.kind].name} xuống`}
                    disabled={i === data.zones.length - 1}
                    onClick={() =>
                      edit((s) => {
                        [s.zones[i + 1], s.zones[i]] = [
                          s.zones[i],
                          s.zones[i + 1],
                        ];
                      })
                    }
                  >
                    ↓
                  </button>
                </div>
                <NumberField
                  label={`Rộng vùng ${functions[z.kind].name}`}
                  value={z.width}
                  onCommit={(n) =>
                    edit((s) => {
                      s.zones.find((x) => x.id === z.id)!.width = n;
                    })
                  }
                />
              </article>
            ))}
          </section>
        </aside>
        <div className="center-column">
          <section className="visual-panel">
            <div className="visual-toolbar">
              <div>
                <span className="eyebrow">BẢN THIẾT KẾ TRỰC TIẾP</span>
                <h2>
                  {view === "front"
                    ? `Mặt đứng · nhánh ${run}`
                    : "Tổng thể bếp"}
                </h2>
              </div>
              <div className="segmented">
                <button
                  className={view === "front" ? "selected" : ""}
                  onClick={() => setView("front")}
                >
                  Trực diện
                </button>
                <button
                  className={view === "3d" ? "selected" : ""}
                  onClick={() => setView("3d")}
                >
                  3D tổng thể
                </button>
              </div>
            </div>
            <div className="run-tabs">
              {(["A", "B"] as Run[])
                .filter(
                  (r) =>
                    r === "A" ||
                    data.shape === "L" ||
                    data.zones.some((z) => z.run === "B"),
                )
                .map((r) => (
                  <button
                    key={r}
                    className={r === run ? "selected" : ""}
                    onClick={() => {
                      setRun(r);
                      setView("front");
                    }}
                  >
                    Nhánh {r}
                    <small>
                      {usable(data, r)} / {data.runs[r]} mm hữu dụng / tổng
                    </small>
                  </button>
                ))}
            </div>
            {data.shape === "straight" && run === "B" && (
              <p className="warning">
                Nhánh B không hoạt động ở bếp thẳng. Các tủ vẫn được giữ; chuyển
                vùng về A hoặc chọn lại chữ L.
              </p>
            )}
            {view === "front" ? (
              <Elevation
                data={data}
                run={run}
                selected={zone.id}
                onSelect={select}
              />
            ) : (
              <SceneBoundary>
                <Suspense
                  fallback={
                    <div className="loading">Đang tải bản dựng 3D…</div>
                  }
                >
                  <KitchenScene data={data} onSelect={select} />
                </Suspense>
              </SceneBoundary>
            )}
            <div className="view-footer">
              <span>Rộng × cao × sâu theo biến thể · Không kéo giãn tủ</span>
              <span>Mặt đứng trực giao / 3D minh họa</span>
            </div>
            <div className="zone-legend">
              {data.zones.map((z) => (
                <button
                  key={z.id}
                  className={z.id === zone.id ? "selected" : ""}
                  aria-label={`Xem vùng ${functions[z.kind].name}`}
                  onClick={() => select(z.id)}
                >
                  <i style={{ background: functions[z.kind].color }} />
                  {functions[z.kind].name}
                </button>
              ))}
            </div>
          </section>
          <section className="checks">
            <div className="row">
              <h3>Kiểm tra cấu hình</h3>
              <span className={issues.length ? "warning-tag" : "badge"}>
                {issues.length
                  ? `${issues.length} mục cần xem`
                  : "Đã phân bổ đủ"}
              </span>
            </div>
            <div className="run-capacity">
              {(["A", "B"] as Run[])
                .filter(
                  (r) =>
                    r === "A" || data.shape === "L" || allocated(data, r) > 0,
                )
                .map((r) => (
                  <div key={r}>
                    <span>
                      Nhánh {r}: {allocated(data, r)} / {usable(data, r)} mm đã
                      phân vùng
                    </span>
                    <progress
                      max={Math.max(usable(data, r), 1)}
                      value={allocated(data, r)}
                    />
                    <b
                      className={
                        allocated(data, r) > usable(data, r) ? "danger" : ""
                      }
                    >
                      Còn {usable(data, r) - allocated(data, r)} mm
                    </b>
                  </div>
                ))}
            </div>
            {!!issues.length && (
              <details open>
                <summary>
                  Cấu hình chưa hoàn thiện — vẫn có thể chỉnh sửa
                </summary>
                <ul>
                  {issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          <Quote data={data} issues={issues} />
        </div>
        <div id="catalog">
          <ModulePanel
            data={data}
            zone={zone}
            edit={edit}
            notify={setMessage}
          />
        </div>
      </main>
      <footer className="page-footer">
        nếp / kitchen studio{" "}
        <span>Demo cấu hình module · Không phải hồ sơ thi công</span>
      </footer>
    </div>
  );
}
