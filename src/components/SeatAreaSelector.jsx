import React from "react";

const SeatAreaSelector = ({ seatAreas, selectedAreaId, onChange }) => {
  if (!seatAreas || seatAreas.length === 0) {
    return <div>영역 정보 없음</div>;
  }

  if (seatAreas.length === 1) {
    const area = seatAreas[0];
    return (
      <div className="single-area-info">
        <h3>
          {area.floorName} {area.areaName}
        </h3>
      </div>
    );
  }

  return (
    <div className="area-select-box">
      <label>좌석 영역 선택: </label>
      <select
        value={selectedAreaId || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">영역 선택</option>
        {seatAreas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.floorName} {area.areaName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SeatAreaSelector;
