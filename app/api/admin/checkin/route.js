import { NextResponse } from 'next/server';
import dbConnect from '../../../../libs/mongoDB';
import Student from '../../../../models/Student';

export async function POST(req) {
  try {
    await dbConnect();
    const { festId } = await req.json();
    let studentdata = await Student.findOne({ festId: festId });

    if (!studentdata) {
      return NextResponse.json(
        { success: false, message: 'studentdata not found' },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (studentdata.checkedIn) {
      return NextResponse.json(
        {
          success: false,
          message: `${studentdata.name} is already checked in!`,
          studentdata: studentdata
        },
        { status: 400 }
      );
    }

    studentdata.checkedIn = true;
    studentdata.checkedInAt = new Date();
    await studentdata.save();

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      student: {
        festId: studentdata.festId,
        name: studentdata.name,
        class: studentdata.class,
        division: studentdata.division,
        school: studentdata.school,
        phone: studentdata.phone
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during check-in' },
      { status: 500 }
    );
  }
}

