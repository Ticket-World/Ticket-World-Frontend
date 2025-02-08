// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchPerformances } from "../api/performanceAPI";
import PerformanceCard from "../components/PerformanceCard";
import Pagination from "../components/Pagination";
import "./HomePage.css";

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [performances, setPerformances] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 쿼리스트링에서 page 가져오기
  const queryParams = new URLSearchParams(location.search);
  const pageParam = parseInt(queryParams.get("page") || "0", 10);

  const size = 10; // 한 페이지당 10개

  const fetchData = async (page) => {
    setLoading(true);
    try {
      const response = await fetchPerformances(page, size);
      setPerformances(response.data.performances);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  // pageParam 바뀔 때마다 API 호출
  useEffect(() => {
    fetchData(pageParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam]);

  // 페이지 전환
  const handlePageChange = (newPage) => {
    navigate(`/?page=${newPage}`);
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;

  return (
    <div className="home-page">
      <h1>공연 목록</h1>

      <div className="performance-list">
        {performances.map((perf) => (
          <PerformanceCard key={perf.id} performance={perf} />
        ))}
      </div>

      <div className="pagination-container">
        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default HomePage;
