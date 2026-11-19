import React, { useEffect, useState } from "react";
import { useRef } from "react";
import { FiX } from "react-icons/fi";

import "./styles/timetable.css";
import "./styles/timetable-workspace.css";

const colors = [
  "#DBEAFE", "#DCFCE7", "#EDE9FE", "#FCE7F3", "#FFEDD5", "#CCFBF1",
  "#E0E7FF", "#FAE8FF", "#FEF3C7", "#CFFAFE", "#E2E8F0", "#D1FAE5",
  "#E0F2FE", "#FCE7F3", "#EDE9FE", "#DBEAFE", "#DCFCE7", "#FFEDD5",
  "#CCFBF1", "#E0E7FF",
];


const assignColorsToTasks = (tasks) => {
  const colorMap = new Map();
  let colorIndex = 0;

  tasks.forEach((day) => {
    day.tasks.forEach((task) => {
      if (!colorMap.has(task.name)) {
        colorMap.set(task.name, colors[colorIndex % colors.length]);
        colorIndex++;
      }
    });
  });

  return colorMap;
};



const getWeekTasks = (works) => {
  const truncateTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const todayDate = truncateTime(new Date());
  console.log("Today's Date:", todayDate.toDateString());

  const currentDay = todayDate.getDay();
  console.log("Current Day:", currentDay);

  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  console.log("Start of Week:", startOfWeek.toDateString());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  console.log("End of Week:", endOfWeek.toDateString());

  const tasksByDay = Array(7)
    .fill(null)
    .map((_, i) => ({
      date: new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000),
      tasks: [],
    }));

  console.log("Initialized Tasks by Day:", tasksByDay);

  Object.values(works).flat().forEach((work) => {
    console.log("Processing work:", work.name);
    const workStartDate = new Date(work.startDate);
    const workEndDate = new Date(work.endDate);

    console.log("Work Start Date:", workStartDate.toDateString());
    console.log("Work End Date:", workEndDate.toDateString());

    work.subWorks.forEach((task) => {
      console.log("Processing task:", task.name);
      const { repeatOption, customRepeat = {}, startTime, endTime } = task;

      const calculateDates = () => {
        let dates = [];
        console.log("Starting date calculation for task:", task.name);

        const taskStartDate = truncateTime(
          customRepeat.startDate ? new Date(customRepeat.startDate) : new Date(workStartDate)
        );
        const endDate = truncateTime(new Date(workEndDate));

        console.log("Task Start Date:", taskStartDate.toDateString());
        console.log("Task End Date:", endDate.toDateString());

        const dayMapping = { T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6, CN: 7 };
        const convertedRepeatDays = (customRepeat.repeatDays || []).map((day) => {
          const mappedValue = dayMapping[day];
          if (mappedValue === undefined) {
            console.error(`Invalid day in repeatDays: ${day}`);
            return null;
          }
          return mappedValue;
        }).filter((day) => day !== null);

        console.log("Converted Repeat Days:", convertedRepeatDays);

        if (repeatOption === "Không lặp lại") {
          const taskDate = truncateTime(new Date(workStartDate));
          console.log("Task Date (Không lặp lại):", taskDate.toDateString());
          if (taskDate >= startOfWeek && taskDate <= endOfWeek) {
            dates.push(taskDate);
          }
        } else if (repeatOption === "Hàng ngày") {
          let currentDate = new Date(taskStartDate);
          console.log("Processing Hàng ngày...");
          while (currentDate <= endDate) {
            console.log("Current Date in Loop (Hàng ngày):", currentDate.toDateString());
            if (currentDate >= startOfWeek && currentDate <= endOfWeek) {
              dates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (repeatOption === "Tùy chỉnh") {
          console.log("Processing Tùy chỉnh...");
          if (customRepeat.repeatUnit === "ngày") {
            let currentDate = new Date(taskStartDate);
            console.log("Processing Tùy chỉnh - Ngày");
            while (currentDate <= endDate) {
              console.log("Current Date in Loop (Tùy chỉnh - Ngày):", currentDate.toDateString());
              if (currentDate >= startOfWeek && currentDate <= endOfWeek) {
                dates.push(new Date(currentDate));
              }
              currentDate.setDate(currentDate.getDate() + customRepeat.repeatEvery);
            }
          } else if (customRepeat.repeatUnit === "tuần") {
            console.log("Processing Tùy chỉnh - Tuần");
            const FirstWeekStart = new Date(taskStartDate);
            FirstWeekStart.setDate(taskStartDate.getDate() - ((taskStartDate.getDay() || 7) - 1));

            const FirstWeekEnd = new Date(FirstWeekStart);
            FirstWeekEnd.setDate(FirstWeekStart.getDate() + 6);

            let weekConsiderStart = new Date(FirstWeekStart);
            let weekConsiderEnd = new Date(FirstWeekEnd);

            while (weekConsiderStart <= endDate) {
              console.log("Processing Week:", {
                weekConsiderStart: weekConsiderStart.toDateString(),
                weekConsiderEnd: weekConsiderEnd.toDateString(),
              });
              if (weekConsiderStart <= endOfWeek && weekConsiderEnd >= startOfWeek) {
                convertedRepeatDays.forEach((dayOfWeek) => {
                  const targetDate = new Date(weekConsiderStart);
                  targetDate.setDate(weekConsiderStart.getDate() + (dayOfWeek - 1));
                  console.log("Target Date Calculated:", targetDate.toDateString());
                  if (
                    targetDate >= startOfWeek &&
                    targetDate <= endOfWeek &&
                    targetDate >= taskStartDate &&
                    targetDate <= endDate
                  ) {
                    dates.push(targetDate);
                    console.log("Added Target Date:", targetDate.toDateString());
                  }
                });
              }
              weekConsiderStart.setDate(weekConsiderStart.getDate() + customRepeat.repeatEvery * 7);
              weekConsiderEnd.setDate(weekConsiderEnd.getDate() + customRepeat.repeatEvery * 7);
            }
          } else if (customRepeat.repeatUnit === "tháng") {
            console.log("Processing Tùy chỉnh - Tháng");
          
            if (customRepeat.repeatMonthOption === "specificDay") {
              let currentDate = new Date(taskStartDate);
              console.log("Task Start Date:", taskStartDate.toDateString());
              while (currentDate <= endDate) {
                const targetDate = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + customRepeat.repeatEvery,
                  taskStartDate.getDate()
                );
                console.log("Processed Target Date (Specific Day):", targetDate.toDateString());
          
                if (targetDate >= startOfWeek && targetDate <= endOfWeek && targetDate <= endDate) {
                  dates.push(targetDate);
                  console.log("Dates Added for Task (Specific Day):", dates);
                }
          
                currentDate.setMonth(currentDate.getMonth() + customRepeat.repeatEvery);
              }
            } else if (customRepeat.repeatMonthOption === "weekdayInMonth") {
              let currentDate = new Date(taskStartDate);
              console.log("Task Start Date:", taskStartDate.toDateString());
              while (currentDate <= endDate) {
                const targetMonth = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + customRepeat.repeatEvery,
                  1
                );
                const targetWeekday = new Date(
                  targetMonth.getFullYear(),
                  targetMonth.getMonth(),
                  1
                );
          
                let weekCount = 0;
                while (targetWeekday.getMonth() === targetMonth.getMonth()) {
                  if (targetWeekday.getDay() === taskStartDate.getDay()) {
                    weekCount++;
                    if (
                      weekCount ===
                      Math.ceil(taskStartDate.getDate() / 7)
                    ) {
                      console.log("Processed Target Date (Weekday in Month):", targetWeekday.toDateString());
                      if (
                        targetWeekday >= startOfWeek &&
                        targetWeekday <= endOfWeek &&
                        targetWeekday <= endDate
                      ) {
                        dates.push(new Date(targetWeekday));
                        console.log("Dates Added for Task (Weekday in Month):", dates);
                      }
                      break;
                    }
                  }
                  targetWeekday.setDate(targetWeekday.getDate() + 1);
                }
          
                currentDate.setMonth(currentDate.getMonth() + customRepeat.repeatEvery);
              }
            }
          }
          else if (customRepeat.repeatUnit === "năm") {
            console.log("Processing Tùy chỉnh - Năm");
          
            let currentDate = new Date(taskStartDate);
            console.log("Task Start Date:", taskStartDate.toDateString());
            console.log("Repeat Every:", customRepeat.repeatEvery, "năm");
          
            while (currentDate <= endDate) {
              const targetDate = new Date(
                currentDate.getFullYear() + customRepeat.repeatEvery,
                currentDate.getMonth(),
                currentDate.getDate()
              );
          
              console.log("Processed Target Date (Yearly):", targetDate.toDateString());
          
              if (
                targetDate >= startOfWeek &&
                targetDate <= endOfWeek &&
                targetDate <= endDate
              ) {
                dates.push(targetDate);
                console.log("Dates Added for Task (Yearly):", dates);
              }
          
              currentDate.setFullYear(currentDate.getFullYear() + customRepeat.repeatEvery);
            }
          }
          
          
        }

        console.log("Final Dates for Task:", dates);
        return dates;
      };

      calculateDates().forEach((date) => {
        console.log("Mapping Task to Date:", date.toDateString());
        const taskDay = tasksByDay.find(
          (day) => day.date.toDateString() === date.toDateString()
        );
        if (taskDay) {
          console.log("Task Added to Day:", taskDay.date.toDateString());
          taskDay.tasks.push({
            name: task.name,
            startTime,
            endTime,
            workName: work.name,
            tickState: true, 
          });
        }
      });
    });
  });

  console.log("Final Tasks by Day:", tasksByDay);
  return tasksByDay;
};
const calculateOverlapGroups = (tasks) => {
  
  const assignedPositions = new Map();

  tasks.forEach((taskA) => {
    const taskAStart = parseInt(taskA.startTime.split(":")[0]) * 60 + parseInt(taskA.startTime.split(":")[1]);
    const taskAEnd = parseInt(taskA.endTime.split(":")[0]) * 60 + parseInt(taskA.endTime.split(":")[1]);

    const overlappingTasks = tasks.filter((taskB) => {
      const taskBStart = parseInt(taskB.startTime.split(":")[0]) * 60 + parseInt(taskB.startTime.split(":")[1]);
      const taskBEnd = parseInt(taskB.endTime.split(":")[0]) * 60 + parseInt(taskB.endTime.split(":")[1]);
      return taskAStart < taskBEnd && taskAEnd > taskBStart;
    });

    if (overlappingTasks.length === 1) {
      // Nếu task không trùng với bất kỳ task nào khác
      assignedPositions.set(taskA, { left: 0, width: 100 });
    } else {
      // Tính toán vị trí và chiều rộng cho task trùng
      let foundPosition = false;
      for (let leftIndex = 0; leftIndex < overlappingTasks.length; leftIndex++) {
        const conflictTasks = overlappingTasks.filter(
          (t) => assignedPositions.get(t)?.left === leftIndex
        );
        if (conflictTasks.length === 0) {
          // Không có xung đột, đặt task ở vị trí này
          assignedPositions.set(taskA, { left: leftIndex, top: taskAStart });
          foundPosition = true;
          break;
        }
      }

      if (!foundPosition) {
        const maxLeft = Math.max(
          ...overlappingTasks.map((t) => assignedPositions.get(t)?.left || 0)
        );
        assignedPositions.set(taskA, { left: maxLeft + 1, top: taskAStart });
      }
    }
  });

  // Cập nhật width và index cho tất cả task
  const maxLeftIndex = Math.max(...Array.from(assignedPositions.values()).map((pos) => pos.left || 0));
  tasks.forEach((task) => {
    const position = assignedPositions.get(task);
    if (position) {
      if (position.width === 100) {
        // Nếu task không trùng
        task.left = position.left;
        task.width = 100;
        task.index = 0;
        task.totalInGroup = 1;
      } else {
        // Nếu task trùng
        task.left = position.left * (100 / (maxLeftIndex + 1));
        task.width = 100 / (maxLeftIndex + 1);
        task.totalInGroup = maxLeftIndex + 1;
        task.index = position.left;
      }
    }
  });

  return tasks;
};

const TimeTable = ({ works }) => {
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`);
  const truncateTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = truncateTime(new Date());
  const currentDay = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekRange = `${startOfWeek.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
  })} – ${endOfWeek.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
  })}`;

  const bodyContainerRef = useRef(null);
  const nowTimeRef = useRef(null);

  const [isTaskListVisible, setIsTaskListVisible] = useState(false);
  const [weekTasks, setWeekTasks] = useState([]);

  useEffect(() => {
    setWeekTasks(getWeekTasks(works));
  }, [works]);

  const [nowTimePosition, setNowTimePosition] = useState({
    column: null,
    top: 0,
  });

  const calculatePosition = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const top = startHour * 60 + startMinute;
    const height = (endHour * 60 + endMinute) - top;
    return { top, height };
  };

  const [taskColors, setTaskColors] = useState(new Map());

  const toggleTaskTick = (dayIndex, taskIndex) => {
    const updatedTasks = [...weekTasks];
    const task = updatedTasks[dayIndex].tasks[taskIndex];
    task.tickState = !task.tickState;
    setWeekTasks(updatedTasks);
  };
  

  useEffect(() => {
  const tasks = getWeekTasks(works);
  setWeekTasks(tasks);

  const colorMap = assignColorsToTasks(tasks);
  setTaskColors(colorMap);
}, [works]);

useEffect(() => {
  const updateNowTime = () => {
    const now = new Date();
    const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // Thứ 2 là 0, CN là 6
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const top = hours * 60 + minutes;
    setNowTimePosition({ column: currentDayIndex, top });
  };

  updateNowTime();
  const intervalId = setInterval(updateNowTime, 60000);

  return () => clearInterval(intervalId);
}, []);

useEffect(() => {
  const scrollToNowTime = () => {
    if (bodyContainerRef.current && nowTimeRef.current) {
      bodyContainerRef.current.scrollTo({
        top: nowTimeRef.current.offsetTop - bodyContainerRef.current.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  };

  scrollToNowTime();

  const idleTimeout = setTimeout(scrollToNowTime, 3 * 60 * 1000);

  return () => clearTimeout(idleTimeout);
}, [nowTimePosition]);

const visibleWeekDays = weekTasks
  .map((day, index) => ({ day, index }))
  .filter(({ day }) => day.tasks.length > 0);
const visibleTaskCount = visibleWeekDays.reduce(
  (count, { day }) => count + day.tasks.length,
  0
);
const emptyWeekDayCount = Math.max(0, weekTasks.length - visibleWeekDays.length);

  return (
    <div className="main-form timetable-page">
      <header className="menu-bar timetable-toolbar">
        <div className="timetable-title-group">
          <p>MY SCHEDULE</p>
          <h1>TimeTable</h1>
        </div>
        <div className="timetable-header-actions">
          <span className="timetable-week-label">Week of {weekRange}</span>
        <button
          className="view-tasklist-btn"
          onClick={() => setIsTaskListVisible(true)}
        >
          View Task List
        </button>
        </div>
      </header>

      {isTaskListVisible && (
        <div className="tasklist-overlay">
          <section
            className="tasklist-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tasklist-title"
          >
            <header className="tasklist-header">
              <div>
                <p>WEEKLY OVERVIEW</p>
                <h2 id="tasklist-title">Tasks this week</h2>
                <span>
                  {visibleTaskCount} {visibleTaskCount === 1 ? "task" : "tasks"} · {weekRange}
                  {emptyWeekDayCount > 0 &&
                    ` · ${emptyWeekDayCount} empty ${emptyWeekDayCount === 1 ? "day" : "days"} hidden`}
                </span>
              </div>
            <button
              className="close-btn"
              onClick={() => setIsTaskListVisible(false)}
              aria-label="Close task list"
            >
              <FiX size={17} aria-hidden="true" />
            </button>
            </header>
            {visibleWeekDays.length > 0 ? (
            <div className="tasklist">
              {visibleWeekDays.map(({ day, index }) => (
                <div key={index} className="day-tasks">
                  <h3>
                    <span>{days[index]}</span>
                    <time dateTime={day.date.toISOString()}>
                      {day.date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </time>
                  </h3>
                  {day.tasks.map((task, taskIndex) => (
                      <div
                        key={`${task.name}-${taskIndex}`}
                        className="task-item-timetable"
                        style={{
                          backgroundColor: taskColors.get(task.name) || "#FFFFFF",
                          color: "#172033",
                        }}
                      >
                        <div className="task-content">
                          <input
                            type="checkbox"
                            checked={task.tickState}
                            onChange={() => toggleTaskTick(index, taskIndex)}
                          />
                          <p>
                            <strong>{task.name}</strong>
                            <span>{task.workName}</span>
                            <time>{task.startTime} – {task.endTime}</time>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
            ) : (
              <div className="tasklist-empty">
                <strong>No tasks scheduled this week</strong>
                <span>Add a task to a work item to see it here.</span>
              </div>
            )}
          </section>
        </div>
      )}

        <div className="timetable-container">
        <div className="header-row">
          <div className="header-cell time-column">Thời gian</div>
          {days.map((day, index) => {
  const currentDayDate = new Date(startOfWeek);
  currentDayDate.setDate(startOfWeek.getDate() + index);
  const formattedDate = `${currentDayDate.getDate()}/${currentDayDate.getMonth() + 1}`;
  const isToday = currentDayDate.toDateString() === today.toDateString();

  return (
    <div
      key={index}
      className={`header-cell ${isToday ? "today-highlight" : ""}`}
      style={{ height: "60px" }}
    >
      {day}
      <br />
      <span className="date-text">{formattedDate}</span>
    </div>
  );
})}

        </div>

            
        <div className="body-container" ref={bodyContainerRef}>
            <div className="column time-column">
              {hours.map((hour, hourIndex) => (
                <div key={hourIndex} className="time-slot">
                  {hour}
                  <div className="atomic-slots">
                    {[...Array(4)].map((_, atomicIndex) => (
                      <div key={atomicIndex} className="atomic-slot"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
                    
            {weekTasks.map((day, dayIndex) => (
              <div key={dayIndex} className="column" style={{ position: "relative" }}>
                {hours.map((hour, hourIndex) => (
                  <div key={hourIndex} className="time-slot">
                    <div className="atomic-slots">
                      {[...Array(4)].map((_, atomicIndex) => (
                        <div key={atomicIndex} className="atomic-slot"></div>
                      ))}
                    </div>
                  </div>
                ))}

                  {calculateOverlapGroups(day.tasks.filter((task) => task.tickState)).map((task, taskIndex) => {
                  const { top, height } = calculatePosition(task.startTime, task.endTime);
                  return (
                    <div
                      key={taskIndex}
                      className="task-block-timetable"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${task.left}%`,
                        width: `calc(${task.width}% - 6px)`,
                        backgroundColor: taskColors.get(task.name) || "#FFFFFF",
                        color: "#172033",
                        position: "absolute",
                      }}
                    >
                      <span>{task.name}</span>
                      <span style={{ display: "block", fontSize: "0.8em" }}>
                        {task.startTime} - {task.endTime}
                      </span>
                    </div>
                  );
                })}

                {nowTimePosition.column === dayIndex && (
              <div
                ref={nowTimeRef}
                className="now-time"
                style={{
                  top: `${nowTimePosition.top - 1}px`,
                }}
              >
                <div className="now-time-marker"></div>
              </div>
                )}


                  </div>
                ))}

                          </div>
                        </div>
                         
                    </div>
                  );
                };

export default TimeTable;
