// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { IoTicket } from "react-icons/io5"; // react-icons 설치 후 사용
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-inner">
        {/* 로고 (티켓 아이콘 + '티켓월드') */}
        <div className="logo">
          <Link to="/" className="logo-link">
            <IoTicket size={28} className="ticket-icon" />
            <span className="site-name">티켓월드</span>
          </Link>
        </div>

        {/* 로그인 버튼 */}
        <nav>
          <button className="login-button">로그인</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
