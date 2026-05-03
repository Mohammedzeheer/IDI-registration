import { useState } from "react";

export default function FeedbackForm({ student }) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return alert("Please enter feedback");
    alert(`Thank you ${student.name}! Your feedback has been submitted.`);
    setFeedback("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full border rounded-lg p-3"
        rows="4"
        placeholder="Share your experience..."
      />
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
      >
        Submit Feedback
      </button>
    </form>
  );
}
