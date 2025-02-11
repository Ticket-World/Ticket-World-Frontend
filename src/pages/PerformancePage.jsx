// src/pages/PerformancePage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Calendar from "../components/Calendar";
import RoundTimeList from "../components/RoundTimeList";
import { fetchPerformanceDetail } from "../api/performanceAPI";
import "./PerformancePage.css";

const PerformancePage = () => {
  const { performanceId } = useParams();
  const navigate = useNavigate();

  // 달력 상태
  const [calendarYear, setCalendarYear] = useState(2025);
  const [calendarMonth, setCalendarMonth] = useState(0); // JS에서 0=1월
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRoundId, setSelectedRoundId] = useState(null);

  // 공연 정보, 로딩/에러
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 예매 오픈 시간
  const [minResStartTime, setMinResStartTime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resp = await fetchPerformanceDetail(performanceId);
        const data = resp.data;
        setPerformance(data);

        // 예매 오픈 시간 (서버 month는 1-12 → JS Date는 0-11)
        if (data.minimumReservationStartTime) {
          const [y, m, d, hh, mm] = data.minimumReservationStartTime;
          // m - 1 필요
          setMinResStartTime(new Date(y, m - 1, d, hh, mm));
        }

        // 회차가 존재하면 가장 빠른 회차를 자동 선택
        if (data.rounds.length > 0) {
          // 시간 순 정렬
          const sortedRounds = data.rounds
            .map((r) => {
              const [yy, mm, dd, h, mn] = r.roundStartTime;
              // 여기서도 month-1
              return {
                ...r,
                dateObj: new Date(yy, mm - 1, dd, h, mn),
              };
            })
            .sort((a, b) => a.dateObj - b.dateObj);

          // 첫 번째(가장 빠른) 회차
          const earliest = sortedRounds[0];
          const [ey, em, ed] = earliest.roundStartTime; // 서버 값(1~12)

          // 실제 JS에서 쓸 때 month-1
          setSelectedRoundId(earliest.id);
          setSelectedDate(new Date(ey, em - 1, ed));

          // 달력도 동일
          setCalendarYear(ey);
          setCalendarMonth(em - 1); // 0=1월
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

  // null/빈문자/공백 처리
  const InfoRow = ({ label, value }) => {
    if (!value || value.trim() === "") return null;
    return (
      <div className="info-row">
        <div className="info-label">{label}</div>
        <div className="info-value">{value}</div>
      </div>
    );
  };

  // YYYY.MM.DD (month는 서버에서 받은 그대로 +1 필요)
  const formatDate = ([y, m, d]) => {
    const mm = String(m).padStart(2, "0"); // 서버가 1-based
    const dd = String(d).padStart(2, "0");
    return `${y}.${mm}.${dd}`;
  };

  // 장르 치환
  const genreMap = { MUSICAL: "뮤지컬", CONCERT: "콘서트" };
  const genreKor = genreMap[genre] || genre;

  // rounds를 먼저 시간 순 정렬 → 날짜별로 그룹화
  // 서버 month가 1~12
  const roundsByDate = [...rounds]
    .sort((a, b) => {
      const [ay, am, ad, ah, amin] = a.roundStartTime;
      const [by, bm, bd, bh, bmin] = b.roundStartTime;
      // month-1
      const dateA = new Date(ay, am - 1, ad, ah, amin);
      const dateB = new Date(by, bm - 1, bd, bh, bmin);
      return dateA - dateB;
    })
    .reduce((acc, r) => {
      const [yy, mm, dd, hh, mn] = r.roundStartTime; // 1-based month
      const key = `${yy}-${mm}-${dd}`; // 그룹화 key
      if (!acc[key]) acc[key] = [];

      acc[key].push({
        id: r.id,
        dateObj: new Date(yy, mm - 1, dd, hh, mn),
        time: `${String(hh).padStart(2, "0")}:${String(mn).padStart(2, "0")}`,
      });
      return acc;
    }, {});

  // 달력에서 날짜 선택 (JS Date: month=0~11)
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // key = `YYYY-(month+1)-(date.getDate())` (서버에선 1-based month)
    const key = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    const daily = roundsByDate[key] || [];
    if (daily.length > 0) {
      // 이미 시간 순
      setSelectedRoundId(daily[0].id);
    } else {
      setSelectedRoundId(null);
    }
  };

  const handleRoundSelect = (roundId) => {
    setSelectedRoundId(roundId);
  };

  const navigateBooking = () => {
    if (!selectedRoundId) return;
    navigate(`/booking/${performanceId}?roundId=${selectedRoundId}`);
  };

  // 종료/오픈 예정
  const now = new Date();
  const hasNoRounds = rounds.length === 0;
  const isOpenSoon = hasNoRounds && minResStartTime && minResStartTime > now;
  const isEndedConcert =
    hasNoRounds && (!minResStartTime || minResStartTime <= now);

  // 예매 버튼 처리
  let bookingButtonText = "예매하기";
  let bookingButtonStyle = {};
  let bookingButtonDisabled = false;

  if (isEndedConcert) {
    bookingButtonText = "종료된 공연입니다.";
    bookingButtonStyle = { backgroundColor: "#ccc", cursor: "default" };
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

  // 공연 상세 이미지
  const hasDescriptionImages = descriptionImageUrls.length > 0;

  return (
    <div className="performance-page">
      <div className="performance-left">
        <h2 className="performance-title">{title}</h2>
        <br />

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

            {/* 가격 */}
            {seatGrades.length > 0 && (
              <div className="info-row">
                <div className="info-label">가격</div>
                <div className="info-value">
                  {seatGrades.map((grade) => {
                    if (!grade.name || grade.name.trim() === "") return null;
                    if (grade.price) {
                      return (
                        <div key={grade.id}>
                          {grade.name} -{" "}
                          <strong>{grade.price.toLocaleString()}원</strong>
                        </div>
                      );
                    } else {
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
        {/* 달력/회차 표시 (공연 종료나 오픈 전 제외) */}
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
                  // 해당 날짜의 회차 목록
                  rounds={getDailyRounds(roundsByDate, selectedDate)}
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
          onClick={navigateBooking}
          disabled={bookingButtonDisabled}
          style={bookingButtonStyle}
        >
          {bookingButtonText}
        </button>
      </div>
    </div>
  );
};

/**
 * 날짜 객체(JS Date) -> 키를 만들 때 (year)-(month+1)-(date)
 * month+1 하는 이유: JS Date(0-11) → 서버(1-12) 기반
 */
function getDailyRounds(roundsByDate, dateObj) {
  const key = `${dateObj.getFullYear()}-${
    dateObj.getMonth() + 1
  }-${dateObj.getDate()}`;
  return roundsByDate[key] || [];
}

export default PerformancePage;
