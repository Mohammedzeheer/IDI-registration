import { NextResponse } from 'next/server';
import Student from '../../../../models/Student';
import dbConnect from '../../../../libs/mongoDB';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const division = searchParams.get('division');
    const query = {};

    // Make sure field name matches DB
    if (division) query.division = division;  // <--- change to divisionName if needed

    const students = await Student.find(query).lean();

    return NextResponse.json({
      success: true,
      data: { students }
    });

  } catch (error) {
    console.error("Subadmin API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}



// import { NextResponse } from 'next/server';
// import Student from '../../../../models/Student';
// import dbConnect from '../../../../libs/mongoDB';

// export async function GET(req) {
//   await dbConnect();
//   const { searchParams } = new URL(req.url);
//   console.log(searchParams)
//   const division = searchParams.get('division');
  
//   const query = {};
//   if (division) query.division = division;

//   const students = await Student.find(query);
//   return NextResponse.json({
//     success: true,
//     data: { students }
//   });
// }
