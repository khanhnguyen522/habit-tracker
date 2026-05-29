const pool = require("../db/index");
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const generateReview = async (req, res) => {
  try {
    // get last 7 days of data
    const statsRes = await pool.query(
      `SELECT
        h.name,
        h.is_goal_habit,
        h.goal_weight,
        COUNT(hl.id) as days_completed,
        7 as target_days,
        ROUND(COUNT(hl.id)::decimal / 7 * 100, 1) as completion_pct
       FROM habits h
       LEFT JOIN habit_logs hl
         ON h.id = hl.habit_id
         AND hl.skipped = false
         AND hl.logged_date >= CURRENT_DATE - INTERVAL '7 days'
       WHERE h.user_id = $1 AND h.is_archived = false
       GROUP BY h.id, h.name, h.is_goal_habit, h.goal_weight
       ORDER BY h.is_goal_habit DESC`,
      [req.userId],
    );

    // get readiness score
    const readinessRes = await pool.query(
      `WITH goal_habits AS (
        SELECT
          h.goal_weight,
          ROUND(LEAST(COUNT(hl.id)::decimal / 30 * 100, 100), 1) as completion_pct
        FROM habits h
        LEFT JOIN habit_logs hl
          ON h.id = hl.habit_id
          AND hl.skipped = false
          AND hl.logged_date >= CURRENT_DATE - INTERVAL '30 days'
        WHERE h.user_id = $1 AND h.is_goal_habit = true AND h.is_archived = false
        GROUP BY h.id, h.goal_weight
      )
      SELECT ROUND(SUM(completion_pct * goal_weight / 100), 0) as score
      FROM goal_habits`,
      [req.userId],
    );

    const stats = statsRes.rows;
    const readinessScore = readinessRes.rows[0]?.score || 0;
    const targetDate = "2026-07-31";
    const daysRemaining = Math.ceil(
      (new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24),
    );

    // build prompt for Claude
    const prompt = `You are a supportive but honest coach reviewing someone's habit data for the past week. They are a CS grad student grinding to get a software engineering internship by ${targetDate} (${daysRemaining} days away).

Here is their habit data for the past 7 days:
${stats.map((s) => `- ${s.name}: ${s.days_completed}/${s.target_days} days (${s.completion_pct}%) ${s.is_goal_habit ? "[GOAL HABIT - " + s.goal_weight + "% weight]" : ""}`).join("\n")}

Their current internship readiness score: ${readinessScore}/100

Write a short, personal weekly review (3-4 sentences max). Be specific about what they did well and what needs improvement. End with one concrete action they should focus on next week. Be direct and motivating, not generic. Speak directly to them as "you".`;

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const reviewText = message.content[0].text;

    // calculate overall completion rate for the week
    const totalCompleted = stats.reduce(
      (sum, s) => sum + parseInt(s.days_completed),
      0,
    );
    const totalTarget = stats.length * 7;
    const completionRate = Math.round((totalCompleted / totalTarget) * 100);

    // save review to DB
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const saved = await pool.query(
      `INSERT INTO weekly_reviews (user_id, week_start, review_text, completion_rate, readiness_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.userId,
        weekStart.toISOString().split("T")[0],
        reviewText,
        completionRate,
        readinessScore,
      ],
    );

    res.json(saved.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM weekly_reviews
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { generateReview, getReviews };
