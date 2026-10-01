import { NextResponse } from 'next/server';
import dbConnect from '../../../../../libs/mongoDB';
import AvanzaFeedback from '../../../../../models/AvanzaFeedback';
import { findDelegate } from '../../../../../models/Delegate';

// Has this pass already given feedback?
export async function POST(request) {
  try {
    await dbConnect();
    const { passId, phone } = await request.json();
    const delegate = await findDelegate(passId, phone);
    if (!delegate) {
      return NextResponse.json({ success: false, message: 'Pass not found' }, { status: 404 });
    }

    const submitted = await AvanzaFeedback.exists({ passId: delegate.passId });
    return NextResponse.json({ success: true, submitted: !!submitted });
  } catch (error) {
    console.error('Avanza feedback status error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
