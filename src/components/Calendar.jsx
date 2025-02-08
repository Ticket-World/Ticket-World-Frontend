// src/components/Calendar.jsx
import React from "react";
import "./Calendar.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const Calendar = ({
  year,
  month,
  setYear,
  setMonth,
  roundsByDate,
  selectedDate,
  onDateSelect,
}) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  // 날짜 목록
  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  // 해당 달에 회차가 하나라도 있는지
  const hasRoundsInMonth = (yy, mm) => {
    const prefix = `${yy}-${mm + 1}-`;
    return Object.keys(roundsByDate).some((key) => key.startsWith(prefix));
  };

  const canGoPrev = () => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return hasRoundsInMonth(prevYear, prevMonth);
  };

  const canGoNext = () => {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    return hasRoundsInMonth(nextYear, nextMonth);
  };

  const handlePrevMonth = () => {
    if (!canGoPrev()) return;
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext()) return;
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const isRoundDate = (date) => {
    if (!date) return false;
    const key = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    return roundsByDate.hasOwnProperty(key);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header" style={{ cursor: "default" }}>
        <button
          className={`month-nav-btn ${canGoPrev() ? "" : "disabled-nav"}`}
          onClick={handlePrevMonth}
          disabled={!canGoPrev()}
        >
          <IoIosArrowBack size={20} />
        </button>
        <span>
          {year}.{(month + 1).toString().padStart(2, "0")}
        </span>
        <button
          className={`month-nav-btn ${canGoNext() ? "" : "disabled-nav"}`}
          onClick={handleNextMonth}
          disabled={!canGoNext()}
        >
          <IoIosArrowForward size={20} />
        </button>
      </div>

      <div className="calendar-weekdays" style={{ cursor: "default" }}>
        {daysOfWeek.map((dw) => (
          <div key={dw} className="weekday-cell">
            {dw}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={idx} className="calendar-day empty"></div>;
          }
          const dayOfWeek = date.getDay();
          const disabled = !isRoundDate(date);
          const isSelected =
            selectedDate && date.toDateString() === selectedDate.toDateString();

          // 일요일
          let textColor = "#000";
          if (dayOfWeek === 0) {
            textColor = disabled ? "#f5aaaa" : "red";
          } else if (disabled) {
            textColor = "#ccc";
          }
          if (isSelected) textColor = "#fff";

          const handleClick = () => {
            // 가능/불가능 상관없이 클릭은 허용하되 의미는 onDateSelect로 처리
            onDateSelect(date);
          };

          return (
            <div
              key={date.toDateString()}
              className={`calendar-day ${
                disabled ? "disabled-day" : "enabled-day"
              } ${isSelected ? "selected-day" : ""}`}
              style={{ color: textColor }}
              onClick={handleClick}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
