// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App/App";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

// Основний CSS для TOAST UI Calendar
import "@toast-ui/calendar/dist/toastui-calendar.min.css";

// CSS для date-picker та time-picker (залежності TOAST UI Calendar)
// Vite має знайти їх у node_modules, якщо вони є залежностями @toast-ui/calendar
import "tui-date-picker/dist/tui-date-picker.css";
import "tui-time-picker/dist/tui-time-picker.css";

const theme = extendTheme({
  // ... ваша тема ...
  styles: {
    global: (props) => ({
      body: {
        fontFamily: "Inter, sans-serif",
        color: props.colorMode === "dark" ? "var(--fg)" : "var(--fg)",
        bg: props.colorMode === "dark" ? "var(--bg)" : "var(--bg)",
        lineHeight: "1.5",
        fontWeight: "400",
        fontSynthesis: "none",
        textRendering: "optimizeLegibility",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      },
    }),
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
