import React from "react";
import { IoCalendarNumber } from "react-icons/io5";
import { BiLogOut, BiSolidDashboard } from "react-icons/bi";
import { MdOutlineWatchLater } from "react-icons/md";
import { AiOutlineSchedule, AiOutlineBarChart } from "react-icons/ai";
import { useNavigate, useLocation } from "react-router-dom";
import icon from "../utils/icon.PNG";
import { toast } from "react-toastify";
import { showAuthToast } from "../utils/authToast";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  function logOut() {
    showAuthToast(toast, "Logged out successfully");
    navigate("/");
  }

  const navItems = [
    { path: "/Home", label: "Workspace", icon: <BiSolidDashboard size={22} color="white" /> },
    { path: "/Home/focus", label: "Focus", icon: <MdOutlineWatchLater size={20} color="white" /> },
    { path: "/Home/timetable", label: "TimeTable", icon: <AiOutlineSchedule size={20} color="white" /> },
    { path: "/Home/calendar", label: "Calendar", icon: <IoCalendarNumber size={20} color="white" /> },
    { path: "/Home/report", label: "Report", icon: <AiOutlineBarChart size={20} color="white" /> },
  ];

  return (
    <nav className="nav-left">
      <button className="awaretime-theme">
        <img src={icon} alt="" />
      </button>
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`nav-icon skull ${
            location.pathname === item.path ||
            (item.path === "/Home" && location.pathname === "/Home/projects")
              ? "active"
              : ""
          }`}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
      <button className="nav-icon skull" onClick={logOut}>
        <BiLogOut size={22} color="white" />
      </button>
    </nav>
  );
};

export default Navbar;
