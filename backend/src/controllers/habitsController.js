const pool = require("../db/index");

const createHabit = async (req, res) => {
  const { name, icon, frequency, is_goal_habit, goal_weight } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, icon, frequency, is_goal_habit, goal_weight)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.userId,
        name,
        icon || "⭐",
        frequency || "daily",
        is_goal_habit || false,
        goal_weight || 10,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getHabits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM habits 
       WHERE user_id = $1 AND is_archived = false
       ORDER BY created_at ASC`,
      [req.userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateHabit = async (req, res) => {
  const { name, icon, frequency, is_goal_habit, goal_weight, is_archived } =
    req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE habits 
       SET name = COALESCE($1, name),
           icon = COALESCE($2, icon),
           frequency = COALESCE($3, frequency),
           is_goal_habit = COALESCE($4, is_goal_habit),
           goal_weight = COALESCE($5, goal_weight),
           is_archived = COALESCE($6, is_archived)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        name,
        icon,
        frequency,
        is_goal_habit,
        goal_weight,
        is_archived,
        id,
        req.userId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteHabit = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }

    res.json({ message: "Habit deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { createHabit, getHabits, updateHabit, deleteHabit };
