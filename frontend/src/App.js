import Toggler from "./components/Toggler";
import Calendar from "./components/Calendar";
import Home from "./components/Home";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Focus from "./components/Focus";
import Workspace from "./components/Workspace";
import Report from "./components/Report";
import ForgotPass from "./components/ForgotPass";
import TimeTable from "./components/TimeTable";
import ResetPass from "./components/ResetPass";
import { useState, useEffect } from "react";

const createDemoWorks = () => {
  const today = new Date();
  const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14);

  return {
    doNow: [
      {
        id: "demo-product-launch",
        name: "Product launch",
        type: "doNow",
        tag: "Priority",
        describe: "Prepare the next release and keep the team aligned.",
        startDate: formatDate(today),
        endDate: formatDate(endDate),
        subWorks: [
          {
            name: "Plan the release",
            startTime: "09:00",
            endTime: "09:45",
            repeatOption: "Hàng ngày",
            customRepeat: {},
          },
          {
            name: "Review progress",
            startTime: "15:00",
            endTime: "15:30",
            repeatOption: "Hàng ngày",
            customRepeat: {},
          },
        ],
      },
    ],
    schedule: [
      {
        id: "demo-learning",
        name: "Skill development",
        type: "schedule",
        tag: "Growth",
        describe: "Create a consistent learning habit.",
        startDate: formatDate(today),
        endDate: formatDate(endDate),
        subWorks: [
          {
            name: "Read and take notes",
            startTime: "19:30",
            endTime: "20:15",
            repeatOption: "Hàng ngày",
            customRepeat: {},
          },
        ],
      },
    ],
    delegate: [],
    drop: [],
  };
};

function App() {
  // Quản lý works và completedWorks
  const [works, setWorks] = useState(() => {
    const savedWorks = localStorage.getItem("works");
    const parsedWorks = savedWorks ? JSON.parse(savedWorks) : null;
    const hasSavedWork =
      parsedWorks &&
      Object.values(parsedWorks).some(
        (workList) => Array.isArray(workList) && workList.length > 0
      );
    return hasSavedWork ? parsedWorks : createDemoWorks();
  });

  const [completedWorks, setCompletedWorks] = useState(() => {
    const savedCompletedWorks = localStorage.getItem("worksdone");
    return savedCompletedWorks ? JSON.parse(savedCompletedWorks) : [];
  });

  const [recycledWorks, setRecycledWorks] = useState(() => {
    const savedRecycledWorks = localStorage.getItem("recycledWorks");
    return savedRecycledWorks ? JSON.parse(savedRecycledWorks) : [];
  });

  const [taskCompletionStatus, setTaskCompletionStatus] = useState(() => {
    const savedTaskCompletionStatus = localStorage.getItem("taskCompletionStatus");
    return savedTaskCompletionStatus ? JSON.parse(savedTaskCompletionStatus) : {};
  });

  useEffect(() => {
    localStorage.setItem("works", JSON.stringify(works));
    localStorage.setItem("worksdone", JSON.stringify(completedWorks));
    localStorage.setItem("recycledWorks", JSON.stringify(recycledWorks));
    localStorage.setItem("taskCompletionStatus", JSON.stringify(taskCompletionStatus));
  }, [works, completedWorks, recycledWorks, taskCompletionStatus]);
  const [tasks] = useState(() => createDemoWorks());

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
        className="aware-toast-container"
        toastClassName="aware-toast"
      />
      <Routes>
        <Route path="/" element={<Toggler toast={toast} />} />
        <Route path="/ForgotPass" element={<ForgotPass toast={toast} />} />
        <Route path="/ResetPass/:id/:token" element={<ResetPass toast={toast} />} />
        <Route path="/Home" element={<Home />}>
          <Route
            path="/Home"
            element={
              <Workspace
                view="board"
                works={works}
                setWorks={setWorks}
                completedWorks={completedWorks}
                setCompletedWorks={setCompletedWorks}
                recycledWorks={recycledWorks}
                setRecycledWorks={setRecycledWorks}
                taskCompletionStatus={taskCompletionStatus}
                setTaskCompletionStatus={setTaskCompletionStatus}
              />
            }
          />
          <Route
            path="/Home/projects"
            element={
              <Workspace
                view="projects"
                works={works}
                setWorks={setWorks}
                completedWorks={completedWorks}
                setCompletedWorks={setCompletedWorks}
                recycledWorks={recycledWorks}
                setRecycledWorks={setRecycledWorks}
                taskCompletionStatus={taskCompletionStatus}
                setTaskCompletionStatus={setTaskCompletionStatus}
              />
            }
          />
          <Route
            path="/Home/focus"
            element={<Focus toast={toast} works={works} tasks={tasks} />}
          />
          <Route
            path="/Home/timetable"
            element={
              <TimeTable
                toast={toast}
                works={works}
                setWorks={setWorks}
                completedWorks={completedWorks}
                setCompletedWorks={setCompletedWorks}
                recycledWorks={recycledWorks}
                setRecycledWorks={setRecycledWorks}
                taskCompletionStatus={taskCompletionStatus}
                setTaskCompletionStatus={setTaskCompletionStatus}
              />
            }
          />
          
          <Route
            path="/Home/calendar"
            element={<Calendar works={Object.values(works)} />}
          />
          
                    <Route
                      path="/Home/report"
                      element={<Report toast={toast} tasks={tasks} />}
                    />
                  </Route>
                </Routes>
              </BrowserRouter>
            );
          }

export default App;
