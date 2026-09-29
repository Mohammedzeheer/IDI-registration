import { NextResponse } from 'next/server';
import dbConnect from '../../../../libs/mongoDB';
import Delegate, { DESIGNATIONS, toPublicDelegate } from '../../../../models/Delegate';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const name = (body.name || '').trim();
    const unit = (body.unit || '').trim();
    const designation = body.designation;
    const phone = (body.phone || '').replace(/\D/g, '').slice(-10);

    if (!name || !unit || !designation || !phone) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    if (!DESIGNATIONS.includes(designation)) {
      return NextResponse.json(
        { success: false, message: 'Invalid designation' },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const existing = await Delegate.findOne({ phone });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'This mobile number is already registered. Use "Find my pass".' },
        { status: 409 }
      );
    }

    const delegate = await Delegate.create({ name, unit, designation, phone });

    return NextResponse.json({
      success: true,
      message: 'Registration successful!',
      delegate: toPublicDelegate(delegate)
    }, { status: 201 });

  } catch (error) {
    console.error('Avanza registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
