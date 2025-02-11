// src/components/SeatGradeInfo.jsx
import React from "react";
import "./SeatGradeInfo.css";

const SeatGradeInfo = ({ seatGradeMap }) => {
  const gradeIds = Object.keys(seatGradeMap || {});
  if (gradeIds.length === 0) return null;

  return (
    <div className="seat-grade-info">
      <h4>좌석 등급</h4>
      <div className="grade-list">
        {gradeIds.map((gId) => {
          const g = seatGradeMap[gId];
          return (
            <div key={gId} className="grade-item">
              <div
                className="grade-color-box"
                style={{ backgroundColor: g.color }}
              />
              <div className="grade-text">
                <strong>{g.name}</strong>
                <br />
                <span className="price-info">{g.price.toLocaleString()}원</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeatGradeInfo;
