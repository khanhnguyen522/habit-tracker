import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import "./Analytics.css";
import Navbar from "../components/Navbar";

function Analytics() {
  const [streaks, setStreaks] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [completionRate, setCompletionRate] = useState([]);
  const [bestWorst, setBestWorst] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [streaksRes, heatmapRes, completionRes, bestWorstRes] =
        await Promise.all([
          api.get("/analytics/streaks"),
          api.get("/analytics/heatmap"),
          api.get("/analytics/completion-rate"),
          api.get("/analytics/best-worst-day"),
        ]);
      setStreaks(streaksRes.data);
      setHeatmap(heatmapRes.data);
      setCompletionRate(completionRes.data);
      setBestWorst(bestWorstRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (count) => {
    if (!count || count === 0) return "#EDE8E0";
    if (count === 1) return "#F0DCC8";
    if (count === 2) return "#D4A574";
    if (count === 3) return "#C17B4E";
    return "#854F0B";
  };

  const buildHeatmapGrid = () => {
    const grid = {};
    heatmap.forEach((h) => {
      const date = h.logged_date.split("T")[0];
      grid[date] = parseInt(h.count);
    });

    const days = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: key,
        count: grid[key] || 0,
        label: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }
    return days;
  };

  if (loading) return <div className="loading">Loading...</div>;

  const heatmapDays = buildHeatmapGrid();

  return (
    <div className="analytics-container">
      <h2 className="analytics-title">Analytics</h2>

      {/* heatmap */}
      <div className="analytics-card">
        <h3 className="card-title">Activity — last 90 days</h3>
        <div className="heatmap-months">
          {["Mar", "Apr", "May", "Jun"].map((m) => (
            <span key={m} className="heatmap-month">
              {m}
            </span>
          ))}
        </div>
        <div className="heatmap-grid">
          {heatmapDays.map((day, i) => (
            <div
              key={i}
              className="heatmap-cell"
              style={{ backgroundColor: getHeatmapColor(day.count) }}
              title={`${day.label}: ${day.count} habits completed`}
            />
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          {["#EDE8E0", "#F0DCC8", "#D4A574", "#C17B4E", "#854F0B"].map((c) => (
            <div
              key={c}
              className="heatmap-cell"
              style={{ backgroundColor: c }}
            />
          ))}
          <span>More</span>
        </div>
        <p className="heatmap-tip">
          Hover over any square to see the date and count
        </p>
      </div>

      {/* streaks */}
      <div className="analytics-card">
        <h3 className="card-title">Streaks</h3>
        {streaks.length === 0 ? (
          <p className="empty-text">No streaks yet — start logging!</p>
        ) : (
          <div className="streaks-list">
            {streaks.map((s) => (
              <div key={s.habit_id} className="streak-row">
                <div>
                  <p className="streak-name">{s.name}</p>
                  <p className="streak-sub">Longest: {s.longest_streak} days</p>
                </div>
                <div className="streak-badge">
                  <span className="streak-fire">🔥</span>
                  <span className="streak-number">{s.current_streak}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* weekly completion rate */}
      <div className="analytics-card">
        <h3 className="card-title">Weekly completion rate</h3>
        {completionRate.length === 0 ? (
          <p className="empty-text">Not enough data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={completionRate}>
              <XAxis
                dataKey="week_start"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                fontSize={11}
                tick={{ fill: "#9C8E7A" }}
                axisLine={{ stroke: "#EDE8E0" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                fontSize={11}
                tick={{ fill: "#9C8E7A" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v}%`, "Completion"]}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                contentStyle={{
                  background: "#2C2A26",
                  border: "none",
                  borderRadius: "10px",
                  color: "#FAF7F2",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#FAF7F2" }}
                labelStyle={{ color: "#9C8A78" }}
              />
              <Bar
                dataKey="completion_percentage"
                fill="#C17B4E"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* best and worst day */}
      {bestWorst && bestWorst.days.length > 0 && (
        <div className="analytics-card">
          <h3 className="card-title">Best & worst day</h3>
          <div className="best-worst-row">
            <div className="best-card">
              <p className="bw-label">Best day</p>
              <p className="bw-day">{bestWorst.best?.day_name?.trim()}</p>
              <p className="bw-avg">
                {bestWorst.best?.avg_completions} avg habits
              </p>
            </div>
            <div className="worst-card">
              <p className="bw-label">Needs work</p>
              <p className="bw-day">{bestWorst.worst?.day_name?.trim()}</p>
              <p className="bw-avg">
                {bestWorst.worst?.avg_completions} avg habits
              </p>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}

export default Analytics;
