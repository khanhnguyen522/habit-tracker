const pool = require("../db/index");

// STREAKS
const getStreaks = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH daily_logs AS (
        SELECT 
          h.id as habit_id,
          h.name,
          h.icon,
          hl.logged_date,
          ROW_NUMBER() OVER (PARTITION BY h.id ORDER BY hl.logged_date DESC) as rn,
          hl.logged_date - (ROW_NUMBER() OVER (PARTITION BY h.id ORDER BY hl.logged_date DESC))::integer * INTERVAL '1 day' as grp
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.skipped = false
        WHERE h.user_id = $1 AND h.is_archived = false
      ),
      streaks AS (
        SELECT
          habit_id,
          name,
          icon,
          COUNT(*) as streak_length,
          MAX(logged_date) as last_logged
        FROM daily_logs
        WHERE logged_date IS NOT NULL
        GROUP BY habit_id, name, icon, grp
      ),
      current_streaks AS (
        SELECT DISTINCT ON (habit_id)
          habit_id,
          name,
          icon,
          streak_length as current_streak,
          last_logged
        FROM streaks
        ORDER BY habit_id, last_logged DESC
      ),
      max_streaks AS (
        SELECT
          habit_id,
          MAX(streak_length) as longest_streak
        FROM streaks
        GROUP BY habit_id
      )
      SELECT 
        cs.habit_id,
        cs.name,
        cs.icon,
        cs.current_streak,
        cs.last_logged,
        ms.longest_streak
      FROM current_streaks cs
      JOIN max_streaks ms ON cs.habit_id = ms.habit_id`,
      [req.userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// HEATMAP
const getHeatmap = async (req, res) => {
  const { habit_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        logged_date,
        COUNT(*) as count
       FROM habit_logs
       WHERE user_id = $1
         AND skipped = false
         AND logged_date >= CURRENT_DATE - INTERVAL '90 days'
         ${habit_id ? "AND habit_id = $2" : ""}
       GROUP BY logged_date
       ORDER BY logged_date ASC`,
      habit_id ? [req.userId, habit_id] : [req.userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// COMPLETION RATE
const getCompletionRate = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH weekly_data AS (
        SELECT
          DATE_TRUNC('week', hl.logged_date) as week_start,
          COUNT(DISTINCT hl.habit_id) as completed_habits,
          COUNT(DISTINCT h.id) as total_habits
        FROM habits h
        LEFT JOIN habit_logs hl 
          ON h.id = hl.habit_id 
          AND hl.skipped = false
          AND hl.logged_date >= CURRENT_DATE - INTERVAL '8 weeks'
        WHERE h.user_id = $1 AND h.is_archived = false
        GROUP BY DATE_TRUNC('week', hl.logged_date)
      )
      SELECT
        week_start,
        completed_habits,
        total_habits,
        ROUND(
          CASE WHEN total_habits > 0 
               THEN (completed_habits::decimal / total_habits) * 100 
               ELSE 0 
          END, 1
        ) as completion_percentage
      FROM weekly_data
      WHERE week_start IS NOT NULL
      ORDER BY week_start ASC`,
      [req.userId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// BEST AND WORST DAY
const getBestWorstDay = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH day_stats AS (
        SELECT
          TO_CHAR(logged_date, 'Day') as day_name,
          EXTRACT(DOW FROM logged_date) as day_number,
          COUNT(*) as total_completions,
          COUNT(DISTINCT logged_date) as days_counted,
          ROUND(COUNT(*)::decimal / NULLIF(COUNT(DISTINCT logged_date), 0), 1) as avg_completions
        FROM habit_logs
        WHERE user_id = $1
          AND skipped = false
          AND logged_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY TO_CHAR(logged_date, 'Day'), EXTRACT(DOW FROM logged_date)
      )
      SELECT
        day_name,
        day_number,
        total_completions,
        avg_completions,
        RANK() OVER (ORDER BY avg_completions DESC) as rank
      FROM day_stats
      ORDER BY day_number ASC`,
      [req.userId],
    );

    const best = result.rows.reduce(
      (a, b) => (a.avg_completions > b.avg_completions ? a : b),
      result.rows[0],
    );
    const worst = result.rows.reduce(
      (a, b) => (a.avg_completions < b.avg_completions ? a : b),
      result.rows[0],
    );

    res.json({ days: result.rows, best, worst });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// READINESS SCORE
const getReadinessScore = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH goal_habits AS (
        SELECT 
          h.id,
          h.name,
          h.goal_weight,
          COUNT(hl.id) as days_completed,
          30 as target_days,
          ROUND(
            LEAST(COUNT(hl.id)::decimal / 30 * 100, 100), 1
          ) as habit_completion_pct
        FROM habits h
        LEFT JOIN habit_logs hl 
          ON h.id = hl.habit_id 
          AND hl.skipped = false
          AND hl.logged_date >= CURRENT_DATE - INTERVAL '30 days'
        WHERE h.user_id = $1 
          AND h.is_goal_habit = true
          AND h.is_archived = false
        GROUP BY h.id, h.name, h.goal_weight
      )
      SELECT
        name,
        goal_weight,
        days_completed,
        habit_completion_pct,
        ROUND(habit_completion_pct * goal_weight / 100, 1) as weighted_score
      FROM goal_habits`,
      [req.userId],
    );

    const totalScore = result.rows.reduce(
      (sum, row) => sum + parseFloat(row.weighted_score),
      0,
    );

    const targetDate = new Date("2026-07-31");
    const today = new Date();
    const daysRemaining = Math.ceil(
      (targetDate - today) / (1000 * 60 * 60 * 24),
    );

    res.json({
      score: Math.round(totalScore),
      habits: result.rows,
      days_remaining: daysRemaining,
      target_date: "2026-07-31",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// WEEKLY PROGRESS
const getWeeklyProgress = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH week_logs AS (
        SELECT
          h.id as habit_id,
          h.name,
          h.icon,
          h.weekly_target,
          h.is_goal_habit,
          COUNT(hl.id) as completed_this_week
        FROM habits h
        LEFT JOIN habit_logs hl
          ON h.id = hl.habit_id
          AND hl.skipped = false
          AND hl.logged_date >= DATE_TRUNC('week', CURRENT_DATE)
          AND hl.logged_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
        WHERE h.user_id = $1 AND h.is_archived = false
        GROUP BY h.id, h.name, h.icon, h.weekly_target, h.is_goal_habit
      )
      SELECT
        habit_id,
        name,
        icon,
        weekly_target,
        is_goal_habit,
        completed_this_week,
        ROUND(completed_this_week::decimal / NULLIF(weekly_target, 0) * 100, 0) as progress_pct
      FROM week_logs
      ORDER BY is_goal_habit DESC, habit_id ASC`,
      [req.userId],
    );

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    res.json({
      habits: result.rows,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getStreaks,
  getHeatmap,
  getCompletionRate,
  getBestWorstDay,
  getReadinessScore,
  getWeeklyProgress,
};
