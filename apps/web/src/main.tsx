import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app/App";
import { UiModeProvider } from "./app/theme/UiModeProvider";
import { applyStoredUiMode } from "./app/theme/ui-mode";
import "./styles/index.css";
import "./app/i18n/config";

// Antes del primer render: el provider tambien aplica el modo, pero en un efecto
// (post-paint), y ahi ya se vio un frame con los tokens del modo equivocado.
applyStoredUiMode();

createRoot(document.getElementById("root")!).render(
  <UiModeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </UiModeProvider>
);
