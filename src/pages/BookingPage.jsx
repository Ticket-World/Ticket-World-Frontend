import React from "react";
import { useParams } from "react-router-dom";

const BookingPage = () => {
  const { roundId } = useParams();

  return (
    <div>
      <h1>예매 페이지</h1>
      <p>회차 ID: {roundId}</p>
      {/* 좌석 선택 및 예매 로직 구현 */}
    </div>
  );
};

export default BookingPage;
