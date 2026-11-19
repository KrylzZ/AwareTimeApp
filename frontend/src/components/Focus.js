import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { FiPlus, FiRepeat, FiTrash2, FiX } from "react-icons/fi";
import {
  clearResumableTimeSession,
  createTimeSessionId,
  getResumableTimeSession,
  persistTimeSession,
  setResumableTimeSession,
} from "../utils/timeSessions";
import "./styles/focus.css";
import "./styles/focus-workspace.css";

const TIMER_DURATIONS = {
  pomodoro: 1500,
  "short-break": 300,
  "long-break": 900,
};

const Focus = ({ works = {}, toast }) => {
  const [restoredSession] = useState(getResumableTimeSession);
  const restoredDuration = Math.max(0, Math.floor(restoredSession?.durationSeconds || 0));
  const restoredActivity = restoredSession?.activity;
  const availableWorks = useMemo(() => Object.values(works).flat(), [works]);
  const restoredWork = restoredActivity?.workId
    ? availableWorks.find((work) => work.id === restoredActivity.workId)
    : availableWorks.find((work) => work.name === restoredActivity?.workName);
  const restoredTask = restoredWork?.subWorks?.find(
    (task) => task.name === restoredActivity?.taskName
  );
  const restoredTimerMode = [
    "pomodoro",
    "short-break",
    "long-break",
    "stopwatch",
  ].includes(restoredSession?.timerMode)
    ? restoredSession.timerMode
    : "pomodoro";
  const restoredTaskMode =
    ["auto", "manual", "free"].includes(restoredSession?.taskMode)
      ? restoredSession.taskMode
      : restoredTimerMode === "stopwatch"
        ? "free"
        : "auto";

  const [mode, setMode] = useState(restoredTaskMode);
  const [selectedWork, setSelectedWork] = useState(restoredWork || null);
  const [selectedTask, setSelectedTask] = useState(restoredTask || null);
  const [currentTaskManual, setCurrentTaskManual] = useState(() => {
    if (restoredTaskMode !== "manual" || !restoredTask || !restoredWork) return null;
    return {
      ...restoredTask,
      workName: restoredWork.name,
      workStartDate: restoredWork.startDate,
      workEndDate: restoredWork.endDate,
      startTime: new Date(`1970-01-01T${restoredTask.startTime}:00`),
      endTime: new Date(`1970-01-01T${restoredTask.endTime}:00`),
    };
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempWork, setTempWork] = useState(null);
  const [tempTask, setTempTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(
      0,
      (TIMER_DURATIONS[restoredTimerMode] || 1500) - restoredDuration
    );
  });
  const [isRunning, setIsRunning] = useState(false);
  const [tasksForToday, setTasksForToday] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const timelineRef = useRef(null);
  const [selectedTaskName, setSelectedTaskName] = useState(
    restoredActivity?.taskName || null
  );
  const [noteContent, setNoteContent] = useState("");
  const [isFreeMode, setIsFreeMode] = useState(restoredTimerMode === "stopwatch");
  const [freeModeTime, setFreeModeTime] = useState(
    restoredTimerMode === "stopwatch" ? restoredDuration : 0
  );
  const [currentMode, setCurrentMode] = useState(
    restoredTimerMode === "stopwatch" ? "pomodoro" : restoredTimerMode
  );
  const [countdownTimeTask, setCountdownTimeTask] = useState(0);
  const [isTaskSelected, setIsTaskSelected] = useState(
    restoredActivity?.type === "task" && Boolean(restoredActivity.taskName)
  );
  const [todayDataTimeCount, setTodayDataTimeCount] = useState([]);
  const [isTodayDataVisible, setIsTodayDataVisible] = useState(false);
  const intervalRef = useRef(null);
  const [viewMode, setViewMode] = useState("byTime");
  const [isAutoSelectEnabled, setIsAutoSelectEnabled] = useState(false);
  const [selectedTasksManual, setSelectedTasksManual] = useState([]);

  const [currentRecord, setCurrentRecord] = useState(() =>
    restoredActivity?.type === "record"
      ? { name: restoredActivity.name, time: restoredDuration }
      : null
  );
  const [records, setRecords] = useState(() =>
    restoredActivity?.type === "record"
      ? [{ name: restoredActivity.name, time: restoredDuration }]
      : []
  );
  const [recordCounter, setRecordCounter] = useState(0);

  const [recordNameInput, setRecordNameInput] = useState("");

  // Timer state - lưu timestamp bắt đầu
  const sessionStartRef = useRef(null);
  const elapsedRef = useRef(restoredDuration);
  const activeTimeSessionRef = useRef(restoredSession);
  const lastPersistedDurationRef = useRef(restoredDuration);
  const persistenceErrorShownRef = useRef(false);

  const getElapsedSeconds = useCallback(() => {
    if (!sessionStartRef.current) return elapsedRef.current;
    return elapsedRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
  }, []);

  const getCurrentActivity = useCallback(() => {
    if (currentRecord) {
      return {
        type: "record",
        name: currentRecord.name,
        workId: null,
        workName: null,
        taskName: null,
      };
    }

    const taskName =
      mode === "manual"
        ? currentTaskManual?.name
        : selectedTaskName || selectedTask?.name;
    if (!taskName) return null;

    const work =
      selectedWork ||
      availableWorks.find(
        (item) =>
          item.subWorks?.some((task) => task.name === taskName)
      );
    const workName = selectedWork?.name || currentTaskManual?.workName || work?.name || null;

    return {
      type: "task",
      name: taskName,
      workId: work?.id || null,
      workName,
      taskName,
    };
  }, [
    availableWorks,
    currentRecord,
    currentTaskManual,
    mode,
    selectedTask,
    selectedTaskName,
    selectedWork,
  ]);

  const persistSessionSafely = useCallback(
    (session) => {
      try {
        persistTimeSession(session);
        persistenceErrorShownRef.current = false;
      } catch (error) {
        console.error("Failed to save a focus session in browser storage.", error);
        if (!persistenceErrorShownRef.current) {
          toast?.error?.("Không thể lưu phiên tập trung trên trình duyệt này.");
          persistenceErrorShownRef.current = true;
        }
      }
    },
    [toast]
  );

  const closeCurrentTimeSession = useCallback(
    (status = "paused") => {
      const session = activeTimeSessionRef.current;
      if (
        !session ||
        session.status === "completed" ||
        (session.status === "paused" && status === "paused")
      ) {
        return;
      }

      const durationSeconds = Math.max(
        session.durationSeconds || 0,
        getElapsedSeconds()
      );
      const endedAt = new Date().toISOString();
      const segments = Array.isArray(session.segments) ? session.segments : [];
      const lastSegmentIndex = segments.length - 1;
      const previousDuration = segments
        .slice(0, lastSegmentIndex)
        .reduce((total, segment) => total + (segment.durationSeconds || 0), 0);
      const updatedSession = {
        ...session,
        status,
        durationSeconds,
        endedAt,
        updatedAt: endedAt,
        segments: segments.map((segment, index) =>
          index === lastSegmentIndex && !segment.endedAt
            ? {
                ...segment,
                endedAt,
                durationSeconds: Math.max(0, durationSeconds - previousDuration),
              }
            : segment
        ),
      };

      activeTimeSessionRef.current = updatedSession;
      lastPersistedDurationRef.current = durationSeconds;
      persistSessionSafely(updatedSession);

      if (status === "completed") {
        clearResumableTimeSession();
      } else {
        setResumableTimeSession(updatedSession.id);
      }
    },
    [getElapsedSeconds, persistSessionSafely]
  );

  const updateRunningTimeSession = useCallback(
    (durationSeconds) => {
      const session = activeTimeSessionRef.current;
      if (
        !session ||
        session.status !== "running" ||
        durationSeconds === lastPersistedDurationRef.current
      ) {
        return;
      }

      const updatedAt = new Date().toISOString();
      const segments = Array.isArray(session.segments) ? session.segments : [];
      const lastSegmentIndex = segments.length - 1;
      const previousDuration = segments
        .slice(0, lastSegmentIndex)
        .reduce((total, segment) => total + (segment.durationSeconds || 0), 0);
      const updatedSession = {
        ...session,
        durationSeconds,
        updatedAt,
        segments: segments.map((segment, index) =>
          index === lastSegmentIndex
            ? {
                ...segment,
                durationSeconds: Math.max(0, durationSeconds - previousDuration),
              }
            : segment
        ),
      };

      activeTimeSessionRef.current = updatedSession;
      lastPersistedDurationRef.current = durationSeconds;
      persistSessionSafely(updatedSession);
    },
    [persistSessionSafely]
  );

  const startOrResumeTimeSession = useCallback(() => {
    const activity = getCurrentActivity();
    if (!activity) return;

    const timerMode = isFreeMode ? "stopwatch" : currentMode;
    const currentSession = activeTimeSessionRef.current;
    const isSameActivity =
      currentSession &&
      currentSession.activity?.type === activity.type &&
      currentSession.activity?.name === activity.name &&
      currentSession.activity?.workId === activity.workId &&
      currentSession.taskMode === mode &&
      currentSession.timerMode === timerMode;

    if (isSameActivity && currentSession.status === "running") return;

    if (isSameActivity && currentSession.status === "paused") {
      const startedAt = new Date().toISOString();
      const resumedSession = {
        ...currentSession,
        status: "running",
        endedAt: null,
        updatedAt: startedAt,
        segments: [
          ...(currentSession.segments || []),
          { startedAt, endedAt: null, durationSeconds: 0 },
        ],
      };
      activeTimeSessionRef.current = resumedSession;
      sessionStartRef.current = Date.now();
      lastPersistedDurationRef.current = resumedSession.durationSeconds;
      setResumableTimeSession(resumedSession.id);
      persistSessionSafely(resumedSession);
      return;
    }

    if (currentSession) closeCurrentTimeSession("completed");

    const startedAt = new Date().toISOString();
    const session = {
      id: createTimeSessionId(),
      schemaVersion: 1,
      source: "focus-timer",
      activity,
      taskMode: mode,
      timerMode,
      status: "running",
      startedAt,
      endedAt: null,
      durationSeconds: 0,
      createdAt: startedAt,
      updatedAt: startedAt,
      segments: [{ startedAt, endedAt: null, durationSeconds: 0 }],
    };

    activeTimeSessionRef.current = session;
    elapsedRef.current = 0;
    sessionStartRef.current = Date.now();
    lastPersistedDurationRef.current = 0;
    if (timerMode === "stopwatch") {
      setFreeModeTime(0);
    } else {
      setTimeLeft(TIMER_DURATIONS[timerMode] || TIMER_DURATIONS.pomodoro);
    }
    setResumableTimeSession(session.id);
    persistSessionSafely(session);
  }, [
    closeCurrentTimeSession,
    currentMode,
    getCurrentActivity,
    isFreeMode,
    mode,
    persistSessionSafely,
  ]);

  const totalFreeTime = useMemo(() => {
    return records.reduce((total, record) => total + record.time, 0);
  }, [records]);

  const toggleFreeMode = () => {
    closeCurrentTimeSession("completed");
    if (isFreeMode) {
      // Chuyển về chế độ Pomodoro
      setIsFreeMode(false);
      setFreeModeTime(0);
      elapsedRef.current = 0;
      sessionStartRef.current = null;
      setTimeLeft(1500);
      setMode("auto"); // Set lại mode
    } else {
      // Chuyển sang chế độ tự do
      setIsFreeMode(true);
      setFreeModeTime(0);
      setIsRunning(false);
      elapsedRef.current = 0;
      sessionStartRef.current = null;
      setMode("free"); // Set mode thành free
    }
  };

  useEffect(() => {
    if (timeLeft !== 0) return;
    closeCurrentTimeSession("completed");

    if (currentMode === "pomodoro") {
      setPomodoroCount((prevCount) => {
        const newCount = prevCount + 1;
        const nextMode = newCount % 4 === 0 ? "long-break" : "short-break";
        elapsedRef.current = 0;
        sessionStartRef.current = null;
        setCurrentMode(nextMode);
        setTimeLeft(nextMode === "long-break" ? 900 : 300);
        return newCount;
      });
    } else {
      elapsedRef.current = 0;
      sessionStartRef.current = null;
      setCurrentMode("pomodoro");
      setTimeLeft(1500);
    }
  }, [timeLeft, currentMode, closeCurrentTimeSession]);


// Quản lý tất cả timers - dùng setInterval 1000ms, chạy ngầm khi tab ẩn
useEffect(() => {
  if (!isRunning) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }

  // Set start time khi bắt đầu session
  if (!sessionStartRef.current) {
    sessionStartRef.current = Date.now();
  }

  // Timer chạy mỗi 1000ms, nhưng tính elapsed từ thực tế
  intervalRef.current = setInterval(() => {
    const now = Date.now();
    const elapsedSeconds =
      elapsedRef.current + Math.floor((now - sessionStartRef.current) / 1000);
    updateRunningTimeSession(elapsedSeconds);

    // Cách này đảm bảo khi quay lại tab, display sẽ hiển thị thời gian chính xác

    if (!isFreeMode) {
      const duration = TIMER_DURATIONS[currentMode] || TIMER_DURATIONS.pomodoro;
      setTimeLeft(Math.max(0, duration - elapsedSeconds));
    }

    // Update task real-time count (Auto mode)
    if (isTaskSelected && selectedTaskName && currentMode === "pomodoro") {
      setTodayDataTimeCount((prev) =>
        prev.map((task) => {
          if (task.name === selectedTaskName) {
            const updatedRealTime = elapsedSeconds;
            const percentCompleted = Math.floor(
              (updatedRealTime / task.totalTimeSlotInSeconds) * 100
            );
            return {
              ...task,
              realTimeTaskCount: updatedRealTime,
              status: `${percentCompleted}%`,
            };
          }
          return task;
        })
      );
    }

    // Update manual task real-time count (Manual mode)
    if (mode === "manual" && currentTaskManual) {
      setSelectedTasksManual((prev) => {
        const existingTask = prev.find((task) => task.name === currentTaskManual.name);
        if (existingTask) {
          return prev.map((task) =>
            task.name === currentTaskManual.name
              ? { ...task, time: elapsedSeconds }
              : task
          );
        } else {
          return [
            ...prev,
            {
              name: currentTaskManual.name,
              time: elapsedSeconds,
            },
          ];
        }
      });
    }

    // Update countdown timer
    if (isTaskSelected && currentMode === "pomodoro") {
      setCountdownTimeTask((prev) => {
        // Calculate từ elapsed time
        const initialCountdown = taskTimeSlotToSeconds(
          calculateTimeSlot(
            tasksForToday.find((t) => t.name === selectedTaskName)?.startTime || new Date(),
            tasksForToday.find((t) => t.name === selectedTaskName)?.endTime || new Date()
          )
        );
        const remaining = Math.max(0, initialCountdown - elapsedSeconds);
        return remaining;
      });
    }

    // Update Free mode time & records
    if (isFreeMode && currentRecord) {
      setFreeModeTime(elapsedSeconds);
      setRecords((prev) =>
        prev.map((record) =>
          record.name === currentRecord.name
            ? { ...record, time: elapsedSeconds }
            : record
        )
      );
    }

    // Update records time during pomodoro
    if (currentRecord && !isFreeMode) {
      setRecords((prev) =>
        prev.map((record) =>
          record.name === currentRecord.name
            ? { ...record, time: elapsedSeconds }
            : record
        )
      );
    }
  }, 250);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [isRunning, selectedTaskName, currentMode, isTaskSelected, mode, currentTaskManual, isFreeMode, currentRecord, tasksForToday, updateRunningTimeSession]);

useEffect(() => {
  if (isRunning) {
    startOrResumeTimeSession();
  } else {
    closeCurrentTimeSession("paused");
  }
}, [isRunning, startOrResumeTimeSession, closeCurrentTimeSession]);

useEffect(() => {
  const handlePageHide = () => closeCurrentTimeSession("paused");
  window.addEventListener("pagehide", handlePageHide);

  return () => {
    window.removeEventListener("pagehide", handlePageHide);
    closeCurrentTimeSession("paused");
  };
}, [closeCurrentTimeSession]);



const totalRealTime = useMemo(() => {
  return todayDataTimeCount.reduce((total, task) => total + task.realTimeTaskCount, 0);
}, [todayDataTimeCount]);

const completedTaskCount = useMemo(() => {
  return todayDataTimeCount.filter((task) => parseInt(task.status.replace('%', ''), 10) >= 100).length;
}, [todayDataTimeCount]);

const totalTasks = todayDataTimeCount.length;

const handleStartPause = () => {
  if (isRunning) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    elapsedRef.current = getElapsedSeconds();
    sessionStartRef.current = null;
    setIsRunning(false);
  } else {
    if (!isTaskSelected && !currentRecord) {
      toast.error("Please choose a task or record");
      return;
    }

    setIsRunning(true);
  }
};

  useEffect(() => {
    setTodayDataTimeCount(
      tasksForToday.map((task) => {
        const taskTimeSlot = calculateTimeSlot(task.startTime, task.endTime);
        const [hours, minutes] = taskTimeSlot.split(":").map(Number);
        const totalTimeSlotInSeconds = hours * 3600 + minutes * 60;

        return {
          name: task.name,
          date: new Date().toDateString(),
          realTimeTaskCount: 0,
          timeSlot: `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:00`,
          totalTimeSlotInSeconds,
          status: "0%",
        };
      })
    );
  }, [tasksForToday]);


  const [, setPomodoroCount] = useState(0);
  const handleSkip = () => {
    closeCurrentTimeSession("completed");
    elapsedRef.current = 0;
    sessionStartRef.current = null;
    if (currentMode === "pomodoro") {
      setPomodoroCount((prevCount) => {
        const newCount = prevCount + 1;
        if (newCount % 4 === 0) {
          // Sau 3 lần nghỉ ngắn, nghỉ dài
          setCurrentMode("long-break");
          setTimeLeft(900); // Long Break - 15 phút
        } else {
          setCurrentMode("short-break");
          setTimeLeft(300); // Short Break - 5 phút
        }
        return newCount;
      });
    } else if (currentMode === "short-break" || currentMode === "long-break") {
      setCurrentMode("pomodoro");
      setTimeLeft(1500); // Pomodoro - 25 phút
    }
  };


  // THỜI GIAN CHO COUNTDOWN TIME - removed (handled in unified timer)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const handleSelectTaskBlock = (taskName) => {
    if (mode !== "auto") {
      toast.error("This feature is only available in Auto mode.");
      return;
    }
    // Nếu AutoSelect đang bật và người dùng thao tác chọn task, tắt AutoSelect
    if (isAutoSelectEnabled) {
      setIsAutoSelectEnabled(false);
    }

    if (selectedTaskName === taskName) {
      closeCurrentTimeSession("completed");
      if (isRunning) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      elapsedRef.current = 0;
      sessionStartRef.current = null;
      setTimeLeft(TIMER_DURATIONS[currentMode] || TIMER_DURATIONS.pomodoro);
      setSelectedTaskName(null);
      setIsTaskSelected(false);
      setCountdownTimeTask(0);
      setIsRunning(false);
      return;
    }

    // Chuyển sang task mới
    closeCurrentTimeSession("completed");
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    sessionStartRef.current = null;
    setTimeLeft(TIMER_DURATIONS[currentMode] || TIMER_DURATIONS.pomodoro);
    setIsRunning(false);
    const selectedTask = tasksForToday.find((task) => task.name === taskName);
    setSelectedTaskName(taskName);


    if (selectedTask) {
      const taskTimeSlotInSeconds = taskTimeSlotToSeconds(
        calculateTimeSlot(selectedTask.startTime, selectedTask.endTime)
      );
      const taskData = todayDataTimeCount.find((task) => task.name === taskName);
      const taskWorkedTime = taskData ? taskData.realTimeTaskCount : 0;

      const remainingTime = Math.max(taskTimeSlotInSeconds - taskWorkedTime, 0);
      setCountdownTimeTask(remainingTime);
      setIsTaskSelected(true);
    } else {
      setCountdownTimeTask(0);
      setIsTaskSelected(false);
    }
  };

  const handleSelectRecord = (recordName) => {
    closeCurrentTimeSession("completed");
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    sessionStartRef.current = null;
    setFreeModeTime(0);
    setTimeLeft(TIMER_DURATIONS[currentMode] || TIMER_DURATIONS.pomodoro);
    setIsRunning(false);
    if (currentRecord?.name === recordName) {
      setCurrentRecord(null);
    } else {
      const selectedRecord = records.find((record) => record.name === recordName);
      if (selectedRecord) {
        setCurrentRecord(selectedRecord); // Chọn record mới
      }
    }
  };

  const handleDeleteRecord = (recordName) => {
    if (currentRecord?.name === recordName) {
      closeCurrentTimeSession("completed");
      setCurrentRecord(null);
      setIsRunning(false);
      elapsedRef.current = 0;
      sessionStartRef.current = null;
    }
    setRecords((prev) => prev.filter((record) => record.name !== recordName));
  };


  //Mode Free - create new record
  const handleCreateRecord = () => {
    closeCurrentTimeSession("completed");
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    sessionStartRef.current = null;
    setIsRunning(false);
    const newName =
      recordNameInput.trim() || `Unknow Record ${recordCounter + 1}`;
    const newRecord = {
      name: newName,
      time: 0,
    };
    setRecords([...records, newRecord]);
    setCurrentRecord(newRecord);
    setRecordNameInput("");
    setRecordCounter((prev) => prev + 1);
  };

  // Note: Freemode timer is handled in the unified timer useEffect above




  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (currentMode === "short-break" || currentMode === "long-break") {
      setIsRunning(false);
    }
  }, [currentMode]);


  // Tự động cuộn đến current-time-line khi mở trang
  useEffect(() => {
    if (timelineRef.current) {
      const currentTimePosition = currentTime.getHours() * 60 + currentTime.getMinutes();
      timelineRef.current.scrollTo({
        top: currentTimePosition - 50,
        behavior: "smooth",
      });
    }
  }, [currentTime]);

  // Calculate tasks for today
  const calculateTasksForToday = useCallback(() => {
    const today = new Date();
    const tasks = [];

    Object.values(works).flat().forEach((work) => {
      const workStartDate = new Date(work.startDate);
      const workEndDate = new Date(work.endDate);

      work.subWorks.forEach((task) => {
        const { startTime, endTime, repeatOption, customRepeat = {} } = task;
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        let validDates = [];
        if (repeatOption === "Không lặp lại") {
          validDates = [workStartDate];
        } else if (repeatOption === "Hàng ngày") {
          let currentDate = new Date(workStartDate);
          while (currentDate <= workEndDate) {
            validDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else if (repeatOption === "Tùy chỉnh") {
          const { repeatEvery = 1, repeatUnit = "ngày", startDate, repeatDays = [] } = customRepeat;
          const taskStartDate = startDate ? new Date(startDate) : workStartDate;
          let currentDate = new Date(taskStartDate);

          if (repeatUnit === "ngày") {
            while (currentDate <= workEndDate) {
              validDates.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + repeatEvery);
            }
          } else if (repeatUnit === "tuần") {
            const dayMapping = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
            while (currentDate <= workEndDate) {
              const dayOfWeek = dayMapping[currentDate.getDay()];
              if (repeatDays.includes(dayOfWeek)) {
                validDates.push(new Date(currentDate));
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        }

        validDates.forEach((date) => {
          if (date.toDateString() === today.toDateString()) {
            tasks.push({
              ...task,
              workName: work.name,
              startTime: new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                startHour,
                startMinute
              ),
              endTime: new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                endHour,
                endMinute
              ),
            });
          }
        });
      });
    });

    const sortedTasks = tasks.sort((a, b) => a.startTime - b.startTime);
    setTasksForToday(sortedTasks);
  }, [works]);

  const autoSelectTask = () => {
    if (!isAutoSelectEnabled) {
      setIsAutoSelectEnabled(true);
    }

    const availableTasks = todayDataTimeCount.filter(
      (task) => parseInt(task.status.replace("%", ""), 10) < 100
    );

    if (availableTasks.length === 0) return;

    let selectedTask = null;

    // Ưu tiên chọn task theo chế độ xem
    if (viewMode === "byPercent") {
      availableTasks.sort((a, b) => {
        const percentA = parseInt(a.status.replace("%", ""), 10);
        const percentB = parseInt(b.status.replace("%", ""), 10);
        if (percentA !== percentB) return percentB - percentA;
        return a.totalTimeSlotInSeconds - b.totalTimeSlotInSeconds;
      });
    } else if (viewMode === "byTime") {
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      availableTasks.sort((a, b) => {
        const taskAStartMinutes =
          tasksForToday.find((task) => task.name === a.name)?.startTime?.getHours() * 60 +
          tasksForToday.find((task) => task.name === a.name)?.startTime?.getMinutes() || Infinity;

        const taskBStartMinutes =
          tasksForToday.find((task) => task.name === b.name)?.startTime?.getHours() * 60 +
          tasksForToday.find((task) => task.name === b.name)?.startTime?.getMinutes() || Infinity;

        const diffA = Math.abs(taskAStartMinutes - currentMinutes);
        const diffB = Math.abs(taskBStartMinutes - currentMinutes);

        if (diffA !== diffB) return diffA - diffB;
        return a.totalTimeSlotInSeconds - b.totalTimeSlotInSeconds;
      });
    }

    selectedTask = availableTasks[0];

    // Nếu task hiện tại đã là ưu tiên, không thay đổi
    if (selectedTaskName === selectedTask.name) return;

    // Nếu task hiện tại không phải ưu tiên, chọn lại
    handleSelectTaskBlock(selectedTask.name);
  };

  // cập nhật danh sách taskFortoday
  useEffect(() => {
    if (mode === "auto") {
      calculateTasksForToday();
    }
  }, [mode, calculateTasksForToday]);


  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        calculateTasksForToday();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [calculateTasksForToday]);

  const toggleAutoSelect = () => {
    if (mode !== "auto") {
        toast.error("This feature is only available in Auto mode.");
        return;
    }
    setIsAutoSelectEnabled(prev => !prev);
    if (!isAutoSelectEnabled) {
        autoSelectTask();
    }
};

  const renderTaskOnTimeline = (task) => {
    const taskStart = task.startTime;
    const taskEnd = task.endTime;
    const startMinutes = taskStart.getHours() * 60 + taskStart.getMinutes();
    const endMinutes = taskEnd.getHours() * 60 + taskEnd.getMinutes();

    // Kiểm tra trạng thái của task
    const isSelected = selectedTaskName === task.name;
    const isDimmed = selectedTaskName && selectedTaskName !== task.name;

    return (
      <div
        className={`task-block ${isSelected ? "selected" : ""} ${
          isDimmed ? "dimmed" : ""
        }`}
        style={{
          top: `${startMinutes}px`,
          height: `${endMinutes - startMinutes}px`,
        }}
        key={task.name}
        onClick={() => handleSelectTaskBlock(task.name)}
      >
        <div className="task-name">{task.name}</div>
        <button className="select-task-button">
          {isSelected ? "Deselect" : "Select"}
        </button>
      </div>
    );
  };

  const calculateTimeSlot = (startTime, endTime) => {
    let minutesTotal = Math.floor((new Date(endTime) - new Date(startTime)) / 60000);
    if (minutesTotal < 0) minutesTotal += 24 * 60;
    const hours = Math.floor(minutesTotal / 60);
    const minutes = minutesTotal % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };


  const getPomodoroBackground = () => {
    if (isFreeMode) return "#d4b3e9";
    switch (currentMode) {
      case "pomodoro":
        return "#56daeb";
      case "short-break":
        return "#a8d5ba";
      case "long-break":
        return "#f6e58d";
      default:
        return "#f9f9f9";
    }
  };

  const taskTimeSlotToSeconds = (timeSlot) => {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    return hours * 3600 + minutes * 60;
  };

  const handleModeChange = (newMode) => {
    closeCurrentTimeSession("completed");
    // Clear timer refs
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      elapsedRef.current = getElapsedSeconds();
      sessionStartRef.current = null;
    }

    // Nếu chỉ thay đổi giữa pomodoro, short-break, long-break
    if (["pomodoro", "short-break", "long-break"].includes(newMode)) {
      elapsedRef.current = 0;
      sessionStartRef.current = null;
      setCurrentMode(newMode);
      setIsRunning(false);
      if (newMode === "pomodoro") {
        setTimeLeft(1500);
      } else if (newMode === "short-break") {
        setTimeLeft(300);
      } else if (newMode === "long-break") {
        setTimeLeft(900);
      }
      return;
    }

    // Nếu thay đổi giữa các chế độ auto, manual, free
    setIsRunning(false);
    setTimeLeft(1500);
    setFreeModeTime(0);
    elapsedRef.current = 0;

    // Bỏ chọn task và record
    setSelectedTaskName(null);
    setIsTaskSelected(false);
    setCurrentTaskManual(null);
    setSelectedWork(null);
    setSelectedTask(null);
    setTempWork(null);
    setTempTask(null);
    setCurrentRecord(null);

    // Cập nhật chế độ
    setMode(newMode);
  };

  const openManualSelectModal = () => {
    setTempWork(selectedWork);
    setTempTask(selectedTask);
    setIsModalOpen(true);
  };

  const handleManualSelectWork = (work) => {
    setTempWork((prev) => (prev?.id === work.id ? null : work));
    setTempTask(null);
  };

  const handleManualSelectTask = (task) => {
    setTempTask((prev) => (prev?.name === task.name ? null : task));
  };

  const handleManualSelectionDone = () => {
    closeCurrentTimeSession("completed");
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedRef.current = 0;
    sessionStartRef.current = null;
    setIsRunning(false);
    setTimeLeft(TIMER_DURATIONS[currentMode] || TIMER_DURATIONS.pomodoro);
    setSelectedWork(tempWork);
    setSelectedTask(tempTask);

    setCurrentTaskManual(
      tempTask
        ? {
            ...tempTask,
            workName: tempWork.name,
            workStartDate: tempWork.startDate,
            workEndDate: tempWork.endDate,
            startTime: new Date(`1970-01-01T${tempTask.startTime}:00`),
            endTime: new Date(`1970-01-01T${tempTask.endTime}:00`),
          }
        : null
    );
    if (tempTask) {
      const taskTimeSlot = calculateTimeSlot(
        new Date(`1970-01-01T${tempTask.startTime}:00`),
        new Date(`1970-01-01T${tempTask.endTime}:00`)
      );
      setCountdownTimeTask(taskTimeSlotToSeconds(taskTimeSlot));
      setIsTaskSelected(true);
    } else {
      setCountdownTimeTask(0);
      setIsTaskSelected(false);
    }

    setIsModalOpen(false);
  };


  const closeModal = () => {
    setTempWork(selectedWork);
    setTempTask(selectedTask);
    setIsModalOpen(false);
  };

  const selectedTaskData = todayDataTimeCount.find(
    (task) => task.name === selectedTaskName
  );

  const percentCompleted = selectedTaskData
    ? parseInt(selectedTaskData.status.replace('%', ''), 10)
    : 0;
    const sortedTodayDataTimeCount = useMemo(() => {
      if (viewMode === "byPercent") {
        return [...todayDataTimeCount].sort((a, b) => {
          const percentA = parseInt(a.status.replace("%", ""), 10);
          const percentB = parseInt(b.status.replace("%", ""), 10);

          if (percentA !== percentB) {
            return percentB - percentA; // Sắp xếp theo phần trăm giảm dần
          }

          if (a.totalTimeSlotInSeconds !== b.totalTimeSlotInSeconds) {
            return b.totalTimeSlotInSeconds - a.totalTimeSlotInSeconds; // Sắp xếp theo timeslot giảm dần
          }

          return a.name.localeCompare(b.name); // Sắp xếp theo thứ tự chữ cái
        });
      }
      return todayDataTimeCount;
    }, [todayDataTimeCount, viewMode]);

  return (
    <div className="main-form focus-page">
      <header className="focus-page-header">
        <div>
          <p>MY WORKSPACE / FOCUS</p>
          <h1>Focus</h1>
        </div>
        <span>
          {currentTime.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </header>

      <div className="container-row">
      <div className="today-data-container">
    <button
      className="today-data-toggle"
      onClick={() => setIsTodayDataVisible((prev) => !prev)}
    >
      Today's summary <span aria-hidden="true">⌄</span>
    </button>
    {isTodayDataVisible && (
      <div className="today-data-content">
        <div className="today-data-header">
          <p>Today: {new Date().toDateString()}</p>
          <select
            className="view-mode-selector"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="byTime">By Time</option>
            <option value="byPercent">By Percent</option>
          </select>
        </div>
        <ul>
          {sortedTodayDataTimeCount.map((task, index) => (
            <li key={index}>
              {task.name}{" "}
              <strong>
                {formatTime(task.realTimeTaskCount)} / {task.timeSlot}
              </strong>{" "}
              <span>{task.status}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>

      <div className="countdown-task">
        <div className="progress-bar-todaytask-container">
          <div
            className="progress-bar-todaytask"
            style={{ width: `${Math.min(percentCompleted, 100)}%` }}
          ></div>
        </div>
        {isTaskSelected ? (
          <p className="countdown-text">{formatTime(countdownTimeTask)}</p>
        ) : (
          <p className="countdown-text">Select task!</p>
        )}
      </div>



  <div className="focus-modes">
  <button
    className={`focus-mode ${mode === "auto" ? "active" : ""}`}
    onClick={() => handleModeChange("auto")}
  >
    Tự động
  </button>
  <button
    className={`focus-mode ${mode === "manual" ? "active" : ""}`}
    onClick={() => {handleModeChange("manual");
    openManualSelectModal();
  }}
  >
    Tự chọn
  </button>
  <button
    className={`focus-mode ${mode === "free" ? "active" : ""}`}
    onClick={() => handleModeChange("free")}
  >
    Tự do
  </button>
</div>

</div>


<div className="focus-content">
  <div className="autoselect-container">

    <div className="autoselect-stats">
      <div className="autoselect-stat">
        <span className="stat-label">Total Time:</span>
        <span className="stat-value">{formatTime(totalRealTime)}</span>
      </div>
      <div className="autoselect-stat">
        <span className="stat-label">Completed:</span>
        <span className="stat-value">{`${completedTaskCount}/${totalTasks}`}</span>
    </div>
    <div className="autoselect-stat">
    <button
      className={`autoselect-button ${isAutoSelectEnabled ? "on" : "off"}`}
      onClick={toggleAutoSelect}
      >
          {isAutoSelectEnabled ? "ON" : "OFF"}
    </button>

    </div>
  </div>


</div> {/* code for autoSelect end */}

<div className="timeline-container" ref={timelineRef}>
  <div className="timeline">
    <div
      className="current-time-line"
      style={{
        "--time-position": `${currentTime.getHours() * 60 + currentTime.getMinutes()}px`,
        top: `${currentTime.getHours() * 60 + currentTime.getMinutes() + 6.5}px`,
      }}
    ></div>
    {Array.from({ length: 25 }).map((_, hour) => (
      <div key={hour} className="hour-block" style={{ top: `${hour * 60}px` }}>
        <div className="hour-marker">
          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
        </div>
        <div className="hour-divider"></div>
      </div>
    ))}
    {tasksForToday.map((task) => renderTaskOnTimeline(task))}
  </div>
</div> {/* code for timeline-container end */}


{mode === "auto" && (
  <div className="task-list">
          <h2>Today Task</h2>
          <p>
            Tổng số task: <strong>{tasksForToday.length}</strong>
          </p>
          {tasksForToday.length > 0 ? (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Work</th>
                  <th>Time</th>
                  <th>TimeSlot</th>
                </tr>
              </thead>
              <tbody>
                {tasksForToday.map((task, index) => {
                  const timeSlot = calculateTimeSlot(task.startTime, task.endTime);
                  return (
                    <tr
                      key={index}
                      className={`task-list-item ${
                        selectedTaskName === task.name ? "selected" : ""
                      }`}
                      onClick={() => handleSelectTaskBlock(task.name)}
                    >
                      <td>{task.name}</td>
                      <td>{task.workName || "N/A"}</td>
                      <td>
                        {task.startTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        -{" "}
                        {task.endTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td>{timeSlot}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>Empty Task Today</p>
          )}
        </div>

)} {/* code for task-list of AUTO MODE end */}

{mode === "manual"  && (
        <div className="manual-mode-container">
    {/* Danh sách các task đã chọn */}
    <div className="manual-selected-tasks">
      <h2>Selected Tasks</h2>
      <ul>
        {selectedTasksManual.map((task, index) => (
          <li key={index}>
            {task.name}: <strong>{formatTime(task.time)}</strong>
          </li>
        ))}
      </ul>
    </div>
    <div className="task-select">
      <h2>Task hiện tại</h2>
      <p>
        <strong>Work:</strong> {currentTaskManual?.workName || "N/A"}
      </p>
      <p>
        <strong>Task:</strong> {currentTaskManual?.name || "N/A"}
      </p>
      <p>
        <strong>Thời gian:</strong>{" "}
        {currentTaskManual?.startTime?.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) || "N/A"}{" "}
        -{" "}
        {currentTaskManual?.endTime?.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) || "N/A"}
      </p>
      <p>
        <strong>Timeslot:</strong>{" "}
        {currentTaskManual
          ? calculateTimeSlot(
              new Date(currentTaskManual.startTime),
              new Date(currentTaskManual.endTime)
            )
          : "N/A"}
      </p>
    </div>
  </div>
)} {/* code for manualModecontainer Manual Mode end */}
{mode === "free" && (
  <div className="free-mode-container">
    <div className="free-mode-left">
      <h2>New record</h2>
      <div className="record-creation">
        <input
          type="text"
          placeholder="Name this activity"
          aria-label="New activity name"
          value={recordNameInput}
          onChange={(e) => setRecordNameInput(e.target.value)}
        />
        <button type="button" onClick={handleCreateRecord}>
          <FiPlus size={14} aria-hidden="true" />
          <span>Create</span>
        </button>
      </div>
      {currentRecord && (
        <div className="current-record" aria-live="polite">
          <span>Tracking now</span>
          <strong>{currentRecord.name}</strong>
        </div>
      )}
    </div>

    <div className="free-mode-right">
      <div className="free-mode-heading">
        <h2>Records</h2>
        <span>Total time <strong>{formatTime(totalFreeTime)}</strong></span>
      </div>
      <ul className="record-list">
        {records.map((record, index) => (
          <li
            key={`${record.name}-${index}`}
            className={record.name === currentRecord?.name ? "active" : ""}
            onClick={() => handleSelectRecord(record.name)}
          >
            <span className="record-name">{record.name}</span>
            <span className="record-time">{formatTime(record.time)}</span>
            <button
              type="button"
              className="delete-record-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRecord(record.name);
              }}
              aria-label={`Delete ${record.name}`}
              title="Delete record"
            >
              <FiTrash2 size={13} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}



<div className="note-container">
          <div className="note-header">
            <button
              className="note-button"
              onClick={() => alert("Daily form is not implemented yet.")}
            >
              Daily
            </button>
            <button className="note-button" onClick={() => setNoteContent("")}>
              Clear
            </button>
          </div>
          <div className="note-body">
            <label htmlFor="note-input" className="note-label">Note</label>
            <textarea
              id="note-input"
              className="note-input"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your notes here..."
            ></textarea>
          </div>
</div> {/* code for Note-container end */}



 {/* code for pomodoro and stopwatch start */}
 <div className="pomodoro-timer" style={{ backgroundColor: getPomodoroBackground() }}>
  <div className="pomodoro-header">
    <button
      type="button"
      className="swap-icon"
      onClick={toggleFreeMode}
      aria-label={isFreeMode ? "Switch to Pomodoro timer" : "Switch to stopwatch"}
      title={isFreeMode ? "Switch to Pomodoro timer" : "Switch to stopwatch"}
    >
      <FiRepeat size={15} aria-hidden="true" />
    </button>
    <div className="pomodoro-modes">
  {!isFreeMode ? (
    <>
      <span
        className={`pomodoro-mode ${currentMode === "pomodoro" ? "active" : ""}`}
        onClick={() => {
          setCurrentMode("pomodoro");
          handleModeChange("pomodoro");
        }}
      >
        Pomodoro
      </span>
      <span
        className={`pomodoro-mode ${currentMode === "short-break" ? "active" : ""}`}
        onClick={() => {
          setCurrentMode("short-break");
          handleModeChange("short-break");
        }}
      >
        Short-break
      </span>
      <span
        className={`pomodoro-mode ${currentMode === "long-break" ? "active" : ""}`}
        onClick={() => {
          setCurrentMode("long-break");
          handleModeChange("long-break");
        }}
      >
        Long-break
      </span>
    </>
  ) : (
    <span
  className={`pomodoro-mode ${isFreeMode ? "active" : ""}`}
  onClick={() => {
    if (!isFreeMode) {
      toggleFreeMode();
    } else {
      setFreeModeTime(0);
    }
  }}
>
  Stopwatch
</span>

  )}
</div>



  </div>
  <p>{formatTime(isFreeMode ? freeModeTime : timeLeft)}</p>
  <div className="timer-controls">
  <button
  onClick={
    isTaskSelected || currentRecord
      ? handleStartPause
      : () => toast.error("Please choose a task or record")
  }
  disabled={!isTaskSelected && !currentRecord}
>
  {isRunning ? "Tạm dừng" : "Bắt đầu"}
</button>


    {isFreeMode && (
      <button
        onClick={() => {
          closeCurrentTimeSession("completed");
          setFreeModeTime(0);
          elapsedRef.current = 0;
          sessionStartRef.current = null;
          setIsRunning(false);
        }}
      >
        Kết thúc
      </button>
    )}
    {!isFreeMode && <button onClick={handleSkip}>Bỏ qua</button>}
  </div>
</div>

</div>

      {isModalOpen && (
        <div className="focus-select-overlay">
          <section
            className="focus-select-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-select-title"
          >
            <header className="focus-select-header">
              <div>
                <p>MANUAL FOCUS</p>
                <h2 id="focus-select-title">Choose a work and task</h2>
                <span>Select the activity you want to track.</span>
              </div>
              <button
                type="button"
                className="focus-select-close"
                onClick={closeModal}
                aria-label="Close task selection"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="focus-select-grid">
              <section className="focus-select-pane">
                <div className="focus-select-pane-heading">
                  <h3>Works</h3>
                  <span>{Object.values(works).flat().length}</span>
                </div>
                <div className="focus-select-list">
                  {Object.values(works).flat().map((work) => (
                    <button
                      type="button"
                      key={work.id}
                      className={`work-item-focus ${
                        tempWork?.id === work.id ? "active" : ""
                      }`}
                      onClick={() => handleManualSelectWork(work)}
                    >
                      <strong>{work.name}</strong>
                      <span>
                        {work.startDate} – {work.endDate}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="focus-select-pane">
                <div className="focus-select-pane-heading">
                  <h3>Tasks</h3>
                  <span>{tempWork?.subWorks?.length || 0}</span>
                </div>
                <div className="focus-select-list">
                  {tempWork?.subWorks?.length ? (
                    tempWork.subWorks.map((task, index) => (
                      <button
                        type="button"
                        key={`${task.name}-${index}`}
                        className={`task-item-focus ${
                          tempTask?.name === task.name ? "active" : ""
                        }`}
                        onClick={() => handleManualSelectTask(task)}
                      >
                        <strong>{task.name}</strong>
                        <span>
                          {task.startTime} – {task.endTime}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="focus-select-empty">
                      {tempWork
                        ? "This work has no tasks yet."
                        : "Choose a work to see its tasks."}
                    </p>
                  )}
                </div>
              </section>
            </div>
            <footer className="focus-select-actions">
              <button
                type="button"
                className="focus-select-done"
                onClick={handleManualSelectionDone}
              >
                Done
              </button>
            </footer>
          </section>
        </div>
      )}

    </div>
  );
};

export default Focus;

