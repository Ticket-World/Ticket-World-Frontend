// src/components/SeatAreaLayout.jsx
import React from "react";
import "./SeatAreaLayout.css";

/**
 * seatAreas: [{ id, floorName, areaName }, ...]
 * onAreaClick(areaId)
 */
const SeatAreaLayout = ({ seatAreas, onAreaClick }) => {
  return (
    <div className="area-layout">
      <h3>영역 선택</h3>
      <div className="area-grid">
        {seatAreas
          .sort((a, b) => {
            const keyA = a.floorName + a.areaName;
            const keyB = b.floorName + b.areaName;
            return keyA.localeCompare(keyB);
          })
          .map((ar) => (
            <div
              key={ar.id}
              className="area-box"
              onClick={() => onAreaClick(ar.id)}
            >
              <p className="area-floor">{ar.floorName}</p>
              <p className="area-name">{ar.areaName}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SeatAreaLayout;
