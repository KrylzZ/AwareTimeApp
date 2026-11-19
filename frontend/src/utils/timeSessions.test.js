import {
  clearResumableTimeSession,
  getResumableTimeSession,
  persistTimeSession,
  readTimeSessions,
  setResumableTimeSession,
} from "./timeSessions";

beforeEach(() => {
  localStorage.clear();
});

test("updates a running session without duplicating its history entry", () => {
  const session = {
    id: "session-1",
    status: "running",
    durationSeconds: 1,
  };
  persistTimeSession(session);
  persistTimeSession({ ...session, durationSeconds: 2 });

  expect(readTimeSessions()).toEqual([{ ...session, durationSeconds: 2 }]);
});

test("restores only the session marked resumable", () => {
  const session = {
    id: "session-1",
    status: "paused",
    durationSeconds: 120,
  };
  persistTimeSession(session);
  setResumableTimeSession(session.id);

  expect(getResumableTimeSession()).toEqual(session);

  clearResumableTimeSession();
  expect(getResumableTimeSession()).toBeNull();
  expect(readTimeSessions()).toEqual([session]);
});
