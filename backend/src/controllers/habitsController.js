const pool = require("../db/index");

const createHabit = async (req, res) => {
  const { name, icon, frequency, is_goal_habit, goal_weight, weekly_target } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, icon, frequency, is_goal_habit, goal_weight, weekly_target)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.userId,
        name,
        icon || "⭐",
        frequency || "daily",
        is_goal_habit || false,
        goal_weight || 10,
        weekly_target || 7,
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
       WHERE user_id = $1
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
  const {
    name,
    icon,
    frequency,
    is_goal_habit,
    goal_weight,
    is_archived,
    weekly_target,
  } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE habits 
       SET name = COALESCE($1, name),
           icon = COALESCE($2, icon),
           frequency = COALESCE($3, frequency),
           is_goal_habit = COALESCE($4, is_goal_habit),
           goal_weight = COALESCE($5, goal_weight),
           is_archived = COALESCE($6, is_archived),
           weekly_target = COALESCE($7, weekly_target)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        name,
        icon,
        frequency,
        is_goal_habit,
        goal_weight,
        is_archived,
        weekly_target,
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
