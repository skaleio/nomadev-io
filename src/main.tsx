import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (import.meta.env.DEV) {
      console.warn("Unhandled promise rejection:", event.reason);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
