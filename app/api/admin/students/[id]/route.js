import { NextResponse } from 'next/server';
import Student from '../../../../../models/Student';
import dbConnect from '../../../../../libs/mongoDB';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; // Student ID from URL

    // Find student by MongoDB _id
    const student = await Student.findById(id).select('-__v').lean();

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student
    });

  } catch (error) {
    console.error("Get Student API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
