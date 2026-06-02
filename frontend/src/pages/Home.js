import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Home.css";
import confetti from "canvas-confetti";

function Home() {
  const [habits, setHabits] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const [habitsRes, readinessRes, streaksRes] = await Promise.all([
        api.get("/logs/today"),
        api.get("/analytics/readiness-score"),
        api.get("/analytics/streaks"),
      ]);

      const streakMap = {};
      streaksRes.data.forEach((s) => {
        streakMap[s.habit_id] = s.current_streak;
      });

      const habitsWithStreaks = habitsRes.data.map((h) => ({
        ...h,
        current_streak: streakMap[h.id] || 0,
      }));

      setHabits(habitsWithStreaks);
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
        setLastChecked(null);
      } else {
        await api.post("/logs", { habit_id: habit.id, skipped: false });
        setLastChecked(habit.name);
        setTimeout(() => setLastChecked(null), 3000);

        const remaining = habits.filter(
          (h) => !h.completed && h.id !== habit.id,
        );
        if (remaining.length === 0) {
          setTimeout(() => fireConfetti(), 300);
        }
      }
      fetchTodayData();
    } catch (err) {
      console.error(err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getInitials = (email) => {
    if (!email) return "KN";
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  const fireConfetti = () => {
    const end = Date.now() + 1500;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#C17B4E", "#D4A574", "#F0DCC8", "#2C2A26", "#854F0B"],
        disableForReducedMotion: false,
        useWorker: false,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#C17B4E", "#D4A574", "#F0DCC8", "#2C2A26", "#854F0B"],
        disableForReducedMotion: false,
        useWorker: false,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const getDateChip = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  const bestStreak = habits.reduce((max, h) => {
    const s = parseInt(h.current_streak || 0);
    return s > max ? s : max;
  }, 0);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home-container">
      {/* header */}
      <div className="home-header">
        <div>
          <div className="home-greeting-sub">{getGreeting()}</div>
          <div className="home-greeting-name">
            {user?.email?.split("@")[0] || "Khanh"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="home-avatar">{getInitials(user?.email)}</div>
          <button className="logout-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {/* streak pills */}
      <div className="streak-row">
        <div className="streak-pill">🔥 {bestStreak} day streak</div>
        {allDone && (
          <div className="streak-pill streak-pill-green">
            ⚡ All done today!
          </div>
        )}
        {completedCount > 0 && !allDone && (
          <div className="streak-pill streak-pill-green">⚡ Keep going!</div>
        )}
      </div>

      {/* xp toast */}
      {lastChecked && (
        <div className="xp-toast">
          <div className="xp-dot">+10</div>
          <div>
            <div className="xp-text">{lastChecked} completed!</div>
            <div className="xp-sub">Keep the streak going today</div>
          </div>
        </div>
      )}

      {/* readiness score */}
      {readiness && (
        <div className="score-card">
          <div className="score-top">
            <div>
              <div className="score-label">Readiness score</div>
              <div className="score-number">
                {readiness.score}
                <span className="score-max">/100</span>
              </div>
            </div>
            <div className="days-box">
              <div className="days-num">{readiness.days_remaining}</div>
              <div className="days-label">days left</div>
            </div>
          </div>
          <div className="score-bar-bg">
            <div
              className="score-bar-fill"
              style={{ width: `${Math.max(readiness.score, 1)}%` }}
            />
          </div>
          <div className="score-target">Target: July 31, 2026</div>
        </div>
      )}

      {/* date */}
      <div className="date-chip">{getDateChip()}</div>

      {/* habits */}
      <div className="progress-row">
        <div className="progress-text">Today's habits</div>
        <div className="progress-count">
          {completedCount} / {totalCount}
        </div>
      </div>

      <div className="habit-list">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={`habit-item ${habit.completed ? "habit-done" : ""}`}
            onClick={() => toggleHabit(habit)}
          >
            <div
              className={`habit-checkbox ${habit.completed ? "checked" : ""}`}
            >
              {habit.completed && <span className="check-mark">✓</span>}
            </div>
            <div
              className={`habit-icon-wrap ${habit.completed ? "done-bg" : ""}`}
            >
              {habit.icon}
            </div>
            <div className="habit-info">
              <div className={`habit-name ${habit.completed ? "done" : ""}`}>
                {habit.name}
              </div>
              {habit.is_goal_habit && (
                <div className="habit-goal-badge">
                  Goal · {habit.goal_weight}%
                </div>
              )}
            </div>
            <div className="habit-streak-info">
              {habit.current_streak > 0 ? (
                <>
                  🔥 {habit.current_streak}
                  <span>streak</span>
                </>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  );
}

export default Home;
