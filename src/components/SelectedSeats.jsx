// src/pages/BookingPage/SelectedSeats.jsx
import React from "react";

const SelectedSeats = ({ selectedTicketIds, maxCount, onConfirm }) => {
  return (
    <div className="selected-seats">
      <h4>
        선택된 좌석 ({selectedTicketIds.length} / {maxCount})
      </h4>
      {selectedTicketIds.length === 0 ? (
        <p>선택된 좌석 없음</p>
      ) : (
        <ul>
          {selectedTicketIds.map((tid) => (
            <li key={tid}>ticketId: {tid}</li>
          ))}
        </ul>
      )}
      <button onClick={onConfirm}>좌석 선택</button>
    </div>
  );
};

export default SelectedSeats;
