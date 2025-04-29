import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../../Pages/Login";
import Home from "../../Pages/Home";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* якщо не авторизовані — потрапляєте на /login */}
        <Route path="/login" element={<Login />} />
        {/* головна сторінка */}
        <Route path="/" element={<Home />} />
        {/* усі інші шляхи — перекидаємо на логін */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
