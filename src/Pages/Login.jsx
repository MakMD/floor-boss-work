// src/Pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Login.module.css";
import { AppContext } from "../components/App/App";

const USERS_API = "https://680eea7067c5abddd1934af2.mockapi.io/users";

export default function Login() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(
        `${USERS_API}?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`
      );
      if (!resp.ok) {
        setError("Server error, please try again later");
        return;
      }
      const data = await resp.json();
      const user = data[0];
      if (!user) {
        setError("Invalid username or password");
      } else {
        login(user);
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <motion.div
        className={styles.loginCard}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <img
          src="/Flooring.Boss.svg"
          alt="Company Logo"
          className={styles.logo}
        />

        <form onSubmit={handleSubmit}>
          {error && (
            <motion.p
              className={styles.loginError}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.p>
          )}

          <div>
            <label htmlFor="username">Username</label>
            <motion.input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.loginInput}
              whileFocus={{ scale: 1.02 }}
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <motion.input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.loginInput}
              whileFocus={{ scale: 1.02 }}
            />
          </div>

          <motion.button
            type="submit"
            className={styles.loginButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
