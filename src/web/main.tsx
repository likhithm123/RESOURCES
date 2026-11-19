import React, { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message || error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error("Application render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, maxWidth: 640, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "#616a80" }}>An unexpected error occurred while loading this page.</p>
          <pre style={{ background: "#f1f3f9", padding: 12, borderRadius: 6, fontSize: 13, overflowX: "auto" }}>
            {this.state.error}
          </pre>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{ marginTop: 16, padding: "8px 16px", background: "#1b3fae", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Reload Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
