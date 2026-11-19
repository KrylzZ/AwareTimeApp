import React, { useEffect, useState } from "react";
import DarkMode from "./DarkMode/Darkmode";
import Notification from "./Notification/Notification";
import { IoMdNotifications } from "react-icons/io";
import axios from "axios";

const Secondary = () => {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [dialog, setDialog] = useState({ isLoading: false });

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/task/getTask`, {
        withCredentials: true,
      })
      .then((res) => {
        const today = new Date().toISOString().split("T")[0];
        setUpcomingTasks(
          res.data.filter((obj) => obj.done === false && obj.task?.deadline === today)
        );
      })
      .catch((error) => {
        console.error("Failed to load today's task notifications.", error);
      });
  }, []);

  function openNotifi() {
    setDialog({ isLoading: true });
  }

  function closeNotifi() {
    setDialog({ isLoading: false });
  }

  return (
    <div className="secondary-actions">
      <DarkMode />
      <button
        className="toolbar-icon-button notification-button"
        onClick={openNotifi}
        aria-label={`Notifications${upcomingTasks.length ? `, ${upcomingTasks.length} new` : ""}`}
      >
        <IoMdNotifications size={21} />
        {upcomingTasks.length > 0 && (
          <span className="notification-count">{upcomingTasks.length}</span>
        )}
      </button>
      {dialog.isLoading && (
        <Notification
          closeNotifi={closeNotifi}
          upcomingTasks={upcomingTasks}
        />
      )}
    </div>
  );
};

export default Secondary;
