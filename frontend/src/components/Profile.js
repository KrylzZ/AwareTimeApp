import React, { useEffect, useState } from "react";
import { TfiReload } from "react-icons/tfi";
import TypeWriter from "typewriter-effect";
import Calendar from "./Calendar/Calendar";

const Profile = () => {
  const [quote, setQuote] = useState();
  const [author, setAuthor] = useState();
  useEffect(() => {
    fetch("http://api.quotable.io/random")
      .then((res) => res.json())
      .then((quotes) => {
        setQuote(quotes.content);
        setAuthor(quotes.author);
      });
  }, []);

  const reloadQuote = () => {
    fetch("http://api.quotable.io/random")
      .then((res) => res.json())
      .then((quotes) => {
        setQuote(quotes.content);
        setAuthor(quotes.author);
      });
  };

  return (
    <aside className="profile calendar-sidebar">
      <header className="calendar-sidebar-heading">
        <p>YOUR DAY</p>
        <h2>Calendar</h2>
      </header>
      <div className="calendar-date-picker">
        <Calendar />
      </div>
      <div className="quote-div">
        <p className="calendar-quote-label">A THOUGHT FOR TODAY</p>
        <h3>
          <TypeWriter
            options={{
              autoStart: true,
              loop: true,
              delay: 100,
              strings: [`" ${quote} "`],
            }}
          />
        </h3>
        <div className="quote-footer">
          <h4 id="auth-name">- {author}</h4>
          <button onClick={reloadQuote} aria-label="Refresh quote">
            <TfiReload size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Profile;
