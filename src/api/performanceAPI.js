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
