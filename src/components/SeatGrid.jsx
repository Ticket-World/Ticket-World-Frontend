// src/components/SeatGrid.jsx
import React from "react";
import "./SeatGrid.css";

/**
 * props:
 *  - area: { id, width, height, floorName, areaName, positions: [...] }
 *  - reservationMap: { seatPosId -> { ticketId, canReserve } }
 *  - selectedTicketIds: string[]
 *  - onSeatClick
 *  - seatGradeMap: { gradeId -> { name, price, color } }
 */
const SeatGrid = ({
  area,
  reservationMap,
  selectedTicketIds,
  onSeatClick,
  seatGradeMap,
}) => {
  const { width, height, floorName, areaName, positions } = area;

  const seatMap = {};
  positions.forEach((p) => {
    seatMap[`${p.x},${p.y}`] = p;
  });

  const cells = [];
  for (let row = 0; row <= height; row++) {
    for (let col = 0; col <= width; col++) {
      if (row === 0 && col === 0) {
        cells.push(<div key="corner" className="label-cell corner-cell" />);
        continue;
      }
      if (row === 0 && col > 0) {
        cells.push(
          <div key={`col-${col}`} className="label-cell col-label">
            {col}
          </div>
        );
        continue;
      }
      if (col === 0 && row > 0) {
        cells.push(
          <div key={`row-${row}`} className="label-cell row-label">
            {row}
          </div>
        );
        continue;
      }

      const seatX = col - 1;
      const seatY = row - 1;
      const seatPos = seatMap[`${seatX},${seatY}`];

      if (!seatPos) {
        cells.push(
          <div key={`empty-${col},${row}`} className="seat-cell empty-cell" />
        );
      } else {
        const entry = reservationMap[seatPos.id];
        if (!entry) {
          cells.push(
            <div key={seatPos.id} className="seat-cell seat unavailable">
              ?
            </div>
          );
        } else {
          const { ticketId, canReserve } = entry;
          const isSelected = selectedTicketIds.includes(ticketId);
          let seatClass = "unavailable";
          let seatStyle = {};

          if (canReserve) {
            seatClass = isSelected ? "selected" : "available";
            const gInfo = seatGradeMap[seatPos.seatGradeId];
            const bgColor = gInfo?.color || "#f9f9f9";
            seatStyle = {
              width: "30px",
              height: "30px",
              backgroundColor: isSelected ? "#3fa7d6" : bgColor,
              color: isSelected ? "#fff" : "#333",
            };
          }

          const handleClick = () => {
            if (!canReserve) return;
            onSeatClick(seatPos, floorName, areaName);
          };

          cells.push(
            <div
              key={seatPos.id}
              className={`seat-cell seat ${seatClass}`}
              style={seatStyle}
              onClick={handleClick}
            />
          );
        }
      }
    }
  }

  return (
    <div
      className="seat-grid-labeled"
      style={{
        gridTemplateColumns: `repeat(${width + 1}, 30px)`,
        gridTemplateRows: `repeat(${height + 1}, 30px)`,
      }}
    >
      {cells}
    </div>
  );
};

export default SeatGrid;
