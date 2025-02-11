// src/pages/PaymentPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { patchPaymentStart, patchPaymentConfirm } from "../api/performanceAPI";
import "./PaymentPage.css";

const USER_ID = "11111111-2222-3333-4444-555555555555";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * DiscountPage에서 넘어오는 state 예시:
   * {
   *   reservationId: string,
   *   performanceId: string,
   *   paymentItems: [
   *     { seatGradeId, reservationCount, discountId? },
   *     ...
   *   ],
   *   totalAmount: number,
   *   chosenDiscountsInfo: string[], // ["VIP 3석 ...", ...]
   *   selectedSeats: [
   *     { seatPositionId, ticketId, seatGradeId, floorName, areaName, seatName },
   *     ...
   *   ],
   *   seatGradeNameMap: { [gradeId]: { name, price } }
   * }
   */
  const {
    reservationId,
    performanceId,
    paymentItems,
    totalAmount,
    chosenDiscountsInfo,
    selectedSeats,
    seatGradeNameMap,
  } = location.state || {};

  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);
  const [popupInfo, setPopupInfo] = useState({ paymentId: "", totalAmount: 0 });

  if (!reservationId || !paymentItems) {
    return <div className="payment-page">결제 정보가 없습니다.</div>;
  }

  // 결제하기 -> payment/start API
  const handlePaymentStart = async () => {
    try {
      const resp = await patchPaymentStart({
        reservationId,
        paymentItems,
        paymentMethod: "CREDIT_CARD",
        userId: USER_ID,
      });
      // resp.data => { paymentId, totalAmount }
      setPopupInfo({
        paymentId: resp.data.paymentId,
        totalAmount: resp.data.totalAmount,
      });
      setPaymentPopupOpen(true);
    } catch (err) {
      alert("결제 시작 오류");
    }
  };

  // 팝업에서 "결제 완료"
  const handlePaymentConfirm = async () => {
    try {
      const { paymentId } = popupInfo;
      await patchPaymentConfirm({
        paymentId,
        userId: USER_ID,
        reservationId,
      });
      alert("결제 완료되었습니다!");
      setPaymentPopupOpen(false);
      navigate(`/performance/${performanceId}`);
    } catch (err) {
      alert("결제 승인 오류");
    }
  };

  return (
    <div className="payment-page">
      <h2>결제 페이지</h2>

      <div className="payment-info-box">
        <h3>선택 티켓 정보</h3>
        {/* 좌석 상세 목록: 층, 영역, 좌석번호, 등급 (등급이름) */}
        <TicketInfoList
          selectedSeats={selectedSeats}
          seatGradeNameMap={seatGradeNameMap}
        />

        <h3>적용된 할인 목록</h3>
        {chosenDiscountsInfo && chosenDiscountsInfo.length > 0 ? (
          <ul className="discount-list">
            {chosenDiscountsInfo.map((desc, idx) => (
              <li key={idx}>{desc}</li>
            ))}
          </ul>
        ) : (
          <p>할인 적용 정보 없음</p>
        )}

        <p className="total-amount">
          총 결제 금액: <strong>{totalAmount.toLocaleString()}원</strong>
        </p>
      </div>

      <div className="payment-method-box">
        <h4>결제 수단</h4>
        <label className="radio-label">
          <input type="radio" checked readOnly />
          신용카드
        </label>
      </div>

      <button className="pay-button" onClick={handlePaymentStart}>
        결제하기
      </button>

      {paymentPopupOpen && (
        <PaymentPopup
          popupInfo={popupInfo}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setPaymentPopupOpen(false)}
        />
      )}
    </div>
  );
};

/**
 * 선택 좌석 목록 컴포넌트
 * - 각 좌석: floorName, areaName, seatName, seatGradeId
 * - seatGradeNameMap[ seatGradeId ].name 으로 등급 이름 표시
 */
const TicketInfoList = ({ selectedSeats, seatGradeNameMap }) => {
  if (!selectedSeats || selectedSeats.length === 0) {
    return <p>선택된 좌석이 없습니다.</p>;
  }

  return (
    <table className="ticket-info-table">
      <thead>
        <tr>
          <th>층</th>
          <th>영역</th>
          <th>좌석번호</th>
          <th>등급</th>
        </tr>
      </thead>
      <tbody>
        {selectedSeats.map((seat, idx) => {
          const gradeObj = seatGradeNameMap?.[seat.seatGradeId];
          const gradeName = gradeObj?.name || seat.seatGradeId;
          return (
            <tr key={idx}>
              <td>{seat.floorName}</td>
              <td>{seat.areaName}</td>
              <td>{seat.seatName}</td>
              <td>{gradeName}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

/**
 * 결제 팝업
 */
const PaymentPopup = ({ popupInfo, onConfirm, onCancel }) => {
  const { totalAmount } = popupInfo;
  return (
    <div className="payment-popup-overlay">
      <div className="payment-popup">
        <h3>결제 팝업</h3>
        <p>결제 금액: {totalAmount.toLocaleString()}원</p>
        <button className="popup-confirm" onClick={onConfirm}>
          결제 완료
        </button>
        <button className="popup-cancel" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
