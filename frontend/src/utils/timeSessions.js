const TIME_SESSIONS_KEY = "awaretime.timeSessions.v1";
const RESUMABLE_SESSION_KEY = "awaretime.resumableTimeSessionId.v1";

export const readTimeSessions = () => {
  const savedSessions = localStorage.getItem(TIME_SESSIONS_KEY);
  if (savedSessions === null) return [];

  const sessions = JSON.parse(savedSessions);
  if (!Array.isArray(sessions)) {
    throw new TypeError("Saved time sessions must be an array.");
  }
  return sessions;
};

export const persistTimeSession = (session) => {
  const sessions = readTimeSessions();
  const existingIndex = sessions.findIndex((item) => item.id === session.id);

  if (existingIndex === -1) {
    sessions.push(session);
  } else {
    sessions[existingIndex] = session;
  }

  localStorage.setItem(TIME_SESSIONS_KEY, JSON.stringify(sessions));
};

export const getResumableTimeSession = () => {
  const sessionId = localStorage.getItem(RESUMABLE_SESSION_KEY);
  if (!sessionId) return null;

  const session = readTimeSessions().find((item) => item.id === sessionId);
  if (!session || !["running", "paused"].includes(session.status)) {
    localStorage.removeItem(RESUMABLE_SESSION_KEY);
    return null;
  }
  return session;
};

export const setResumableTimeSession = (sessionId) => {
  localStorage.setItem(RESUMABLE_SESSION_KEY, sessionId);
};

export const clearResumableTimeSession = () => {
  localStorage.removeItem(RESUMABLE_SESSION_KEY);
};

export const createTimeSessionId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
