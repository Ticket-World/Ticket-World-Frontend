// src/components/PerformanceCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./PerformanceCard.css";

const PerformanceCard = ({ performance }) => {
  const { id, title, posterUrl, location, startDate, finishDate } = performance;

  // 날짜 포맷: 2025.2.14 ~ 2.16
  const formatDate = (dateArr) => {
    if (!dateArr) return "";
    const [year, month, day] = dateArr;
    return `${year}.${month}.${day}`;
  };

  return (
    <Link to={`/performance/${id}`} className="performance-card">
      <div className="poster-wrap">
        <img src={posterUrl} alt={`${title} 포스터`} className="poster" />
      </div>
      <div className="card-info">
        {/* 타이틀 (줄임표 처리 가능) */}
        <h3 className="card-title">{title}</h3>
        {/* 장소 */}
        <p className="card-location">{location}</p>
        {/* 날짜 */}
        <p className="card-date">
          {formatDate(startDate)} ~ {formatDate(finishDate)}
        </p>
      </div>
    </Link>
  );
};

export default PerformanceCard;
