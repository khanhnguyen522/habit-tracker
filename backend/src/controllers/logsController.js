const pool = require("../db/index");

const logHabit = async (req, res) => {
  const { habit_id, logged_date, skipped, quantity } = req.body;

  try {
    const habitCheck = await pool.query(
      "SELECT id FROM habits WHERE id = $1 AND user_id = $2",
      [habit_id, req.userId],
    );

    if (habitCheck.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const result = await pool.query(
      `INSERT INTO habit_logs (habit_id, user_id, logged_date, skipped, quantity)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (habit_id, logged_date) 
       DO UPDATE SET skipped = EXCLUDED.skipped, quantity = EXCLUDED.quantity
       RETURNING *`,
      [
        habit_id,
        req.userId,
        logged_date || new Date().toISOString().split("T")[0],
        skipped || false,
        quantity || 1,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getTodayLogs = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const result = await pool.query(
      `SELECT 
        h.id,
        h.name,
        h.icon,
        h.frequency,
        h.is_goal_habit,
        h.goal_weight,
        CASE WHEN hl.id IS NOT NULL AND hl.skipped = false 
             THEN true ELSE false 
        END as completed,
        hl.skipped
       FROM habits h
       LEFT JOIN habit_logs hl 
         ON h.id = hl.habit_id 
         AND hl.logged_date = $2
       WHERE h.user_id = $1 
         AND h.is_archived = false
       ORDER BY h.created_at ASC`,
      [req.userId, today],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const unlogHabit = async (req, res) => {
  const { habitId, date } = req.params;

  try {
    await pool.query(
      "DELETE FROM habit_logs WHERE habit_id = $1 AND user_id = $2 AND logged_date = $3",
      [habitId, req.userId, date],
    );

    res.json({ message: "Habit unlogged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { logHabit, getTodayLogs, unlogHabit };
