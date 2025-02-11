// src/components/Calendar.jsx

import React from "react";
import "./Calendar.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

/**
 * roundsByDate: {
 *   "2025-2-10": [...],  // key = "YYYY-(1..12)-(day)"
 *   ...
 * }
 *
 * year, month -> JS Date 기준 (0..11)
 */
const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const Calendar = ({
  year, // 0..11 (JS Date 기준)
  month, // 0..11 (JS Date)
  setYear,
  setMonth,
  roundsByDate, // key: "YYYY-(1..12)-(day)"
  selectedDate,
  onDateSelect,
}) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  // 현재 달의 날짜 목록
  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    // JS Date
    days.push(new Date(year, month, d));
  }

  /**
   * 해당 달에 회차가 있는지 여부
   *  - key를 만들 때 month+1
   */
  const hasRoundsInMonth = (yy, mm) => {
    const prefix = `${yy}-${mm + 1}-`;
    return Object.keys(roundsByDate).some((key) => key.startsWith(prefix));
  };

  /**
   * 현재 달에 존재하는 "가장 빠른" 날짜(회차가 있는) 찾기
   */
  const findEarliestRoundInMonth = (yy, mm) => {
    const prefix = `${yy}-${mm + 1}-`;
    // roundsByDate의 모든 key 중에서 prefix로 시작하는 것들 -> 일(day)만 추출
    // 예: "2025-2-5", "2025-2-10"...
    const matchedKeys = Object.keys(roundsByDate).filter((k) =>
      k.startsWith(prefix)
    );
    if (matchedKeys.length === 0) return null;

    // "2025-2-5" -> day=5
    // 가장 작은 day 키를 찾으면, 그 날짜가 가장 빠른 날짜
    let earliestDay = Infinity;
    matchedKeys.forEach((k) => {
      // k = "YYYY-(1..12)-day"
      const parts = k.split("-");
      const dayNum = parseInt(parts[2], 10);
      if (dayNum < earliestDay) {
        earliestDay = dayNum;
      }
    });

    // earliestDay가 null이면 없음
    if (!isFinite(earliestDay)) return null;

    // 해당 날짜를 JS Date로
    return new Date(yy, mm, earliestDay);
  };

  /**
   * 이전/다음 달 버튼 활성 여부
   */
  const canGoPrev = () => {
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    return hasRoundsInMonth(prevY, prevM);
  };
  const canGoNext = () => {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    return hasRoundsInMonth(nextY, nextM);
  };

  /**
   * 이전 달 이동 후 -> 그 달의 가장 빠른 날짜(회차 있음) 자동 선택
   */
  const handlePrevMonth = () => {
    if (!canGoPrev()) return;
    // 달 세팅
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 0) {
      newYear -= 1;
      newMonth = 11;
    }
    setYear(newYear);
    setMonth(newMonth);

    // 가장 빠른 날짜 찾기
    const earliestDate = findEarliestRoundInMonth(newYear, newMonth);
    if (earliestDate) {
      onDateSelect(earliestDate);
    } else {
      // 해당 달에 회차가 없으면 selectedDate를 null로
      onDateSelect(null);
    }
  };

  /**
   * 다음 달 이동 후 -> 그 달의 가장 빠른 날짜(회차 있음) 자동 선택
   */
  const handleNextMonth = () => {
    if (!canGoNext()) return;
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 11) {
      newYear += 1;
      newMonth = 0;
    }
    setYear(newYear);
    setMonth(newMonth);

    const earliestDate = findEarliestRoundInMonth(newYear, newMonth);
    if (earliestDate) {
      onDateSelect(earliestDate);
    } else {
      onDateSelect(null);
    }
  };

  /**
   * 날짜별로 회차 유무를 판단 (클릭 가능 여부)
   */
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
          {year}.{String(month + 1).padStart(2, "0")}
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
          const hasRound = isRoundDate(date);
          const isSelected =
            selectedDate && date.toDateString() === selectedDate.toDateString();

          // 텍스트 색상
          let textColor = "#000";
          if (dayOfWeek === 0) {
            // 일요일
            textColor = hasRound ? "red" : "#f5aaaa";
          } else if (!hasRound) {
            textColor = "#ccc";
          }
          if (isSelected) {
            textColor = "#fff";
          }

          // "회차가 없는 날짜" -> 클릭 불가
          const handleClick = () => {
            if (!hasRound) return;
            onDateSelect(date);
          };

          return (
            <div
              key={date.toISOString()}
              className={`calendar-day ${
                hasRound ? "enabled-day" : "disabled-day"
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
