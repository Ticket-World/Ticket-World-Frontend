// src/pages/DiscountPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchSeatGradeDiscounts } from "../api/performanceAPI";
import "./DiscountPage.css";

const DiscountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * state:
   *  - reservationId
   *  - seatGradeCounts: { gradeId -> number }
   *  - totalSeats
   *  - seatGradeNameMap: { gradeId -> { name, price, color } }
   *  - performanceId
   *  - selectedSeats
   */
  const {
    reservationId,
    seatGradeCounts,
    totalSeats,
    seatGradeNameMap,
    performanceId,
    selectedSeats,
  } = location.state || {};

  const [discountData, setDiscountData] = useState(null);
  const [applyCounts, setApplyCounts] = useState({});

  // 총 결제금액(미리보기)
  const [previewTotal, setPreviewTotal] = useState(0);

  useEffect(() => {
    if (!seatGradeCounts || !seatGradeNameMap) {
      alert("좌석등급 정보가 없습니다.");
      navigate("/");
      return;
    }
    const gradeIds = Object.keys(seatGradeCounts);
    if (gradeIds.length > 0) {
      loadDiscounts(gradeIds);
    }
  }, [seatGradeCounts, seatGradeNameMap]);

  // 할인 목록 API
  const loadDiscounts = async (gradeIds) => {
    try {
      const resp = await fetchSeatGradeDiscounts(gradeIds);
      setDiscountData(resp.data);
    } catch (err) {
      alert("할인 목록 조회 오류");
    }
  };

  // 드롭다운 변경
  const handleCountChange = (gradeId, discountId, newVal) => {
    const next = structuredClone(applyCounts);
    if (!next[gradeId]) {
      next[gradeId] = {};
    }
    next[gradeId][discountId] = newVal;

    const sum = calcAllCount(next);
    if (sum > totalSeats) {
      alert(`할인 적용 수(${sum})가 선택 좌석(${totalSeats}) 초과`);
      return;
    }
    setApplyCounts(next);

    // 미리보기 총액도 다시 계산
    const { totalAmount } = buildPaymentData(next);
    setPreviewTotal(totalAmount);
  };

  // 전체 할인 개수 합
  const calcAllCount = (counts) => {
    let sum = 0;
    Object.values(counts).forEach((m) => {
      Object.values(m).forEach((v) => (sum += v));
    });
    return sum;
  };

  // applyCountType별 드롭다운
  const makeOptions = (type, amount, gradeCount) => {
    const opts = [0];
    switch (type) {
      case "MAX": {
        const limit = Math.min(gradeCount, amount);
        for (let i = 1; i <= limit; i++) {
          opts.push(i);
        }
        break;
      }
      case "MULTIPLE": {
        for (let x = amount; x <= gradeCount; x += amount) {
          opts.push(x);
        }
        break;
      }
      case "INF":
      default: {
        for (let i = 1; i <= gradeCount; i++) {
          opts.push(i);
        }
        break;
      }
    }
    return opts;
  };

  // "할인 적용 완료" 버튼
  const handleConfirm = () => {
    const sum = calcAllCount(applyCounts);
    if (sum !== totalSeats) {
      alert(`할인 적용 수(${sum})가 선택좌석(${totalSeats})와 불일치합니다.`);
      return;
    }
    // 최종 PaymentPage 이동
    const { paymentItems, totalAmount, chosenDiscountsInfo } =
      buildPaymentData(applyCounts);
    navigate("/payment", {
      state: {
        reservationId,
        performanceId,
        paymentItems,
        totalAmount,
        chosenDiscountsInfo,
        selectedSeats,
        seatGradeNameMap,
      },
    });
  };

  /**
   * 실제 결제 금액 계산:
   * 1) 등급별 "일반" + "할인"행
   * 2) "가격" = seatGradeNameMap[gId].price * (1 - rate)
   * 3) applyCounts[gId][disc.id]
   * => total += ...
   */
  const buildPaymentData = (counts) => {
    let total = 0;
    const paymentItems = [];
    const chosenDiscountsInfo = [];

    if (!discountData) {
      return { paymentItems: [], totalAmount: 0, chosenDiscountsInfo: [] };
    }

    discountData.seatGrades.forEach((sg) => {
      const gId = sg.id;
      const gInfo = seatGradeNameMap[gId] || {};
      const basePrice = gInfo.price || 0;
      const gradeName = gInfo.name || gId;

      const combinedDiscounts = [
        { id: "normal", name: "일반", rate: 0, applyCountType: "INF" },
        ...(sg.discounts || []),
      ];

      combinedDiscounts.forEach((disc) => {
        const c = counts[gId]?.[disc.id] || 0;
        if (c > 0) {
          const rate = disc.rate || 0;
          const discName = disc.id === "normal" ? "일반" : disc.name;
          // chosenDiscountsInfo 문구
          chosenDiscountsInfo.push(`${gradeName} ${c}석에 ${discName} 적용`);
          // 가격 = basePrice * (1 - rate)
          const finalPrice = basePrice * (1 - rate);
          total += finalPrice * c;

          paymentItems.push({
            seatGradeId: gId,
            reservationCount: c,
            discountId: disc.id === "normal" ? null : disc.id,
          });
        }
      });
    });
    total = Math.floor(total);
    return { paymentItems, totalAmount: total, chosenDiscountsInfo };
  };

  if (!discountData)
    return <div className="discount-page">할인 목록 조회중...</div>;

  // 미리보기 금액
  const { totalAmount: previewCalc } = buildPaymentData(applyCounts);

  return (
    <div className="discount-page">
      <h2>할인 선택</h2>
      <div className="discount-table-wrapper">
        <table className="discount-table">
          <thead>
            <tr>
              <th>좌석등급</th>
              <th>할인명</th>
              {/* "할인율" 제거 -> user said "할인율 필요없다" */}
              <th>가격</th>
              <th>개수</th>
            </tr>
          </thead>
          <tbody>
            {discountData.seatGrades.map((sg) => {
              const gId = sg.id;
              const gInfo = seatGradeNameMap[gId] || {};
              const basePrice = gInfo.price || 0;
              const gradeName = gInfo.name || gId;
              const gCount = seatGradeCounts[gId] || 0;

              // "일반" + (sg.discounts)
              const rows = [
                { id: "normal", name: "일반", rate: 0 },
                ...(sg.discounts || []),
              ];

              return rows.map((disc, idx) => {
                // price = basePrice * (1 - disc.rate)
                const finalPrice = Math.floor(
                  basePrice * (1 - (disc.rate || 0))
                );
                const val = applyCounts[gId]?.[disc.id] || 0;
                const opts = makeOptions(
                  disc.applyCountType || "INF",
                  disc.applyCountAmount || 1,
                  gCount
                );
                // 첫 행에만 좌석등급
                const showGradeCell = idx === 0;

                return (
                  <tr key={`${gId}-${disc.id}`}>
                    {showGradeCell && (
                      <td rowSpan={rows.length} className="grade-cell">
                        <b>{gradeName}</b>
                        <div className="grade-info">({gCount}석)</div>
                      </td>
                    )}
                    <td>{disc.name}</td>
                    <td>{finalPrice.toLocaleString()}원</td>
                    <td>
                      <select
                        value={val}
                        onChange={(e) =>
                          handleCountChange(
                            gId,
                            disc.id,
                            Number(e.target.value)
                          )
                        }
                      >
                        {opts.map((o) => (
                          <option key={o} value={o}>
                            {o}개
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
      {/* 총 결제 금액 (미리보기) */}
      <div className="discount-summary">
        <p>
          총 결제 금액:{" "}
          <strong className="summary-amount">
            {previewCalc.toLocaleString()}원
          </strong>
        </p>
      </div>

      <div className="discount-actions">
        <button className="confirm-button" onClick={handleConfirm}>
          할인 적용 완료
        </button>
      </div>
    </div>
  );
};

export default DiscountPage;
