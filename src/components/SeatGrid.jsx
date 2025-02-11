// src/components/SeatGrid.jsx
import React from "react";
import "../pages/BookingPage.css";

/**
 * props:
 *  - area: {
 *      id,
 *      width,
 *      height,
 *      floorName,
 *      areaName,
 *      positions: [{ id, x, y, name, seatGradeId }, ...]
 *    }
 *  - reservationMap: { [seatPositionId]: { ticketId, canReserve } }
 *  - selectedTicketIds: string[]  (선택된 ticketId 목록)
 *  - onSeatClick: (seatPos, floorName, areaName) => void
 */
const SeatGrid = ({ area, reservationMap, selectedTicketIds, onSeatClick }) => {
  const { width, height, floorName, areaName, positions } = area;

  // positions: [{id, x, y, name, seatGradeId}, ...]
  // grid: (row=0..height, col=0..width)
  // row=0 => 열 라벨 / col=0 => 행 라벨 / else => 좌석

  // seatMap for quick find
  const seatMap = {};
  positions.forEach((p) => {
    const key = `${p.x},${p.y}`;
    seatMap[key] = p;
  });

  const cells = [];
  for (let row = 0; row <= height; row++) {
    for (let col = 0; col <= width; col++) {
      // corner (0,0)
      if (row === 0 && col === 0) {
        cells.push(
          <div key="corner" className="label-cell corner-cell">
            {/* empty */}
          </div>
        );
        continue;
      }
      // 열 라벨
      if (row === 0 && col > 0) {
        cells.push(
          <div key={`col-${col}`} className="label-cell col-label">
            {col}
          </div>
        );
        continue;
      }
      // 행 라벨
      if (col === 0 && row > 0) {
        const rowLabel = String.fromCharCode("A".charCodeAt(0) + (row - 1));
        cells.push(
          <div key={`row-${row}`} className="label-cell row-label">
            {rowLabel}
          </div>
        );
        continue;
      }

      // 좌석
      const seatX = col - 1;
      const seatY = row - 1;
      const seatKey = `${seatX},${seatY}`;
      const seatPos = seatMap[seatKey];
      if (!seatPos) {
        // 비어있는 칸
        cells.push(
          <div key={`empty-${col},${row}`} className="seat-cell empty-cell" />
        );
      } else {
        // 예매 상태
        const entry = reservationMap[seatPos.id];
        if (!entry) {
          // 정보없음
          cells.push(
            <div key={seatPos.id} className="seat-cell seat unavailable">
              ?
            </div>
          );
        } else {
          const { ticketId, canReserve } = entry;
          const isSelected = selectedTicketIds.includes(ticketId);
          let seatClass = "unavailable";
          if (canReserve) {
            seatClass = isSelected ? "selected" : "available";
          }

          // 클릭
          const handleClick = () => {
            if (!canReserve) return;
            // (seatPos, floorName, areaName) 전달
            onSeatClick(seatPos, floorName, areaName);
          };

          cells.push(
            <div
              key={seatPos.id}
              className={`seat-cell seat ${seatClass}`}
              onClick={handleClick}
            >
              {seatPos.name}
            </div>
          );
        }
      }
    }
  }

  return (
    <div
      className="seat-grid-labeled"
      style={{
        gridTemplateColumns: `repeat(${width + 1}, 50px)`,
        gridTemplateRows: `repeat(${height + 1}, 50px)`,
      }}
    >
      {cells}
    </div>
  );
};

export default SeatGrid;
