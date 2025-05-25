// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App/App";
import { ChakraProvider, extendTheme } from "@chakra-ui/react"; // <--- НОВИЙ ІМПОРТ

// Можна створити кастомну тему або використати стандартну
const theme = extendTheme({
  // Тут можна додати кастомізацію теми, якщо потрібно
  // Наприклад, інтегрувати ваші CSS змінні з index.css
  styles: {
    global: (props) => ({
      body: {
        fontFamily: "Inter, sans-serif", // З вашого index.css
        color: props.colorMode === "dark" ? "var(--fg)" : "var(--fg)", // Приклад використання змінних
        bg: props.colorMode === "dark" ? "var(--bg)" : "var(--bg)",
        lineHeight: "1.5",
        fontWeight: "400",
        fontSynthesis: "none",
        textRendering: "optimizeLegibility",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      },
      // Можна додати більше глобальних стилів тут
    }),
  },
  // Можна налаштувати початковий колірний режим, якщо потрібно
  // config: {
  //   initialColorMode: "light",
  //   useSystemColorMode: false,
  // },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      {" "}
      {/* <--- ОБГОРТКА CHAKRAPROVIDER */}
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
