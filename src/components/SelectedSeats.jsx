// src/components/SelectedSeats.jsx
import React from "react";
import "./SelectedSeats.css";

/**
 * props:
 *  - selectedSeats: [ { seatGradeId, floorName, areaName, seatName, ...} ]
 *  - seatGradeMap: { gradeId -> { name, price, color } }
 *  - maxCount
 *  - onConfirm()
 */
const SelectedSeats = ({
  selectedSeats,
  seatGradeMap,
  maxCount,
  onConfirm,
}) => {
  return (
    <div className="selected-seats-panel">
      <h4>
        선택 좌석 ({selectedSeats.length} / {maxCount})
      </h4>
      {selectedSeats.length === 0 ? (
        <p className="no-seat-text">선택된 좌석 없음</p>
      ) : (
        <ul className="selected-seat-list">
          {selectedSeats.map((s, idx) => {
            const gInfo = seatGradeMap[s.seatGradeId];
            const color = gInfo?.color || "#ccc";
            // "1층 / F-1구역 / 3열14번" 형식
            const seatLabel = `${s.floorName} / ${s.areaName} / ${s.seatName}`;
            return (
              <li key={idx} className="seat-item">
                <div
                  className="grade-color-box"
                  style={{ backgroundColor: color }}
                />
                <span className="seat-label">{seatLabel}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button className="confirm-seat-button" onClick={onConfirm}>
        좌석 선택 완료
      </button>
    </div>
  );
};

export default SelectedSeats;
