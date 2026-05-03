// app/api/auth/complete-profile/route.js
import { NextResponse } from 'next/server';
import dbConnect from "../../../../libs/mongoDB";
import Student from '../../../../models/Student';

export async function POST(request) {
  try {
    await dbConnect();

    const { userId, name, place, school, class: className } = await request.json();

    // Validation
    if (!userId || !name || !place || !className) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Find and update student
    const student = await Student.findById(userId);

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    // Update student profile
    student.name = name;
    student.place = place;
    student.school = school;
    student.class = className;
    student.profileCompleted = true;

    await student.save(); // This will trigger the pre-save hook to generate festId

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully!',
      student: {
        studentId: student._id.toString(),
        festId: student.festId,
        phone: student.phone,
        dob: student.dob,
        name: student.name,
        place: student.place,
        school: student.school,
        class: student.class,
        registeredAt: student.registeredAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}