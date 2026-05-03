import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Server misconfiguration' },
        { status: 500 }
      );
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({
      success: true,
      user: {
        username: decoded.username,
        role: decoded.role
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
}
