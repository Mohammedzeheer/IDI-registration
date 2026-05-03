import dbConnect from "../../../libs/mongoDB";
import Feedback from "../../../models/Feedback";
import Student from "../../../models/Student";

export async function POST(req) {
  try {
    await dbConnect();
    const { festId, rating, comment } = await req.json();

    if (!festId || !rating) {
      return Response.json({ message: "Fest ID and Rating required" }, { status: 400 });
    }

    // Find student using festId
    const student = await Student.findOne({ festId });
    if (!student) {
      return Response.json({ message: "Invalid Fest ID" }, { status: 404 });
    }

    // Prevent duplicate feedback
    const exists = await Feedback.findOne({ studentId: student._id, festId });
    if (exists) {
      return Response.json({ message: "You already submitted feedback" }, { status: 400 });
    }

    await Feedback.create({
      studentId: student._id,
      festId,
      rating,
      comment,
    });

    return Response.json({ message: "Feedback submitted successfully" }, { status: 201 });

  } catch (error) {
    return Response.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
