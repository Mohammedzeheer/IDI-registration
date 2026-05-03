import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME ;
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    const isPasswordValid = ADMIN_PASSWORD_HASH
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        username,
        role: 'admin'
      }
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const response = NextResponse.json({
    success: true,
    message: 'Logout successful'
  });
  response.cookies.delete('admin_token');
  return response;
}