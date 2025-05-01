import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      navigate("/home", { replace: true });
    } else {
      setError("Invalid username or password");
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
          src="/Flooring.Boss.svg" // load directly from public folder
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
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
