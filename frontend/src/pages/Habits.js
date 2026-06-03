import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Habits.css";

function Habits() {
  const [habits, setHabits] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [form, setForm] = useState({
    name: "",
    icon: "⭐",
    frequency: "daily",
    is_goal_habit: false,
    goal_weight: 10,
    weekly_target: 7,
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await api.get("/habits");
      setHabits(res.data.filter((h) => !h.is_archived));
      setArchived(res.data.filter((h) => h.is_archived));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingHabit) {
        await api.put(`/habits/${editingHabit.id}`, form);
      } else {
        await api.post("/habits", form);
      }
      fetchHabits();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setForm({
      name: habit.name,
      icon: habit.icon,
      frequency: habit.frequency,
      is_goal_habit: habit.is_goal_habit,
      goal_weight: habit.goal_weight,
      weekly_target: habit.weekly_target || 7,
    });
    setShowForm(true);
  };

  const handleArchive = async (id) => {
    try {
      await api.put(`/habits/${id}`, { is_archived: true });
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.put(`/habits/${id}`, { is_archived: false });
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Delete this habit permanently? All logs will be lost.")
    )
      return;
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingHabit(null);
    setForm({
      name: "",
      icon: "⭐",
      frequency: "daily",
      is_goal_habit: false,
      goal_weight: 10,
      weekly_target: 7,
    });
  };

  const icons = [
    "⭐",
    "💻",
    "☁️",
    "🛠️",
    "📖",
    "😴",
    "🏃",
    "💪",
    "🧘",
    "🎯",
    "📝",
    "🍎",
  ];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="habits-container">
      <div className="habits-header">
        <h2 className="habits-title">My Habits</h2>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          + Add
        </button>
      </div>

      {/* add/edit form */}
      {showForm && (
        <div className="form-card">
          <h3 className="form-title">
            {editingHabit ? "Edit Habit" : "New Habit"}
          </h3>
          <input
            className="form-input"
            placeholder="Habit name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <p className="form-label">Icon</p>
          <div className="icon-grid">
            {icons.map((icon) => (
              <div
                key={icon}
                className={`icon-option ${form.icon === icon ? "selected" : ""}`}
                onClick={() => setForm({ ...form, icon })}
              >
                {icon}
              </div>
            ))}
          </div>

          <p className="form-label">Frequency</p>
          <div className="freq-row">
            {["daily", "weekly"].map((f) => (
              <div
                key={f}
                className={`freq-option ${form.frequency === f ? "selected" : ""}`}
                onClick={() => setForm({ ...form, frequency: f })}
              >
                {f}
              </div>
            ))}
          </div>

          <p className="form-label">
            Weekly target: {form.weekly_target}x per week
          </p>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={form.weekly_target}
            onChange={(e) =>
              setForm({ ...form, weekly_target: parseInt(e.target.value) })
            }
            className="slider"
          />

          <div className="goal-row">
            <div>
              <p className="form-label">Goal habit</p>
              <p className="form-sublabel">Counts toward readiness score</p>
            </div>
            <div
              className={`toggle ${form.is_goal_habit ? "on" : ""}`}
              onClick={() =>
                setForm({ ...form, is_goal_habit: !form.is_goal_habit })
              }
            />
          </div>

          {form.is_goal_habit && (
            <div>
              <p className="form-label">Weight: {form.goal_weight}%</p>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={form.goal_weight}
                onChange={(e) =>
                  setForm({ ...form, goal_weight: parseInt(e.target.value) })
                }
                className="slider"
              />
            </div>
          )}

          <div className="form-buttons">
            <button className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSubmit}>
              {editingHabit ? "Save" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* active habits */}
      <div className="habits-list">
        {habits.map((habit) => (
          <div key={habit.id} className="habit-row">
            <div className="habit-info">
              <div className="habit-icon">{habit.icon}</div>
              <div>
                <p className="habit-name">{habit.name}</p>
                <p className="habit-meta">
                  {habit.frequency} · {habit.weekly_target}x/week
                  {habit.is_goal_habit && ` · goal · ${habit.goal_weight}%`}
                </p>
              </div>
            </div>
            <div className="habit-actions">
              <button className="edit-btn" onClick={() => handleEdit(habit)}>
                Edit
              </button>
              <button
                className="archive-btn"
                onClick={() => handleArchive(habit.id)}
              >
                Archive
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(habit.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* archived section */}
      {archived.length > 0 && (
        <div className="archived-section">
          <button
            className="archived-toggle"
            onClick={() => setShowArchived(!showArchived)}
          >
            <span>Archived ({archived.length})</span>
            <span>{showArchived ? "▲" : "▼"}</span>
          </button>
          {showArchived && (
            <div className="habits-list" style={{ marginTop: "10px" }}>
              {archived.map((habit) => (
                <div key={habit.id} className="habit-row archived-row">
                  <div className="habit-info">
                    <div className="habit-icon">{habit.icon}</div>
                    <div>
                      <p
                        className="habit-name"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {habit.name}
                      </p>
                      <p className="habit-meta">{habit.frequency}</p>
                    </div>
                  </div>
                  <div className="habit-actions">
                    <button
                      className="restore-btn"
                      onClick={() => handleRestore(habit.id)}
                    >
                      Restore
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(habit.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Navbar />
    </div>
  );
}

export default Habits;
