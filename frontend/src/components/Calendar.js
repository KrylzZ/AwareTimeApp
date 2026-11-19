import React, { useEffect, useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import "./styles/calendar.css";

const localizer = momentLocalizer(moment);

const colorPalette = ["#2563eb", "#0f766e", "#7c3aed", "#d97706", "#0891b2", "#db2777"];

const Calendar = ({ works }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const mappedEvents = works.flatMap(workType => 
      workType.map(work => ({
        title: work.name,
        start: new Date(work.startDate),
        end: new Date(work.endDate),
        description: work.describe,
        color: getColor(work.name)
      }))
    );
    setEvents(mappedEvents);
  }, [works]);

  function getColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  }

  return (
    <main className="main-form calendar-page">
      <header className="calendar-page-header">
        <div>
          <p>MY WORKSPACE / CALENDAR</p>
          <h1>Calendar</h1>
        </div>
        <span>Plan your time and keep work in view.</span>
      </header>
      <BigCalendar
        className="calendar-board"
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', width: '100%' }}
        eventPropGetter={(event) => ({
          className: 'calendar-event',
          style: {
            backgroundColor: `color-mix(in srgb, ${event.color} 14%, var(--prof))`,
            borderLeft: `3px solid ${event.color}`,
            borderRadius: "6px",
            color: "var(--text)",
            marginTop: "2px",
            marginBottom: "2px",
          }
        })}
      />
    </main>
  );
};

export default Calendar;
