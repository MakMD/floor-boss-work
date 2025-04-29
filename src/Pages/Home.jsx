import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

// Dummy data for demonstration
const sampleTables = [
  {
    id: "218086",
    title: "Akash Homes Ltd.",
    location: "8632 97 Ave, Morinville, AB T8R 2S1",
  },
  {
    id: "218087",
    title: "Akash Homes Ltd.",
    location: "8630 97 Ave, Morinville, AB T8R 2S1",
  },
  {
    id: "221625",
    title: "Jayman Built (EDM)",
    location: "3107 Dixon Landing SW, Edmonton, AB T6W 5L3",
  },
  {
    id: "223292",
    title: "Mattamy Homes",
    location: "1101 Crestview Terr, Sherwood Park, AB T8H 3A3",
  },
  {
    id: "223576",
    title: "Mattamy Homes",
    location: "1029 Crestview Terr, Sherwood Park, AB T8H 3A3",
  },
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [tables, setTables] = useState([]);

  useEffect(() => {
    // On date change, load tables (dummy for now)
    setTables(sampleTables);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.calendarContainer}>
        <input
          type="date"
          className={styles.dateInput}
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>
      <div className={styles.tableList}>
        {tables.map((table) => (
          <Link
            key={table.id}
            to={`/job/${table.id}`}
            className={styles.tableCard}
          >
            <div className={styles.tableHeader}>
              Job ID: {table.id} — {table.title}
            </div>
            <div className={styles.tableSub}>{table.location}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
