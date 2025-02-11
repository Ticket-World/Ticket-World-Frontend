// src/pages/PaymentPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { patchPaymentStart, patchPaymentConfirm } from "../api/performanceAPI";
import "./PaymentPage.css";

/**
 * PaymentPage
 * state:
 *  - reservationId
 *  - performanceId
 *  - paymentItems: [{ seatGradeId, reservationCount, discountId }, ...]
 *  - totalAmount
 *  - chosenDiscountsInfo
 *  - selectedSeats (좌석 상세)
 *  - seatGradeNameMap
 */
const USER_ID = "11111111-2222-3333-4444-555555555555";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handlePaymentStart = async () => {
    try {
      const resp = await patchPaymentStart({
        reservationId,
        paymentItems,
        paymentMethod: "CREDIT_CARD",
        userId: USER_ID,
      });
      setPopupInfo({
        paymentId: resp.data.paymentId,
        totalAmount: resp.data.totalAmount,
      });
      setPaymentPopupOpen(true);
    } catch (err) {
      alert("결제 시작 오류");
    }
  };

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

      <div className="pay-content">
        {/* 좌석 목록 (BookingPage 스타일) */}
        <div className="pay-box">
          <h3 className="pay-box-title">선택 티켓</h3>
          <TicketList
            selectedSeats={selectedSeats || []}
            seatGradeNameMap={seatGradeNameMap || {}}
          />
        </div>

        {/* 할인 목록 */}
        <div className="pay-box">
          <h3 className="pay-box-title">할인 내역</h3>
          {chosenDiscountsInfo && chosenDiscountsInfo.length > 0 ? (
            <ul className="discount-list">
              {chosenDiscountsInfo.map((desc, idx) => (
                <li key={idx}>{desc}</li>
              ))}
            </ul>
          ) : (
            <p className="no-discount">할인 적용 정보 없음</p>
          )}
        </div>
      </div>

      <div className="pay-summary">
        <p className="pay-amount">
          총 결제 금액: <strong>{totalAmount.toLocaleString()}원</strong>
        </p>
      </div>

      <div className="pay-method-box">
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
 * BookingPage 스타일처럼
 * seatGradeNameMap => color, name
 * selectedSeats => [{ floorName, areaName, seatName, seatGradeId }]
 */
const TicketList = ({ selectedSeats, seatGradeNameMap }) => {
  if (!selectedSeats || selectedSeats.length === 0) {
    return <p>선택된 티켓이 없습니다.</p>;
  }

  return (
    <ul className="ticket-list">
      {selectedSeats.map((seat, idx) => {
        const gradeObj = seatGradeNameMap[seat.seatGradeId] || {};
        const color = gradeObj.color || "#ccc";
        const gradeName = gradeObj.name || seat.seatGradeId;
        const seatText = `${seat.floorName} / ${seat.areaName} / ${seat.seatName}`;

        return (
          <li key={idx} className="ticket-item">
            <div
              className="grade-color-box"
              style={{ backgroundColor: color }}
            />
            <div className="ticket-info">
              <p className="ticket-seat">{seatText}</p>
              <p className="ticket-grade">{gradeName}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/** 결제 팝업 */
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
