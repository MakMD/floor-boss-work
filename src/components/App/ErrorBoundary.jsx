import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Оновлюємо стан, щоб показати запасний UI
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Логування в консоль чи зовнішню систему
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      // Запасний інтерфейс на випадок помилки
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Щось пішло не так 😕</h2>
          <p>Ми вже працюємо над виправленням проблеми.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
