"use client";
import { useState, useEffect } from "react";
import { Star, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function FeedbackPage() {
  const [festId, setFestId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Fetch student data from localStorage or session
  useEffect(() => {
    const studentData = localStorage.getItem("studentData");
    if (studentData) {
      const parsed = JSON.parse(studentData);
      setFestId(parsed.festId || "");
    }
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      setMessage("Please select a rating");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ festId, rating, comment }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Thank you! Your feedback has been submitted successfully.");
        setMessageType("success");
        setRating(0);
        setComment("");
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setMessage("");
        }, 5000);
      } else {
        setMessage(data.message || "Failed to submit feedback");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    }
    setLoading(false);
  };

  const StarRating = () => {
    return (
      <div className="flex justify-center gap-2 my-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              size={48}
              className={`transition-all ${
                star <= (hoverRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
             Feedback
          </h1>
          <p className="text-gray-600">
            We had love to hear about your experience!
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              messageType === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p
              className={`${
                messageType === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {message}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Fest ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your ID
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50"
              placeholder="e.g. IDI4583"
              value={festId}
              onChange={(e) => setFestId(e.target.value)}
              required
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Your ID is automatically filled from your profile
            </p>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              How would you rate your experience?
            </label>
            <StarRating />
            {rating > 0 && (
              <p className="text-center text-lg font-semibold text-indigo-600 mt-2">
                {ratingLabels[rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Comments (Optional)
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              rows="5"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit Feedback
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Thank you for being part of avanza 2026!</p>
        </div>
      </div>
    </div>
  );
}
