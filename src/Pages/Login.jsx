// src/Pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Login.module.css";
import { AppContext } from "../components/App/App";
import { supabase } from "../lib/supabase";

export default function Login() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Використовуємо maybeSingle(), щоб уникнути 406, якщо не знайдено рядок
      const { data: userData, error: fetchError } = await supabase
        .from("workers")
        .select("id, name, username, role")
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      if (!userData) {
        setError("Неправильне ім'я користувача або пароль");
        setLoading(false);
        return;
      }

      // Успішний логін
      login(userData);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={styles.loginForm}
      >
        <h2 className={styles.title}>Login</h2>

        {error && <p className={styles.error}>{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />

        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </button>
      </motion.form>
    </div>
  );
}
