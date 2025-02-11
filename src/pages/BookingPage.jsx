// src/pages/BookingPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  fetchPerformanceDetail,
  fetchSeatAreas,
  fetchReservationState,
  patchTempReservation,
} from "../api/performanceAPI";

import SeatAreaLayout from "../components/SeatAreaLayout";
import SeatGradeInfo from "../components/SeatGradeInfo";
import SeatGrid from "../components/SeatGrid";
import SelectedSeats from "../components/SelectedSeats";
import "./BookingPage.css";

const USER_ID = "11111111-2222-3333-4444-555555555555";

const BookingPage = () => {
  const { performanceId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roundId = searchParams.get("roundId");

  const navigate = useNavigate();

  // 공연 정보
  const [performanceInfo, setPerformanceInfo] = useState(null);
  // 등급 ID -> { name, price, color }
  const [seatGradeMap, setSeatGradeMap] = useState({});
  // 공연에서 정한 최대 예약 가능 수
  const [maxReservationCount, setMaxReservationCount] = useState(10);

  // 영역 목록
  const [seatAreas, setSeatAreas] = useState([]);
  // 현재 선택된 영역 (null 이면 영역 배치도)
  const [selectedArea, setSelectedArea] = useState(null);

  // 좌석 예약 상태 (seatPosId -> { ticketId, canReserve })
  const [reservationMap, setReservationMap] = useState({});

  // 선택된 티켓(아이디) 및 상세
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 색상 팔레트
  const colorPalette = [
    "#ffe0e0",
    "#ffe8cc",
    "#fff0cc",
    "#f0fff0",
    "#e0ffe0",
    "#e0fff8",
    "#e0f0ff",
    "#e0e0ff",
    "#f8e0ff",
    "#ffe0f0",
    "#ffe0f8",
    "#fff0f0",
    "#f0f0ff",
    "#e8f0ff",
    "#e0fffc",
    "#f0ffe0",
    "#fff8e0",
    "#ffe0e8",
    "#fce0ff",
    "#e0ffe8",
  ];

  useEffect(() => {
    initPerformanceData();
  }, [performanceId]);

  const initPerformanceData = async () => {
    if (!roundId) {
      setError(new Error("roundId(회차 ID)가 없습니다."));
      return;
    }
    try {
      setLoading(true);
      const perfResp = await fetchPerformanceDetail(performanceId);
      const data = perfResp.data;
      const {
        title,
        location,
        rounds,
        seatGrades,
        maxReservationCount: maxCount,
      } = data;

      // 해당 roundId에 맞는 roundStartTime 찾기 (ex: [년,월,일,시,분])
      let roundStartTime = null;
      if (rounds && rounds.length > 0) {
        const found = rounds.find((r) => r.id === roundId);
        if (found) {
          roundStartTime = found.roundStartTime;
        }
      }

      setPerformanceInfo({
        title,
        location,
        roundStartTime,
      });

      if (maxCount) {
        setMaxReservationCount(maxCount);
      }

      // seatGrades -> color
      const tempMap = {};
      seatGrades.forEach((g, idx) => {
        tempMap[g.id] = {
          name: g.name,
          price: g.price,
          color: colorPalette[idx % colorPalette.length],
        };
      });
      setSeatGradeMap(tempMap);

      // 영역 목록
      const areaResp = await fetchSeatAreas(performanceId);
      setSeatAreas(areaResp.data.seatAreas);
      // 아직 reservationMap 불러오지 않고, 영역 클릭 시마다 fetch
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 영역 클릭 -> reservationMap 불러오고 -> 좌석 모드
  const handleAreaClick = async (areaObj) => {
    // 선택 좌석 초기화
    setSelectedTicketIds([]);
    setSelectedSeats([]);

    try {
      setLoading(true);
      const resState = await fetchReservationState(roundId, areaObj.id);
      const map = {};
      resState.data.tickets.forEach((t) => {
        map[t.seatPositionId] = { ticketId: t.id, canReserve: t.canReserve };
      });
      setReservationMap(map);
      setSelectedArea(areaObj);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 뒤로가기(영역 선택 화면)
  const handleBackToArea = () => {
    setSelectedArea(null);
    setReservationMap({});
    // 선택한 좌석도 초기화
    setSelectedTicketIds([]);
    setSelectedSeats([]);
  };

  // 좌석 클릭
  const handleSeatClick = (seatPos, floorName, areaName) => {
    const entry = reservationMap[seatPos.id];
    if (!entry || !entry.canReserve) return;

    const { ticketId } = entry;
    const exist = selectedTicketIds.includes(ticketId);
    if (exist) {
      // 해제
      setSelectedTicketIds(selectedTicketIds.filter((id) => id !== ticketId));
      setSelectedSeats(selectedSeats.filter((s) => s.ticketId !== ticketId));
    } else {
      if (selectedTicketIds.length >= maxReservationCount) {
        alert(`최대 ${maxReservationCount}석까지 선택 가능`);
        return;
      }
      // 추가
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

  // "좌석 선택 완료"
  const handleSeatSelection = async () => {
    if (selectedTicketIds.length === 0) {
      alert("좌석을 선택해주세요.");
      return;
    }
    try {
      const resp = await patchTempReservation(
        performanceId,
        USER_ID,
        selectedTicketIds
      );
      const reservationId = resp.data.reservationId;

      // seatGradeCounts
      const seatGradeCounts = {};
      selectedSeats.forEach((s) => {
        seatGradeCounts[s.seatGradeId] =
          (seatGradeCounts[s.seatGradeId] || 0) + 1;
      });

      navigate("/discount", {
        state: {
          reservationId,
          seatGradeCounts,
          totalSeats: selectedTicketIds.length,
          seatGradeNameMap: seatGradeMap,
          performanceId,
          selectedSeats,
        },
      });
    } catch (err) {
      setError(err);
    }
  };

  if (loading) return <div className="booking-page">로딩중...</div>;
  if (error)
    return <div className="booking-page error">에러: {error.message}</div>;

  // 공연 일자
  let dateText = "";
  if (performanceInfo?.roundStartTime) {
    const [yy, mm, dd, hh, min] = performanceInfo.roundStartTime;
    dateText = `${yy}년 ${mm}월 ${dd}일 ${hh}시 ${String(min).padStart(
      2,
      "0"
    )}분`;
  }

  return (
    <div className="booking-page">
      {/* 상단: 타이틀 / 장소 | 일자 */}
      {performanceInfo && (
        <div className="top-header">
          <h2 className="title-text">{performanceInfo.title}</h2>
          {performanceInfo.location && dateText && (
            <p className="sub-text">
              {performanceInfo.location} &nbsp;|&nbsp; {dateText}
            </p>
          )}
        </div>
      )}

      <div className="main-layout">
        <div className="left-side">
          {!selectedArea && seatAreas.length > 1 && (
            <SeatAreaLayout
              seatAreas={seatAreas}
              onAreaClick={(areaId) => {
                const area = seatAreas.find((a) => a.id === areaId);
                if (area) handleAreaClick(area);
              }}
            />
          )}

          {selectedArea && (
            <div className="seat-box">
              <div className="seat-box-header">
                <button className="back-button" onClick={handleBackToArea}>
                  뒤로가기
                </button>
              </div>
              <SeatGrid
                area={selectedArea}
                reservationMap={reservationMap}
                selectedTicketIds={selectedTicketIds}
                onSeatClick={handleSeatClick}
                seatGradeMap={seatGradeMap}
              />
            </div>
          )}
        </div>

        <div className="right-side">
          <SeatGradeInfo seatGradeMap={seatGradeMap} />
          <SelectedSeats
            selectedSeats={selectedSeats}
            seatGradeMap={seatGradeMap}
            maxCount={maxReservationCount}
            onConfirm={handleSeatSelection}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
