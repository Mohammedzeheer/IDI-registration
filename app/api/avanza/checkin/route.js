import { NextResponse } from 'next/server';
import dbConnect from '../../../../libs/mongoDB';
import Delegate, { toPublicDelegate } from '../../../../models/Delegate';
import { isAdmin } from '../../../../libs/adminAuth';

const unauthorized = () => NextResponse.json(
  { success: false, message: 'Unauthorized' },
  { status: 401 }
);

// List delegates with check-in stats
export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    await dbConnect();

    const delegates = await Delegate.find().sort({ checkedInAt: -1, createdAt: -1 }).lean();
    const checkedIn = delegates.filter(d => d.checkedIn).length;

    return NextResponse.json({
      success: true,
      stats: { total: delegates.length, checkedIn, pending: delegates.length - checkedIn },
      delegates: delegates.map(toPublicDelegate)
    });
  } catch (error) {
    console.error('Avanza list error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Check in by pass ID (from QR) or mobile number (manual entry)
export async function POST(request) {
  if (!isAdmin(request)) return unauthorized();
  try {
    await dbConnect();

    const { code } = await request.json();
    const value = (code || '').trim().toUpperCase();
    if (!value) {
      return NextResponse.json(
        { success: false, status: 'invalid', message: 'No code provided' },
        { status: 400 }
      );
    }

    const digits = value.replace(/\D/g, '');
    const query = value.startsWith('AVZ')
      ? { passId: value }
      : { phone: digits.slice(-10) };

    const delegate = await Delegate.findOne(query);
    if (!delegate) {
      return NextResponse.json(
        { success: false, status: 'invalid', message: 'Pass not found' },
        { status: 404 }
      );
    }

    if (delegate.checkedIn) {
      return NextResponse.json({
        success: false,
        status: 'duplicate',
        message: 'Already checked in',
        delegate: toPublicDelegate(delegate)
      }, { status: 409 });
    }

    delegate.checkedIn = true;
    delegate.checkedInAt = new Date();
    await delegate.save();

    return NextResponse.json({
      success: true,
      status: 'ok',
      message: 'Checked in',
      delegate: toPublicDelegate(delegate)
    });
  } catch (error) {
    console.error('Avanza check-in error:', error);
    return NextResponse.json(
      { success: false, status: 'invalid', message: 'Server error during check-in' },
      { status: 500 }
    );
  }
}
