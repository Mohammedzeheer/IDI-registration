import { NextResponse } from 'next/server';
import Student from '../../../../models/Student';
import dbConnect from '../../../../libs/mongoDB';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    const school = searchParams.get('school');
    const studentClass = searchParams.get('class');
    const division = searchParams.get('division');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const search = searchParams.get('search') || '';

    // Build filter - ONLY checked-in students
    const filter = {
      checkedIn: true,
      profileCompleted: true
    };
    
    if (school) filter.school = school;
    if (studentClass) filter.class = studentClass;
    if (division) filter.division = division;
    
    // Search by name, phone, or festId
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { festId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination (sorted by check-in time, newest first)
    const [checkins, totalCount] = await Promise.all([
      Student.find(filter)
        .select('festId name phone class division school checkedInAt')
        .sort({ checkedInAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter)
    ]);

    // Get unique filter options (only from checked-in students)
    const [schools, classes, divisions] = await Promise.all([
      Student.distinct('school', { checkedIn: true, school: { $ne: null } }),
      Student.distinct('class', { checkedIn: true, class: { $ne: null } }),
      Student.distinct('division', { checkedIn: true, division: { $ne: null } })
    ]);

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      totalCheckedIn: totalCount,
      todayCheckedIn: await Student.countDocuments({
        checkedIn: true,
        checkedInAt: { $gte: today }
      })
    };

    return NextResponse.json({
      success: true,
      data: {
        checkins,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        filters: {
          schools: schools.sort(),
          classes: classes.sort(),
          divisions: divisions.sort()
        },
        stats
      }
    });

  } catch (error) {
    console.error('Check-ins API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}