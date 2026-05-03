import { NextResponse } from 'next/server';
import Student from '../../../../models/Student';
import dbConnect from '../../../../libs/mongoDB';


export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const school = searchParams.get('school');
    const studentClass = searchParams.get('class');
    const division = searchParams.get('division');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '2000');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'registeredAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter object
    const filter = {};
    
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
    
    // Sort object
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with pagination
    const [students, totalCount] = await Promise.all([
      Student.find(filter)
        .select('-__v')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter)
    ]);

    // Get unique filter options for dropdowns
    const [schools, classes, divisions] = await Promise.all([
      Student.distinct('school', { school: { $ne: null } }),
      Student.distinct('class', { class: { $ne: null } }),
      Student.distinct('division', { division: { $ne: null } })
    ]);

    // Calculate statistics
    const stats = {
      totalStudents: totalCount,
      completedProfiles: await Student.countDocuments({ ...filter, profileCompleted: true }),
      incompleteProfiles: await Student.countDocuments({ ...filter, profileCompleted: false })
    };

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasMore: skip + students.length < totalCount
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
    console.error('Admin API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
