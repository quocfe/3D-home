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
import { stepBlocker, type WizardStep } from "./wizard";

const KitchenScene = lazy(() => import("./KitchenScene"));
const steps = [
  ["Kiểu bếp", "Chọn bố cục"],
  ["Kích thước", "Nhập số đo"],
  ["Phân khu", "Chia công năng"],
  ["Sản phẩm", "Chọn tủ"],
  ["Kết quả", "Xem báo giá"],
] as const;

export default function App() {
  const { data, past, future, edit, undo, redo, notice } = useKitchen();
  const [step, setStep] = useState<WizardStep>(1);
  const [furthest, setFurthest] = useState<WizardStep>(1);
  const [selected, setSelected] = useState(data.zones[0].id);
  const [run, setRun] = useState<Run>(data.zones[0].run);
  const [view, setView] = useState<"front" | "3d">("front");
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(bootError);
  const input = useRef<HTMLInputElement>(null);
  const zone = data.zones.find((z) => z.id === selected) ?? data.zones[0];
  const issues = validate(data);
  const blocker = stepBlocker(step, data);

  const select = (id: string) => {
    setSelected(id);
    const next = data.zones.find((z) => z.id === id);
    if (next) setRun(next.run);
  };
  const go = (next: WizardStep) => {
    setMessage("");
    kitchen.setState({ notice: "" });
    setStep(next);
    setFurthest((current) => Math.max(current, next) as WizardStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(
    () =>
      kitchen.subscribe((state, old) => {
        if (state.data !== old.data) setStorageError(persist());
      }),
    [],
  );
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
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
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nep-bep-v1.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="#main">nếp<span>BẾP CỦA NHÀ</span></a>
        <div className="header-copy">
          <span className="eyebrow">CẤU HÌNH BẾP MODULE</span>
          <strong>Thiết kế bếp của anh</strong>
        </div>
        <div className="utility-area">
          <span className={`save-state ${storageError ? "danger" : ""}`}>
            {storageError ? "Chưa lưu an toàn" : "Đã tự lưu"}
          </span>
          <details className="utility-menu">
            <summary aria-label="Mở tiện ích">Tiện ích</summary>
            <div>
              <button disabled={!past.length} onClick={undo}>Hoàn tác</button>
              <button disabled={!future.length} onClick={redo}>Làm lại</button>
              <button onClick={() => input.current?.click()}>Nhập JSON</button>
              <button onClick={download}>Xuất JSON</button>
            </div>
          </details>
          <input
            ref={input}
            aria-label="Nhập JSON"
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
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

      <nav className="stepper" aria-label="Tiến trình cấu hình">
        {steps.map(([name, hint], index) => {
          const number = (index + 1) as WizardStep;
          const reachable = number <= furthest;
          return (
            <button
              key={name}
              className={step === number ? "active" : number < step ? "complete" : ""}
              aria-current={step === number ? "step" : undefined}
              disabled={!reachable}
              onClick={() => reachable && go(number)}
            >
              <span>{number < step ? "✓" : number}</span>
              <span><b>{name}</b><small>{hint}</small></span>
            </button>
          );
        })}
      </nav>

      {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
      {(message || notice) && (
        <div className="toast" role="status">
          {message || notice}
          <button aria-label="Đóng thông báo" onClick={() => {
            setMessage("");
            kitchen.setState({ notice: "" });
          }}>×</button>
        </div>
      )}

      <main id="main" className="wizard-shell">
        <div className="step-heading">
          <span>Bước {step} / 5</span>
          <div>
            <h1>{[
              "Bếp nhà mình theo kiểu nào?",
              "Nhập kích thước tường bếp",
              "Chia chiều dài cho 5 khu công năng",
              `Đang chọn sản phẩm cho Khu ${functions[zone.kind].name}`,
              "Kết quả thiết kế & báo giá tham khảo",
            ][step - 1]}</h1>
            <p>{[
              "Chọn bố cục gần với không gian thực tế. Anh có thể quay lại đổi sau.",
              "Đo sát tường theo milimét. Bản L sẽ trừ phần góc giao nhau khỏi chiều dài đặt tủ.",
              "Điều chỉnh từng khu trước khi chọn tủ. Phần chưa phân bổ được hiển thị rõ bên dưới.",
              `${functions[zone.kind].hint} · Nhánh ${zone.run}. Không cần chọn trực tiếp trên bản vẽ.`,
              "Bản trực diện và 3D là kết quả để kiểm tra; báo giá vẫn nêu rõ phần thiếu và ngoại lệ.",
            ][step - 1]}</p>
          </div>
        </div>

        {step === 1 && (
          <section className="step-content shape-step" aria-labelledby="shape-title">
            <h2 id="shape-title">Chọn kiểu bếp</h2>
            <div className="shape-grid">
              <button
                className={`shape-choice ${data.shape === "straight" ? "selected" : ""}`}
                aria-pressed={data.shape === "straight"}
                onClick={() => edit((state) => { state.shape = "straight"; })}
              >
                <ShapeDiagram shape="straight" />
                <span><strong>Bếp thẳng</strong><small>Một dãy tủ trên một mặt tường. Gọn và dễ bố trí.</small></span>
                <b>{data.shape === "straight" ? "Đã chọn" : "Chọn kiểu này"}</b>
              </button>
              <button
                className={`shape-choice ${data.shape === "L" ? "selected" : ""}`}
                aria-pressed={data.shape === "L"}
                onClick={() => edit((state) => { state.shape = "L"; })}
              >
                <ShapeDiagram shape="L" />
                <span><strong>Bếp chữ L</strong><small>Hai nhánh giao góc, tăng mặt bàn và không gian lưu trữ.</small></span>
                <b>{data.shape === "L" ? "Đã chọn" : "Chọn kiểu này"}</b>
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="step-content dimensions-layout">
            <div className="dimension-diagram" aria-label="Sơ đồ đo nhánh A và B">
              <svg viewBox="0 0 420 280" role="img">
                {data.shape === "straight" ? (
                  <>
                    <path d="M45 145H375" />
                    <path className="measure" d="M45 100H375" />
                    <text x="210" y="85">A · {data.runs.A.toLocaleString("vi-VN")} mm</text>
                  </>
                ) : (
                  <>
                    <path d="M75 235V55H365" />
                    <rect x="75" y="55" width="54" height="54" />
                    <path className="measure" d="M75 25H365" />
                    <path className="measure" d="M40 235V55" />
                    <text x="225" y="18">A · {data.runs.A.toLocaleString("vi-VN")} mm</text>
                    <text x="30" y="155" transform="rotate(-90 30 155)">B · {data.runs.B.toLocaleString("vi-VN")} mm</text>
                    <text x="102" y="88">góc</text>
                  </>
                )}
              </svg>
            </div>
            <div className="dimension-form">
              <h2>Số đo tổng theo tường</h2>
              <NumberField label="Chiều dài nhánh A" value={data.runs.A} min={1000} onCommit={(value) => edit((state) => { state.runs.A = value; })} />
              {data.shape === "L" && (
                <NumberField label="Chiều dài nhánh B" value={data.runs.B} min={1000} onCommit={(value) => edit((state) => { state.runs.B = value; })} />
              )}
              <div className="measurement-note">
                <strong>Tổng và hữu dụng khác nhau thế nào?</strong>
                <p>Tổng là số đo sát tường. Với bếp chữ L, mỗi nhánh dành 650 mm cho góc, nên phần hữu dụng để đặt tủ là:</p>
                <ul>
                  <li>Nhánh A: <b>{usable(data, "A").toLocaleString("vi-VN")} mm hữu dụng</b> / {data.runs.A.toLocaleString("vi-VN")} mm tổng</li>
                  {data.shape === "L" && <li>Nhánh B: <b>{usable(data, "B").toLocaleString("vi-VN")} mm hữu dụng</b> / {data.runs.B.toLocaleString("vi-VN")} mm tổng</li>}
                </ul>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="step-content zones-step">
            <ZoneSummary data={data} selected={zone.id} />
            <div className="zone-workspace">
              <div className="zone-list" aria-label="Năm khu công năng">
                {data.zones.map((item, index) => {
                  const active = item.id === zone.id;
                  return (
                    <article className={`zone-editor ${active ? "active" : ""}`} key={item.id}>
                      <button className="zone-main" aria-pressed={active} aria-label={`Chọn khu ${functions[item.kind].name}`} onClick={() => select(item.id)}>
                        <span className="zone-index">{index + 1}</span>
                        <span><strong>{functions[item.kind].name}</strong><small>{functions[item.kind].hint}</small></span>
                        <b>{item.width.toLocaleString("vi-VN")} mm</b>
                      </button>
                      {active && (
                        <div className="zone-edit-controls">
                          {data.shape === "L" && (
                            <label>Nhánh
                              <select aria-label={`Nhánh của ${functions[item.kind].name}`} value={item.run} onChange={(event) => {
                                const nextRun = event.target.value as Run;
                                edit((state) => { state.zones.find((candidate) => candidate.id === item.id)!.run = nextRun; });
                                setRun(nextRun);
                              }}><option value="A">A</option><option value="B">B</option></select>
                            </label>
                          )}
                          <NumberField label={`Rộng vùng ${functions[item.kind].name}`} value={item.width} onCommit={(value) => edit((state) => { state.zones.find((candidate) => candidate.id === item.id)!.width = value; })} />
                          <div className="width-buttons" aria-label="Điều chỉnh nhanh chiều rộng">
                            <button aria-label={`Giảm rộng ${functions[item.kind].name}`} onClick={() => edit((state) => { const target = state.zones.find((candidate) => candidate.id === item.id)!; target.width = Math.max(100, target.width - 50); })}>− 50</button>
                            <button aria-label={`Tăng rộng ${functions[item.kind].name}`} onClick={() => edit((state) => { state.zones.find((candidate) => candidate.id === item.id)!.width += 50; })}>+ 50</button>
                          </div>
                          <div className="reorder-controls">
                            <span>Thứ tự</span>
                            <button aria-label={`Đưa ${functions[item.kind].name} lên`} disabled={index === 0} onClick={() => edit((state) => { [state.zones[index - 1], state.zones[index]] = [state.zones[index], state.zones[index - 1]]; })}>↑ Trước</button>
                            <button aria-label={`Đưa ${functions[item.kind].name} xuống`} disabled={index === data.zones.length - 1} onClick={() => edit((state) => { [state.zones[index + 1], state.zones[index]] = [state.zones[index], state.zones[index + 1]]; })}>↓ Sau</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <aside className="active-zone-summary">
                <span className="eyebrow">TRẠNG THÁI HIỆN TẠI</span>
                <h2>Khu đang chỉnh: {functions[zone.kind].name}</h2>
                <p>{functions[zone.kind].hint}</p>
                <Capacity data={data} />
              </aside>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="step-content products-step">
            <div className="zone-tabs" aria-label="Chọn khu để thêm sản phẩm">
              {data.zones.map((item) => (
                <button key={item.id} aria-label={`Chọn vùng ${functions[item.kind].name}`} aria-pressed={item.id === zone.id} className={item.id === zone.id ? "selected" : ""} onClick={() => select(item.id)}>
                  <span>{functions[item.kind].name}</span><small>{item.modules.length} sản phẩm</small>
                </button>
              ))}
            </div>
            <div className="active-zone-banner">
              <div><span>ĐANG CẤU HÌNH</span><strong>Khu {functions[zone.kind].name}</strong></div>
              <div><b>Nhánh {zone.run}</b><span>{zone.width.toLocaleString("vi-VN")} mm</span></div>
            </div>
            <ModulePanel data={data} zone={zone} edit={edit} notify={setMessage} />
          </section>
        )}

        {step === 5 && (
          <section className="step-content review-step">
            <div className="review-grid">
              <div className="result-panel">
                <div className="result-toolbar">
                  <div><span className="eyebrow">KẾT QUẢ THIẾT KẾ</span><h2>{view === "front" ? `Mặt trực diện · nhánh ${run}` : "3D tổng thể"}</h2></div>
                  <div className="segmented" aria-label="Chế độ xem kết quả">
                    <button className={view === "front" ? "selected" : ""} onClick={() => setView("front")}>Trực diện</button>
                    <button className={view === "3d" ? "selected" : ""} onClick={() => setView("3d")}>3D tổng thể</button>
                  </div>
                </div>
                <div className="run-tabs">
                  {(["A", "B"] as Run[]).filter((item) => item === "A" || data.shape === "L" || allocated(data, item) > 0).map((item) => (
                    <button key={item} className={item === run ? "selected" : ""} onClick={() => { setRun(item); setView("front"); }}>
                      Nhánh {item}<small>{usable(data, item).toLocaleString("vi-VN")} mm hữu dụng</small>
                    </button>
                  ))}
                </div>
                {data.shape === "straight" && run === "B" && <p className="warning">Nhánh B không hoạt động ở bếp thẳng. Các sản phẩm vẫn được giữ; chuyển khu về A hoặc chọn lại chữ L.</p>}
                {view === "front" ? (
                  <Elevation data={data} run={run} selected={zone.id} onSelect={select} />
                ) : (
                  <SceneBoundary><Suspense fallback={<div className="loading">Đang tải bản dựng 3D…</div>}><KitchenScene data={data} onSelect={select} /></Suspense></SceneBoundary>
                )}
              </div>
              <aside className="review-status">
                <h2>Kiểm tra trước khi dùng báo giá</h2>
                <Capacity data={data} />
                <span className={issues.length ? "warning-tag" : "badge"}>{issues.length ? `${issues.length} mục cần xem` : "Cấu hình hợp lệ"}</span>
                {!!issues.length && <ul>{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
              </aside>
            </div>
            <Quote data={data} issues={issues} />
          </section>
        )}

        <div className="wizard-actions">
          {step > 1 ? <button className="back-button" onClick={() => go((step - 1) as WizardStep)}><span aria-hidden="true">←</span> Quay lại</button> : <span />}
          <div>
            {blocker && <p className="blocker" role="alert">{blocker}</p>}
            {step < 5 && <button className="primary continue-button" disabled={!!blocker} title={blocker || undefined} onClick={() => go((step + 1) as WizardStep)}>Tiếp tục <span aria-hidden="true">→</span></button>}
          </div>
        </div>
      </main>
      <footer className="page-footer">nếp / kitchen studio <span>Demo cấu hình module · Không phải hồ sơ thi công</span></footer>
    </div>
  );
}

function ShapeDiagram({ shape }: { shape: "straight" | "L" }) {
  return <svg className="shape-diagram" viewBox="0 0 240 135" aria-hidden="true"><rect x="18" y="17" width="204" height="101" rx="8" />{shape === "straight" ? <><path d="M48 77H192" /><path className="measure" d="M48 100H192" /></> : <><path d="M58 96V45H188" /><path className="measure" d="M42 96V32H188" /></>}</svg>;
}

function Capacity({ data }: { data: ReturnType<typeof useKitchen>["data"] }) {
  return <div className="capacity-list">{(["A", "B"] as Run[]).filter((run) => run === "A" || data.shape === "L" || allocated(data, run) > 0).map((run) => {
    const remaining = usable(data, run) - allocated(data, run);
    return <div key={run} className={remaining < 0 ? "invalid" : ""}><span>Nhánh {run}</span><b>{allocated(data, run).toLocaleString("vi-VN")} / {usable(data, run).toLocaleString("vi-VN")} mm</b><strong>{remaining >= 0 ? `Chưa phân bổ ${remaining.toLocaleString("vi-VN")} mm` : `Vượt ${Math.abs(remaining).toLocaleString("vi-VN")} mm`}</strong></div>;
  })}</div>;
}

function ZoneSummary({ data, selected }: { data: ReturnType<typeof useKitchen>["data"]; selected: string }) {
  return <div className="zone-preview" aria-label="Tóm tắt phân khu">{(["A", "B"] as Run[]).filter((run) => run === "A" || data.shape === "L").map((run) => {
    const remaining = usable(data, run) - allocated(data, run);
    return <div className="preview-run" key={run}><div className="preview-label"><b>Nhánh {run}</b><span>{usable(data, run).toLocaleString("vi-VN")} mm hữu dụng</span></div><div className="zone-track">{data.zones.filter((zone) => zone.run === run).map((zone) => <span key={zone.id} className={zone.id === selected ? "active" : ""} style={{ flexBasis: `${(zone.width / Math.max(usable(data, run), 1)) * 100}%`, background: functions[zone.kind].color }}><b>{functions[zone.kind].name}</b><small>{zone.width} mm</small></span>)}{remaining > 0 && <span className="unallocated" style={{ flexBasis: `${(remaining / Math.max(usable(data, run), 1)) * 100}%` }}><b>Chưa phân bổ</b><small>{remaining} mm</small></span>}</div></div>;
  })}</div>;
}
