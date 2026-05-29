import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Home.css";

function Home() {
  const [habits, setHabits] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const [habitsRes, readinessRes] = await Promise.all([
        api.get("/logs/today"),
        api.get("/analytics/readiness-score"),
      ]);
      setHabits(habitsRes.data);
      setReadiness(readinessRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habit) => {
    try {
      if (habit.completed) {
        await api.delete(
          `/logs/${habit.id}/${new Date().toISOString().split("T")[0]}`,
        );
      } else {
        await api.post("/logs", { habit_id: habit.id, skipped: false });
      }
      fetchTodayData();
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home-container">
      {/* header */}
      <div className="home-header">
        <div>
          <h2 className="home-greeting">Hey {user?.email?.split("@")[0]} 👋</h2>
          <p className="home-date">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* readiness score */}
      {readiness && (
        <div className="score-card">
          <div className="score-top">
            <div>
              <p className="score-label">Internship Readiness</p>
              <p className="score-number">
                {readiness.score}
                <span className="score-max">/100</span>
              </p>
            </div>
            <div className="days-remaining">
              <p className="days-number">{readiness.days_remaining}</p>
              <p className="days-label">days left</p>
            </div>
          </div>
          <div className="score-bar-bg">
            <div
              className="score-bar-fill"
              style={{ width: `${readiness.score}%` }}
            />
          </div>
          <p className="score-target">Target: July 31, 2026</p>
        </div>
      )}

      {/* today's progress */}
      <div className="progress-row">
        <p className="progress-text">Today's habits</p>
        <p className="progress-count">
          {completedCount}/{totalCount}
        </p>
      </div>

      {/* habit list */}
      <div className="habit-list">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={`habit-item ${habit.completed ? "habit-done" : ""}`}
            onClick={() => toggleHabit(habit)}
          >
            <div className="habit-left">
              <div
                className={`habit-checkbox ${habit.completed ? "checked" : ""}`}
              >
                {habit.completed && <span>✓</span>}
              </div>
              <div>
                <p className="habit-name">
                  {habit.icon} {habit.name}
                </p>
                {habit.is_goal_habit && (
                  <p className="habit-tag">Goal habit · {habit.goal_weight}%</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
