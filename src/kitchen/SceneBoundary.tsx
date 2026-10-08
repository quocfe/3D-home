import { Component, type ReactNode } from "react";
export class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="loading" role="alert">
        Không mở được 3D. Anh vẫn có thể cấu hình bằng bản trực diện.
      </div>
    ) : (
      this.props.children
    );
  }
}
