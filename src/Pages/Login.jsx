import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Login.module.css";
import { supabase } from "../lib/supabase";
import { AppContext } from "../components/App/App";

export default function Login() {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) throw signInError;
      // Успішний вхід. `onAuthStateChange` в App.jsx оновить стан.
      // Редірект відбудеться в `useEffect`.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Повертаємо null, якщо користувач вже є, щоб уникнути
  // рендерингу форми під час асинхронного редіректу.
  if (user) {
    return null;
  }

  return (
    <div className={styles.loginPage}>
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.loginCard}
      >
        <h2 className={styles.loginTitle}>Login</h2>

        {error && <p className={styles.loginError}>{error}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.loginInput}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.loginInput}
          required
        />

        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </button>
      </motion.form>
    </div>
  );
}
