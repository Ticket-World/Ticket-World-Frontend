// src/pages/PerformancePage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Calendar from "../components/Calendar";
import RoundTimeList from "../components/RoundTimeList";
import { fetchPerformanceDetail } from "../api/performanceAPI";
import "./PerformancePage.css";
import { AiFillStar } from "react-icons/ai";

const PerformancePage = () => {
  const { performanceId } = useParams();
  const navigate = useNavigate();

  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 달력/회차
  const [calendarYear, setCalendarYear] = useState(2025);
  const [calendarMonth, setCalendarMonth] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRoundId, setSelectedRoundId] = useState(null);

  // 임시 별점
  // const [rating] = useState(9.7);

  // 최소 예매 오픈시간
  const [minResStartTime, setMinResStartTime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetchPerformanceDetail(performanceId);
        const data = response.data;
        setPerformance(data);

        // 예약 오픈시간
        if (data.minimumReservationStartTime) {
          const [y, m, d, hh, mm] = data.minimumReservationStartTime;
          setMinResStartTime(new Date(y, m - 1, d, hh, mm));
        }

        // 회차 자동 선택
        if (data.rounds.length > 0) {
          const sorted = data.rounds
            .map((r) => {
              const [yy, mm, dd, h, mn] = r.roundStartTime;
              return {
                ...r,
                dateObj: new Date(yy, mm - 1, dd, h, mn),
              };
            })
            .sort((a, b) => a.dateObj - b.dateObj);

          const earliest = sorted[0];
          const [ey, em, ed] = earliest.roundStartTime;
          setSelectedRoundId(earliest.id);
          setSelectedDate(new Date(ey, em - 1, ed));

          setCalendarYear(ey);
          setCalendarMonth(em - 1);
        }
      } catch (err) {
        setError(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [performanceId]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;
  if (!performance) return null;

  const {
    title,
    startDate,
    finishDate,
    genre,
    posterUrl,
    location,
    runtime,
    ageLimit,
    rounds,
    descriptionImageUrls = [],
    seatGrades = [],
  } = performance;

  // InfoRow: null, 빈 문자열, 공백("   ") => 스킵
  const InfoRow = ({ label, value }) => {
    // value가 null이거나, trim()했을 때 빈 문자열이면 렌더링 스킵
    if (!value || value.trim() === "") {
      return null;
    }
    return (
      <div className="info-row">
        <div className="info-label">{label}</div>
        <div className="info-value">{value}</div>
      </div>
    );
  };

  const formatDate = ([y, m, d]) =>
    `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;

  // 장르 매핑
  const genreMap = { MUSICAL: "뮤지컬", CONCERT: "콘서트" };
  const genreKor = genreMap[genre] || genre;

  // 날짜별 회차
  const roundsByDate = rounds.reduce((acc, r) => {
    const [yy, mm, dd, hh, mn] = r.roundStartTime;
    const key = `${yy}-${mm}-${dd}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      id: r.id,
      dateObj: new Date(yy, mm - 1, dd, hh, mn),
      time: `${String(hh).padStart(2, "0")}:${String(mn).padStart(2, "0")}`,
    });
    return acc;
  }, {});

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const key = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    const daily = roundsByDate[key] || [];
    if (daily.length > 0) {
      daily.sort((a, b) => a.dateObj - b.dateObj);
      setSelectedRoundId(daily[0].id);
    } else {
      setSelectedRoundId(null);
    }
  };

  const handleRoundSelect = (roundId) => {
    setSelectedRoundId(roundId);
  };

  const handleBooking = () => {
    if (!selectedRoundId) return;
    navigate(`/booking/${selectedRoundId}`);
  };

  // 종료 / 오픈예정
  const now = new Date();
  const hasNoRounds = rounds.length === 0;
  const isOpenSoon = hasNoRounds && minResStartTime && minResStartTime > now;
  const isEndedConcert =
    hasNoRounds && (!minResStartTime || minResStartTime <= now);

  // 예매 버튼
  let bookingButtonText = "예매하기";
  let bookingButtonStyle = {};
  let bookingButtonDisabled = false;

  if (isEndedConcert) {
    bookingButtonText = "종료된 공연입니다.";
    bookingButtonStyle = { backgroundColor: "#ccc", cursor: "default" }; // 일반 커서
    bookingButtonDisabled = true;
  } else if (isOpenSoon) {
    bookingButtonStyle = { backgroundColor: "#ccc", cursor: "default" };
    bookingButtonDisabled = true;
    if (minResStartTime) {
      const yy = minResStartTime.getFullYear();
      const mm = String(minResStartTime.getMonth() + 1).padStart(2, "0");
      const dd = String(minResStartTime.getDate()).padStart(2, "0");
      const hh = String(minResStartTime.getHours()).padStart(2, "0");
      const mn = String(minResStartTime.getMinutes()).padStart(2, "0");
      bookingButtonText = `${yy}.${mm}.${dd} ${hh}:${mn} 오픈 예정`;
    } else {
      bookingButtonText = "오픈 예정";
    }
  }

  // 공연 상세 정보 이미지가 없으면 이 섹션 숨김
  const hasDescriptionImages = descriptionImageUrls.length > 0;

  return (
    <div className="performance-page">
      <div className="performance-left">
        <div className="title-and-rating">
          <h2 className="performance-title">{title}</h2>
          {/* <div className="star-rating">
            {[...Array(5)].map((_, i) => (
              <AiFillStar key={i} color="#FFC107" />
            ))}
            <span className="rating-value">{rating}</span>
          </div> */}
        </div>

        <div className="top-section">
          <div className="poster-container">
            <img src={posterUrl} alt="포스터" className="performance-poster" />
          </div>
          <div className="basic-info">
            <InfoRow label="장소" value={location} />
            <InfoRow
              label="공연기간"
              value={
                startDate && finishDate
                  ? `${formatDate(startDate)} ~ ${formatDate(finishDate)}`
                  : ""
              }
            />
            <InfoRow label="공연시간" value={runtime} />
            <InfoRow label="관람연령" value={ageLimit} />
            <InfoRow label="장르" value={genreKor} />

            {/* 가격 정보 */}
            {seatGrades.length > 0 && (
              <div className="info-row">
                <div className="info-label">가격</div>
                <div className="info-value">
                  {seatGrades.map((grade) => {
                    // 등급 이름이 없거나 공백이면 스킵
                    if (!grade.name || grade.name.trim() === "") {
                      return null;
                    }
                    // price가 있다면 굵게 표현
                    if (grade.price) {
                      return (
                        <div key={grade.id}>
                          {grade.name} -{" "}
                          <strong>{grade.price.toLocaleString()}원</strong>
                        </div>
                      );
                    } else {
                      // price 없는 경우
                      return <div key={grade.id}>{grade.name}</div>;
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {hasDescriptionImages && (
          <>
            <hr className="divider" />
            <h3 className="section-title">공연 정보</h3>
            <div className="description-images">
              {descriptionImageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`설명 ${idx + 1}`}
                  className="desc-img"
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="performance-right">
        {!(isEndedConcert || isOpenSoon) && (
          <>
            <div className="calendar-section">
              <Calendar
                year={calendarYear}
                month={calendarMonth}
                setYear={setCalendarYear}
                setMonth={setCalendarMonth}
                roundsByDate={roundsByDate}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>
            <hr className="between-line" />
            <div className="rounds-section">
              <h4>회차</h4>
              {selectedDate ? (
                <RoundTimeList
                  selectedRoundId={selectedRoundId}
                  rounds={
                    roundsByDate[
                      `${selectedDate.getFullYear()}-${
                        selectedDate.getMonth() + 1
                      }-${selectedDate.getDate()}`
                    ] || []
                  }
                  onRoundSelect={handleRoundSelect}
                />
              ) : (
                <p className="round-info">날짜를 선택하세요</p>
              )}
            </div>
          </>
        )}

        <button
          className="booking-button"
          onClick={handleBooking}
          disabled={bookingButtonDisabled}
          style={bookingButtonStyle}
        >
          {bookingButtonText}
        </button>
      </div>
    </div>
  );
};

export default PerformancePage;
