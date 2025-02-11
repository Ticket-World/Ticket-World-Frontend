import axios from "axios";

const BASE_URL = "http://localhost:8080/api/v1";

export const fetchPerformances = (page = 0, size = 10) => {
  return axios.get(`${BASE_URL}/performance`, {
    params: { page, size },
    headers: {
      Accept: "application/json",
    },
  });
};

export const fetchPerformanceDetail = (performanceId) => {
  return axios.get(`${BASE_URL}/performance/${performanceId}`, {
    headers: {
      Accept: "application/json",
    },
  });
};

export const fetchSeatAreas = (performanceId) => {
  return axios.get(`${BASE_URL}/performance/${performanceId}/seat-areas`, {
    headers: {
      Accept: "application/json",
    },
  });
};

export const fetchReservationState = (roundId, areaId) => {
  // GET /reservation?roundId=xxx&areaId=xxx
  return axios.get(`${BASE_URL}/reservation`, {
    params: { roundId, areaId },
    headers: {
      Accept: "application/json",
    },
  });
};

export const patchTempReservation = (performanceId, userId, ticketIds) => {
  // PATCH /reservation/temp
  return axios.patch(`${BASE_URL}/reservation/temp`, {
    performanceId,
    userId,
    ticketIds,
  });
};

export const fetchSeatGradeDiscounts = (seatGradeIds) => {
  // POST /seat-grade/find-applicable-discounts
  return axios.post(`${BASE_URL}/seat-grade/find-applicable-discounts`, {
    seatGradeIds,
  });
};

export const patchPaymentStart = ({
  reservationId,
  paymentItems,
  paymentMethod,
  userId,
}) => {
  // PATCH /payment/start
  return axios.patch(`${BASE_URL}/payment/start`, {
    reservationId,
    paymentItems,
    paymentMethod,
    userId,
  });
};

export const patchPaymentConfirm = ({ paymentId, userId, reservationId }) => {
  // PATCH /payment/confirm
  return axios.patch(`${BASE_URL}/payment/confirm`, {
    paymentId,
    userId,
    reservationId,
  });
};
