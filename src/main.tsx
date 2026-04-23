import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { reportError } from "@/lib/error-reporting";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    reportError(event.error || event.message, {
      source: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason || "Unhandled promise rejection", {
      source: "window.unhandledrejection",
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
