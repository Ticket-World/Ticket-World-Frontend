// src/pages/DiscountPage/index.jsx

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
   *  - seatGradeCounts
   *  - totalSeats
   *  - seatGradeNameMap: { gradeId: {name, price} }
   *  - performanceId
   *  - selectedSeats: [{ seatPositionId, ticketId, seatGradeId, floorName, areaName, seatName }, ...]
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

  const loadDiscounts = async (gradeIds) => {
    try {
      const resp = await fetchSeatGradeDiscounts(gradeIds);
      setDiscountData(resp.data);
    } catch (err) {
      alert("할인 목록 조회 오류");
    }
  };

  const handleCountChange = (gradeId, discountId, newVal) => {
    const next = JSON.parse(JSON.stringify(applyCounts));
    if (!next[gradeId]) {
      next[gradeId] = {};
    }
    next[gradeId][discountId] = newVal;
    const sum = calcAll(next);
    if (sum > totalSeats) {
      alert(`할인 적용 수(${sum})가 선택 좌석(${totalSeats})을 초과`);
      return;
    }
    setApplyCounts(next);
  };

  const calcAll = (counts) => {
    let sum = 0;
    Object.values(counts).forEach((m) => {
      Object.values(m).forEach((v) => (sum += v));
    });
    return sum;
  };

  const makeOptions = (type, amount, gCount) => {
    const opts = [0];
    switch (type) {
      case "MAX": {
        const limit = Math.min(amount, gCount);
        for (let i = 1; i <= limit; i++) opts.push(i);
        break;
      }
      case "MULTIPLE": {
        for (let x = amount; x <= gCount; x += amount) opts.push(x);
        break;
      }
      case "INF":
      default:
        for (let i = 1; i <= gCount; i++) opts.push(i);
        break;
    }
    return opts;
  };

  const handleConfirm = () => {
    const sum = calcAll(applyCounts);
    if (sum !== totalSeats) {
      alert(`할인 적용 수(${sum})가 선택좌석(${totalSeats})과 불일치`);
      return;
    }
    const { paymentItems, totalAmount, chosenDiscountsInfo } =
      buildPaymentData();
    navigate("/payment", {
      state: {
        reservationId,
        performanceId,
        paymentItems,
        totalAmount,
        chosenDiscountsInfo,
        selectedSeats, // 좌석 상세정보도 함께 전달
        seatGradeNameMap,
      },
    });
  };

  const buildPaymentData = () => {
    let total = 0;
    const paymentItems = [];
    const chosenDiscountsInfo = [];

    discountData.seatGrades.forEach((sg) => {
      const gId = sg.id;
      const info = seatGradeNameMap[gId] || {};
      const price = info.price || 0;
      const gName = info.name || gId;
      const combined = [
        { id: "normal", name: "일반", rate: 0, applyCountType: "INF" },
        ...(sg.discounts || []),
      ];
      combined.forEach((disc) => {
        const c = applyCounts[gId]?.[disc.id] || 0;
        if (c > 0) {
          const rate = disc.rate || 0;
          const discName = disc.id === "normal" ? "일반" : disc.name;
          const discPercent = (rate * 100).toFixed(0);
          chosenDiscountsInfo.push(
            `${gName} ${c}석에 ${discName}(${discPercent}%) 적용`
          );
          const finalPrice = price * (1 - rate);
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

  if (!discountData) return <div>할인 목록 조회중...</div>;

  return (
    <div className="discount-page">
      <h2>할인 선택 페이지</h2>

      <table className="discount-table">
        <thead>
          <tr>
            <th>좌석등급</th>
            <th>할인명</th>
            <th>할인율(%)</th>
            <th>할인된 가격</th>
            <th>개수</th>
          </tr>
        </thead>
        <tbody>
          {discountData.seatGrades.map((sg) => {
            const gId = sg.id;
            const info = seatGradeNameMap[gId] || {};
            const price = info.price || 0;
            const gName = info.name || gId;
            const gCount = seatGradeCounts[gId] || 0;
            const normalRow = { id: "normal", name: "일반", rate: 0 };
            const rows = [normalRow, ...(sg.discounts || [])];
            return rows.map((disc, idx) => {
              const percent = (disc.rate * 100).toFixed(0);
              const discountPrice = Math.floor(price * (1 - (disc.rate || 0)));
              const val = applyCounts[gId]?.[disc.id] || 0;
              const opts = makeOptions(
                disc.applyCountType || "INF",
                disc.applyCountAmount || 1,
                gCount
              );
              const showLabel = idx === 0;
              return (
                <tr key={`${gId}-${disc.id}`}>
                  {showLabel && (
                    <td rowSpan={rows.length} className="grade-cell">
                      <b>{gName}</b>
                      <div className="grade-info">
                        (개수:{gCount})<br />
                        원가:{price.toLocaleString()}원
                      </div>
                    </td>
                  )}
                  <td>{disc.name}</td>
                  <td>{percent}</td>
                  <td>{discountPrice.toLocaleString()}원</td>
                  <td>
                    <select
                      value={val}
                      onChange={(e) =>
                        handleCountChange(gId, disc.id, Number(e.target.value))
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

      <div className="discount-actions">
        <button onClick={handleConfirm}>할인 적용 완료</button>
      </div>
    </div>
  );
};

export default DiscountPage;
