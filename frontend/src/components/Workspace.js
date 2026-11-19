import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineAppstore, AiOutlineUnorderedList } from "react-icons/ai";
import Dashboard from "./Dashboard";
import Project from "./Project";
import "./styles/workspace.css";

const Workspace = ({
  view,
  works,
  setWorks,
  completedWorks,
  setCompletedWorks,
  recycledWorks,
  setRecycledWorks,
  taskCompletionStatus,
  setTaskCompletionStatus,
}) => {
  const location = useLocation();
  const allWorks = Object.values(works).flat();
  const allCurrentAndCompleted = [
    ...allWorks,
    ...completedWorks.filter(
      (completedWork) => !allWorks.some((work) => work.id === completedWork.id)
    ),
  ];
  const taskCount = allCurrentAndCompleted.reduce(
    (count, work) => count + (work.subWorks || []).length,
    0
  );
  const completedTaskCount = allCurrentAndCompleted.reduce((count, work) => {
    if (completedWorks.some((completedWork) => completedWork.id === work.id)) {
      return count + (work.subWorks || []).length;
    }
    return count + (work.subWorks || []).filter(
      (_, index) => taskCompletionStatus[`${work.id}-${index}`]
    ).length;
  }, 0);
  const progress = taskCount
    ? Math.min(100, Math.round((completedTaskCount / taskCount) * 100))
    : 0;

  const sharedProps = {
    works,
    setWorks,
    completedWorks,
    setCompletedWorks,
    recycledWorks,
    setRecycledWorks,
    taskCompletionStatus,
    setTaskCompletionStatus,
  };

  return (
    <div className="workspace-page">
      <header className="workspace-topbar">
        <div className="workspace-heading">
          <div className="workspace-mark">A</div>
          <div>
            <p className="workspace-eyebrow">MY WORKSPACE</p>
            <h1>Everything, in focus.</h1>
          </div>
        </div>
        <div className="workspace-progress" aria-label={`${progress}% task completion`}>
          <div className="workspace-progress-copy">
            <span>Workspace progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="workspace-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <section className="workspace-stats" aria-label="Workspace summary">
        <article className="workspace-stat">
          <span className="workspace-stat-icon active-work">●</span>
          <div><span>Active projects</span><strong>{allWorks.length}</strong></div>
        </article>
        <article className="workspace-stat">
          <span className="workspace-stat-icon task-work">✓</span>
          <div><span>Tasks in projects</span><strong>{taskCount}</strong></div>
        </article>
        <article className="workspace-stat">
          <span className="workspace-stat-icon done-work">✓</span>
          <div><span>Completed projects</span><strong>{completedWorks.length}</strong></div>
        </article>
        <article className="workspace-stat">
          <span className="workspace-stat-icon archived-work">↗</span>
          <div><span>In recycle bin</span><strong>{recycledWorks.length}</strong></div>
        </article>
      </section>

      <div className="workspace-views" role="tablist" aria-label="Workspace views">
        <Link
          to="/Home"
          className={view === "board" ? "workspace-view active" : "workspace-view"}
          aria-current={view === "board" ? "page" : undefined}
          role="tab"
          aria-selected={view === "board"}
        >
          <AiOutlineAppstore /> Board
        </Link>
        <Link
          to="/Home/projects"
          className={view === "projects" ? "workspace-view active" : "workspace-view"}
          aria-current={view === "projects" ? "page" : undefined}
          role="tab"
          aria-selected={view === "projects"}
        >
          <AiOutlineUnorderedList /> Projects
          <span className="workspace-view-count">
            {allWorks.length +
              completedWorks.filter(
                (completedWork) => !allWorks.some((work) => work.id === completedWork.id)
              ).length}
          </span>
        </Link>
        <span className="workspace-view-spacer" />
        <span className="workspace-location">{location.pathname === "/Home" ? "Overview" : "All work"}</span>
      </div>

      <section className="workspace-content">
        {view === "board" ? (
          <Dashboard {...sharedProps} />
        ) : (
          <Project {...sharedProps} />
        )}
      </section>
    </div>
  );
};

export default Workspace;
