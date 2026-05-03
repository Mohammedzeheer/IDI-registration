// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import dbConnect from "../../../../libs/mongoDB";
import Student from '../../../../models/Student';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { phone, dob } = await request.json();

    // Validation
    if (!phone || !dob) {
      return NextResponse.json(
        { success: false, message: 'Phone and date of birth are required' },
        { status: 400 }
      );
    }

    // Find student by phone and dob
    const student = await Student.findOne({ 
      phone,
      dob: new Date(dob)
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please check your phone number and date of birth.' },
        { status: 401 }
      );
    }

    // Return student data
    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      student: {
        studentId: student._id.toString(),
        festId: student.festId,
        phone: student.phone,
        name: student.name,
        place: student.place,
        school: student.school,
        class: student.class,
        profileCompleted: student.profileCompleted,
        registeredAt: student.registeredAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}