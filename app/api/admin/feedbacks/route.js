// /api/admin/feedbacks/route.js
import dbConnect from '../../../../libs/mongoDB';
import Feedback from '../../../../models/Feedback';
import Student from '../../../../models/Student';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');

    // Build query
    const query = {};
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    // For search, we need to populate student data
    let feedbackQuery = Feedback.find(query)
      .populate('studentId', 'name festId phone school class division')
      .sort({ givenAt: -1 });

    // Get all for filtering by name/festId if search exists
    let allFeedbacksForSearch = [];
    if (search) {
      allFeedbacksForSearch = await Feedback.find(query)
        .populate('studentId', 'name festId')
        .lean();
      
      const filteredIds = allFeedbacksForSearch
        .filter(f => 
          f.festId.toLowerCase().includes(search.toLowerCase()) ||
          f.studentId?.name?.toLowerCase().includes(search.toLowerCase())
        )
        .map(f => f._id);
      
      feedbackQuery = Feedback.find({ _id: { $in: filteredIds } })
        .populate('studentId', 'name festId phone school class division')
        .sort({ givenAt: -1 });
    }

    // Get total count for pagination
    const totalCount = search 
      ? allFeedbacksForSearch.filter(f => 
          f.festId.toLowerCase().includes(search.toLowerCase()) ||
          f.studentId?.name?.toLowerCase().includes(search.toLowerCase())
        ).length
      : await Feedback.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated feedbacks
    const feedbacks = await feedbackQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Format feedbacks for frontend
    const formattedFeedbacks = feedbacks.map(feedback => ({
      _id: feedback._id,
      festId: feedback.festId,
      studentName: feedback.studentId?.name || 'N/A',
      rating: feedback.rating,
      comment: feedback.comment,
      submittedAt: feedback.givenAt,
      studentInfo: {
        phone: feedback.studentId?.phone,
        school: feedback.studentId?.school,
        class: feedback.studentId?.class,
        division: feedback.studentId?.division
      }
    }));

    // Calculate stats
    const allFeedbacks = await Feedback.find({}).lean();
    const totalFeedbacks = allFeedbacks.length;
    
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    let totalRating = 0;
    allFeedbacks.forEach(feedback => {
      ratingDistribution[feedback.rating]++;
      totalRating += feedback.rating;
    });

    const averageRating = totalFeedbacks > 0 ? totalRating / totalFeedbacks : 0;

    return Response.json({
      success: true,
      data: {
        feedbacks: formattedFeedbacks,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        },
        stats: {
          totalFeedbacks,
          averageRating,
          ratingDistribution
        }
      }
    });

  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch feedbacks' },
      { status: 500 }
    );
  }
}
