import React from "react";
import "./RoundTimeList.css";

const RoundTimeList = ({ rounds, selectedRoundId, onRoundSelect }) => {
  if (!rounds.length) {
    return (
      <div className="no-rounds">해당 날짜에 예약 가능한 회차가 없습니다.</div>
    );
  }

  return (
    <div className="round-time-list">
      <ul>
        {rounds.map((round, idx) => (
          <li key={round.id}>
            <button
              className={`round-button ${
                round.id === selectedRoundId ? "active" : ""
              }`}
              onClick={() => onRoundSelect(round.id)}
            >
              {/* 1회차 -> 1회 로 변경, 굵기 낮춤 */}
              {`${idx + 1}회`} {round.time}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoundTimeList;
