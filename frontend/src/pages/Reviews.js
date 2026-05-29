import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Reviews.css";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews");
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReview = async () => {
    setGenerating(true);
    try {
      await api.post("/reviews/generate");
      fetchReviews();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatReviewText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/## (.*?)(\n|$)/g, "<h4>$1</h4>")
      .replace(/\n/g, "<br/>");
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <h2 className="reviews-title">Weekly Reviews</h2>
        <button
          className="generate-btn"
          onClick={generateReview}
          disabled={generating}
        >
          {generating ? "⏳ Generating..." : "✨ Generate"}
        </button>
      </div>

      <p className="reviews-subtitle">
        AI-powered analysis of your habit patterns
      </p>

      {reviews.length === 0 ? (
        <div className="empty-reviews">
          <p className="empty-emoji">🤖</p>
          <p className="empty-text">No reviews yet</p>
          <p className="empty-sub">Tap Generate to get your first AI review</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-top">
                <p className="review-date">
                  Week of {formatDate(review.week_start)}
                </p>
                <div className="review-stats">
                  <span className="review-stat">
                    📊 {review.completion_rate}%
                  </span>
                  <span className="review-stat">
                    🎯 {review.readiness_score}/100
                  </span>
                </div>
              </div>
              <div
                className="review-text"
                dangerouslySetInnerHTML={{
                  __html: formatReviewText(review.review_text),
                }}
              />
            </div>
          ))}
        </div>
      )}

      <Navbar />
    </div>
  );
}

export default Reviews;
