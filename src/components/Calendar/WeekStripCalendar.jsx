// src/components/Calendar/WeekStripCalendar.jsx
import React from "react";
import styles from "./WeekStripCalendar.module.css";
import {
  addDays,
  isToday,
  isSameDay,
  getDayName,
  formatWeekRange,
} from "../../utils/dateUtils";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

const WeekStripCalendar = ({
  displayWeekStartDate,
  selectedDate,
  onDateSelect,
  onPrevWeek,
  onNextWeek,
  onToday,
  jobsByDate,
}) => {
  const daysInStrip = [];
  for (let i = 0; i < 7; i++) {
    daysInStrip.push(addDays(displayWeekStartDate, i));
  }

  return (
    <div className={styles.weekStripContainer}>
      <div className={styles.weekStripHeader}>
        <div className={styles.navigationGroup}>
          <button
            onClick={onPrevWeek}
            className={`${styles.navButton} ${styles.navButtonIcon}`}
            aria-label="Previous week"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <span className={styles.weekTitle}>
            {formatWeekRange(displayWeekStartDate)}
          </span>
          <button
            onClick={onNextWeek}
            className={`${styles.navButton} ${styles.navButtonIcon}`}
            aria-label="Next week"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
        <button
          onClick={onToday}
          className={`${styles.navButton} ${styles.todayButton}`}
        >
          <CalendarIcon
            size={16}
            style={{ marginRight: "0.4rem" }}
            strokeWidth={2.5}
          />
          Today
        </button>
      </div>
      <div className={styles.weekStripDays}>
        {daysInStrip.map((day) => {
          const dayString = day.toDateString();
          const jobCount = jobsByDate[dayString] || 0; // Отримуємо кількість робіт
          const hasJobs = jobCount > 0;
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`
                ${styles.dayCell} 
                ${isSelected ? styles.selected : ""} 
                ${isCurrentToday ? styles.today : ""}
              `}
              onClick={() => onDateSelect(day)}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select date ${day.getDate()} ${getDayName(
                day,
                "long"
              )}`}
            >
              <div className={styles.dayName}>{getDayName(day, "short")}</div>
              <div className={styles.dayNumberContainer}>
                <span className={styles.dayNumber}>{day.getDate()}</span>
              </div>
              {/* ЗМІНА: Тепер індикатор показує кількість робіт */}
              {hasJobs && (
                <div className={styles.jobEventIndicator}>{jobCount}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekStripCalendar;
