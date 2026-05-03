// app/api/auth/register/route.js
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

    // Check if student already exists
    const existingStudent = await Student.findOne({ phone });
    
    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: 'Student with this phone number is already registered' },
        { status: 409 }
      );
    }

    // Create new student
    const student = await Student.create({
      phone,
      dob: new Date(dob)
    });

    return NextResponse.json({
      success: true,
      studentId: student._id.toString(),
      message: 'Registration successful! Please complete your profile.'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}