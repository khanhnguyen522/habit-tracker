import { useState, useEffect, useRef } from "react";
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
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [quantityModal, setQuantityModal] = useState(null);
  const { user, logout } = useAuth();
  const toastTimerRef = useRef(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const [habitsRes, readinessRes, streaksRes, weeklyRes] =
        await Promise.all([
          api.get("/logs/today"),
          api.get("/analytics/readiness-score"),
          api.get("/analytics/streaks"),
          api.get("/analytics/weekly-progress"),
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
      setWeeklyProgress(weeklyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habit, isLongPress = false) => {
    if (habit.completed) {
      try {
        await api.delete(
          `/logs/${habit.id}/${new Date().toISOString().split("T")[0]}`,
        );
        setLastChecked(null);
        fetchTodayData();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    if (isLongPress) {
      setQuantityModal({
        habit,
        quantity: habit.unit !== "sessions" ? "" : 1,
        date: "today",
        isSession: habit.unit === "sessions",
      });
      return;
    }

    if (habit.unit && habit.unit !== "sessions") {
      setQuantityModal({ habit, quantity: "", date: "today" });
      return;
    }

    await logHabit(habit, 1, new Date().toISOString().split("T")[0]);
  };

  const logHabit = async (habit, quantity, date) => {
    try {
      await api.post("/logs", {
        habit_id: habit.id,
        skipped: false,
        quantity,
        logged_date: date || new Date().toISOString().split("T")[0],
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setLastChecked({
        name: habit.name,
        quantity,
        unit: habit.unit || "sessions",
        date,
      });
      toastTimerRef.current = setTimeout(() => {
        setLastChecked(null);
        toastTimerRef.current = null;
      }, 3000);

      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const remaining = habits.filter((h) => !h.completed && h.id !== habit.id);
      if (remaining.length === 0 && date !== yesterday) {
        setTimeout(() => fireConfetti(), 300);
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

  const getDateChip = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const fireConfetti = () => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useGlobalCanvas: false,
    });

    const colors = [
      "#FF6B6B",
      "#FFD93D",
      "#6BCB77",
      "#4D96FF",
      "#FF6BCC",
      "#FF9F43",
    ];
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      myConfetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.75 },
        colors,
        startVelocity: 60,
        scalar: 1.1,
        shapes: ["circle", "square"],
        disableForReducedMotion: false,
      });
      myConfetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.75 },
        colors,
        startVelocity: 60,
        scalar: 1.1,
        shapes: ["circle", "square"],
        disableForReducedMotion: false,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        setTimeout(() => {
          document.body.removeChild(canvas);
        }, 2000);
      }
    };

    frame();
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const totalCount = habits.length;

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

      {/* xp toast */}
      {lastChecked && (
        <div className="xp-toast">
          <div className="xp-dot">
            {lastChecked.unit === "sessions"
              ? "+1"
              : `+${lastChecked.quantity}`}
          </div>
          <div>
            <div className="xp-text">{lastChecked.name} logged!</div>
            <div className="xp-sub">
              {lastChecked.date ===
              new Date(Date.now() - 86400000).toISOString().split("T")[0]
                ? "Logged for yesterday"
                : lastChecked.unit === "sessions"
                  ? "Keep the streak going"
                  : `${lastChecked.quantity} ${lastChecked.unit} logged`}
            </div>
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

      {/* weekly progress */}
      {weeklyProgress && (
        <div className="weekly-section">
          <div className="weekly-header">
            <span className="weekly-title">This week</span>
            <span className="weekly-dates">
              {new Date(weeklyProgress.week_start).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              —{" "}
              {new Date(weeklyProgress.week_end).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="weekly-list">
            {weeklyProgress.habits.map((h) => {
              const pct = Math.min(parseInt(h.progress_pct || 0), 100);
              const done = parseFloat(h.completed_this_week);
              const target = parseInt(h.weekly_target);
              const isHit = done >= target;
              return (
                <div key={h.habit_id} className="weekly-item">
                  <div className="weekly-item-top">
                    <span className="weekly-item-name">
                      {h.icon} {h.name}
                    </span>
                    <span className={`weekly-item-count ${isHit ? "hit" : ""}`}>
                      {done}/{target} {h.unit}
                    </span>
                  </div>
                  <div className="weekly-bar-bg">
                    <div
                      className={`weekly-bar-fill ${isHit ? "hit" : ""}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* date */}
      <div className="date-chip">{getDateChip()}</div>

      {/* habits */}
      <div className="progress-row">
        <div className="progress-text">Today</div>
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
            onContextMenu={(e) => {
              e.preventDefault();
              toggleHabit(habit, true);
            }}
            onTouchStart={() => {
              longPressTimer.current = setTimeout(() => {
                toggleHabit(habit, true);
              }, 500);
            }}
            onTouchEnd={() => clearTimeout(longPressTimer.current)}
            onTouchMove={() => clearTimeout(longPressTimer.current)}
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
              {habit.unit && habit.unit !== "sessions" && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {habit.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
          marginTop: "12px",
        }}
      >
        Long press any habit to log for yesterday
      </p>

      {/* quantity modal */}
      {quantityModal && (
        <div
          className="quantity-overlay"
          onClick={() => setQuantityModal(null)}
        >
          <div className="quantity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quantity-habit-name">
              {quantityModal.habit.icon} {quantityModal.habit.name}
            </div>

            <div className="quantity-date-row">
              <div
                className={`quantity-date-option ${quantityModal.date === "today" ? "selected" : ""}`}
                onClick={() =>
                  setQuantityModal({ ...quantityModal, date: "today" })
                }
              >
                Today
              </div>
              <div
                className={`quantity-date-option ${quantityModal.date === "yesterday" ? "selected" : ""}`}
                onClick={() =>
                  setQuantityModal({ ...quantityModal, date: "yesterday" })
                }
              >
                Yesterday
              </div>
            </div>

            {!quantityModal.isSession && (
              <>
                <div className="quantity-label">
                  How many {quantityModal.habit.unit}?
                </div>
                <input
                  className="quantity-input"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="0"
                  value={quantityModal.quantity}
                  onChange={(e) =>
                    setQuantityModal({
                      ...quantityModal,
                      quantity: e.target.value,
                    })
                  }
                  autoFocus
                />
              </>
            )}

            <div className="quantity-buttons">
              <button
                className="quantity-cancel"
                onClick={() => setQuantityModal(null)}
              >
                Cancel
              </button>
              <button
                className="quantity-confirm"
                onClick={() => {
                  const qty = quantityModal.isSession
                    ? 1
                    : parseFloat(quantityModal.quantity);
                  if (!qty || qty <= 0) return;

                  const date =
                    quantityModal.date === "yesterday"
                      ? new Date(Date.now() - 86400000)
                          .toISOString()
                          .split("T")[0]
                      : new Date().toISOString().split("T")[0];

                  logHabit(quantityModal.habit, qty, date);
                  setQuantityModal(null);
                }}
              >
                Log{" "}
                {quantityModal.date === "yesterday"
                  ? "for yesterday"
                  : "for today"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}

export default Home;
