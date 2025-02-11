// src/pages/BookingPage/index.jsx

import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  fetchPerformanceDetail,
  fetchSeatAreas,
  fetchReservationState,
  patchTempReservation,
} from "../api/performanceAPI";
import SeatAreaSelector from "../components/SeatAreaSelector";
import SeatGrid from "../components/SeatGrid";
import SelectedSeats from "../components/SelectedSeats";
import "./BookingPage.css";

const MAX_RESERVATION_COUNT = 10;
const USER_ID = "11111111-2222-3333-4444-555555555555";

const BookingPage = () => {
  const navigate = useNavigate();
  const { performanceId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roundId = searchParams.get("roundId");

  const [performanceInfo, setPerformanceInfo] = useState(null);
  // 등급별 (name, price)
  const [seatGradeMap, setSeatGradeMap] = useState({});

  // 영역 목록
  const [seatAreas, setSeatAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);

  // (seatPositionId -> { ticketId, canReserve })
  const [reservationMap, setReservationMap] = useState({});
  // 선택된 티켓 ID (단순)
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  // **선택된 좌석들의 상세 정보** [{ seatPositionId, ticketId, seatGradeId, floorName, areaName, seatName }, ...]
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initData();
  }, [performanceId]);

  const initData = async () => {
    try {
      setLoading(true);
      const resp = await fetchPerformanceDetail(performanceId);
      const data = resp.data;
      const { title, location, startDate, finishDate, seatGrades } = data;
      setPerformanceInfo({ title, location, startDate, finishDate });

      const map = {};
      seatGrades.forEach((g) => {
        map[g.id] = { name: g.name, price: g.price };
      });
      setSeatGradeMap(map);

      const areaResp = await fetchSeatAreas(performanceId);
      setSeatAreas(areaResp.data.seatAreas);
      if (areaResp.data.seatAreas.length === 1) {
        setSelectedAreaId(areaResp.data.seatAreas[0].id);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAreaId) {
      loadReservationState(selectedAreaId);
    }
  }, [selectedAreaId, roundId]);

  const loadReservationState = async (areaId) => {
    if (!roundId || !areaId) return;
    try {
      setLoading(true);
      const resp = await fetchReservationState(roundId, areaId);
      const map = {};
      resp.data.tickets.forEach((t) => {
        map[t.seatPositionId] = { ticketId: t.id, canReserve: t.canReserve };
      });
      setReservationMap(map);
      setSelectedTicketIds([]);
      setSelectedSeats([]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (areaId) => {
    setSelectedAreaId(areaId);
  };

  const handleSeatClick = (seatPos, floorName, areaName) => {
    const entry = reservationMap[seatPos.id];
    if (!entry || !entry.canReserve) return;

    const { ticketId } = entry;
    if (selectedTicketIds.includes(ticketId)) {
      setSelectedTicketIds(selectedTicketIds.filter((id) => id !== ticketId));
      setSelectedSeats(selectedSeats.filter((s) => s.ticketId !== ticketId));
    } else {
      if (selectedTicketIds.length >= MAX_RESERVATION_COUNT) {
        alert(`최대 ${MAX_RESERVATION_COUNT}석까지 선택가능`);
        return;
      }
      setSelectedTicketIds([...selectedTicketIds, ticketId]);
      setSelectedSeats([
        ...selectedSeats,
        {
          seatPositionId: seatPos.id,
          ticketId,
          seatGradeId: seatPos.seatGradeId,
          floorName,
          areaName,
          seatName: seatPos.name,
        },
      ]);
    }
  };

  const handleSeatSelection = async () => {
    if (!roundId) {
      alert("회차 ID가 없습니다.");
      return;
    }
    if (selectedTicketIds.length === 0) {
      alert("좌석을 선택하세요.");
      return;
    }
    try {
      const resp = await patchTempReservation(
        performanceId,
        USER_ID,
        selectedTicketIds
      );
      const reservationId = resp.data.reservationId;

      const seatGradeCounts = buildSeatGradeCounts();

      navigate("/discount", {
        state: {
          reservationId,
          seatGradeCounts,
          totalSeats: selectedTicketIds.length,
          seatGradeNameMap: seatGradeMap,
          performanceId,
          selectedSeats, // 좌석 상세 정보
        },
      });
    } catch (err) {
      setError(err);
    }
  };

  const buildSeatGradeCounts = () => {
    const counts = {};
    selectedSeats.forEach((seat) => {
      const gId = seat.seatGradeId;
      counts[gId] = (counts[gId] || 0) + 1;
    });
    return counts;
  };

  const area = seatAreas.find((a) => a.id === selectedAreaId);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div className="error">에러: {error.message}</div>;

  return (
    <div className="booking-page">
      <h2>예매 페이지</h2>
      {performanceInfo && (
        <div className="performance-brief">
          <h3>{performanceInfo.title}</h3>
          <p>장소: {performanceInfo.location}</p>
          {performanceInfo.startDate && performanceInfo.finishDate && (
            <p>
              일정: {performanceInfo.startDate.join(".")} ~{" "}
              {performanceInfo.finishDate.join(".")}
            </p>
          )}
        </div>
      )}
      {roundId ? (
        <p>회차 ID: {roundId}</p>
      ) : (
        <p className="error">회차 ID가 없습니다.</p>
      )}

      <SeatAreaSelector
        seatAreas={seatAreas}
        selectedAreaId={selectedAreaId}
        onChange={handleAreaChange}
      />

      {area && (
        <SeatGrid
          area={area}
          reservationMap={reservationMap}
          selectedTicketIds={selectedTicketIds}
          onSeatClick={handleSeatClick}
        />
      )}

      <SelectedSeats
        selectedTicketIds={selectedTicketIds}
        maxCount={MAX_RESERVATION_COUNT}
        onConfirm={handleSeatSelection}
      />
    </div>
  );
};

export default BookingPage;
