import { NextResponse } from 'next/server';
import dbConnect from '../../../../libs/mongoDB';
import { findDelegate } from '../../../../models/Delegate';
import AvanzaFeedback from '../../../../models/AvanzaFeedback';
import { isAdmin } from '../../../../libs/adminAuth';

const fail = (message, status) => NextResponse.json({ success: false, message }, { status });

// Delegate: submit feedback (pass ID + mobile from the saved pass)
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const rating = Number(body.rating);
    const comment = (body.comment || '').trim().slice(0, 500);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return fail('Select a rating from 1 to 5', 400);
    }

    const delegate = await findDelegate(body.passId, body.phone);
    if (!delegate) return fail('Pass not found. Register or find your pass first.', 404);

    if (await AvanzaFeedback.exists({ passId: delegate.passId })) {
      return fail('You have already submitted feedback. Thank you!', 409);
    }

    await AvanzaFeedback.create({ delegate: delegate._id, passId: delegate.passId, rating, comment });

    return NextResponse.json({ success: true, message: 'Thank you for your feedback!' }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) return fail('You have already submitted feedback. Thank you!', 409);
    console.error('Avanza feedback error:', error);
    return fail('Internal server error', 500);
  }
}

// Admin: list all feedback with stats
export async function GET(request) {
  if (!isAdmin(request)) return fail('Unauthorized', 401);
  try {
    await dbConnect();

    const docs = await AvanzaFeedback.find()
      .populate('delegate', 'name sector unit designation')
      .sort({ createdAt: -1 })
      .lean();

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    docs.forEach(f => { distribution[f.rating]++; });
    const total = docs.length;
    const average = total ? docs.reduce((sum, f) => sum + f.rating, 0) / total : 0;

    return NextResponse.json({
      success: true,
      stats: { total, average, distribution },
      feedbacks: docs.map(f => ({
        passId: f.passId,
        name: f.delegate?.name || '',
        sector: f.delegate?.sector || '',
        unit: f.delegate?.unit || '',
        designation: f.delegate?.designation || '',
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    console.error('Avanza feedback list error:', error);
    return fail('Internal server error', 500);
  }
}
