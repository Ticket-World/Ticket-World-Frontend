// src/components/Pagination.jsx
import React from "react";
import "./Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages === 0) return null;

  // 한 번에 보여줄 페이지 개수
  const PAGE_BLOCK_SIZE = 5;

  // 현재 페이지 블록의 시작/끝 구하기
  const blockIndex = Math.floor(currentPage / PAGE_BLOCK_SIZE);
  const startPage = blockIndex * PAGE_BLOCK_SIZE;
  const endPage = Math.min(startPage + PAGE_BLOCK_SIZE - 1, totalPages - 1);

  // 버튼 핸들러
  const goFirst = () => {
    onPageChange(0);
  };
  const goPrevBlock = () => {
    onPageChange(Math.max(startPage - 1, 0));
  };
  const goNextBlock = () => {
    onPageChange(Math.min(endPage + 1, totalPages - 1));
  };
  const goLast = () => {
    onPageChange(totalPages - 1);
  };

  // 페이지 목록
  const pages = [];
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <div className="pagination">
      {/* 맨 처음 */}
      <button
        onClick={goFirst}
        disabled={currentPage === 0}
        className="nav-button"
      >
        &laquo;
      </button>

      {/* 이전 블록 */}
      <button
        onClick={goPrevBlock}
        disabled={startPage === 0}
        className="nav-button"
      >
        &lt;
      </button>

      {/* 페이지 번호들 */}
      {pages.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`page-button ${pageNum === currentPage ? "active" : ""}`}
        >
          {pageNum + 1}
        </button>
      ))}

      {/* 다음 블록 */}
      <button
        onClick={goNextBlock}
        disabled={endPage === totalPages - 1}
        className="nav-button"
      >
        &gt;
      </button>

      {/* 맨 끝 */}
      <button
        onClick={goLast}
        disabled={currentPage === totalPages - 1}
        className="nav-button"
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination;
