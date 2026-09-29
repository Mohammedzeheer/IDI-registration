import { NextResponse } from 'next/server';
import dbConnect from '../../../../libs/mongoDB';
import Delegate, { toPublicDelegate } from '../../../../models/Delegate';

// Look up an existing pass by mobile number
export async function POST(request) {
  try {
    await dbConnect();

    const { phone: rawPhone } = await request.json();
    const phone = (rawPhone || '').replace(/\D/g, '').slice(-10);

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const delegate = await Delegate.findOne({ phone });
    if (!delegate) {
      return NextResponse.json(
        { success: false, message: 'No registration found for this number' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, delegate: toPublicDelegate(delegate) });

  } catch (error) {
    console.error('Avanza pass lookup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
