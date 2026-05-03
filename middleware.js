import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request) {
  // const { pathname } = request.nextUrl;

  // // Skip middleware for API routes
  // if (pathname.startsWith('/api/')) {
  //   return NextResponse.next();
  // }

  // // Only protect admin routes
  // if (pathname.startsWith('/admin')) {
  //   // Allow login page access without token
  //   if (pathname === '/admin/login') {
  //     // If already has valid token, redirect to dashboard
  //     const token = request.cookies.get('admin_token')?.value;
      
  //     if (token) {
  //       try {
  //         const JWT_SECRET = process.env.JWT_SECRET || 'Gala2025';
  //         jwt.verify(token, JWT_SECRET);
  //         return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  //       } catch (error) {
  //         // Invalid token, let them access login page
  //       }
  //     }
      
  //     return NextResponse.next();
  //   }

  //   // For all other admin routes, check authentication
  //   const token = request.cookies.get('admin_token')?.value;

  //   if (!token) {
  //     return NextResponse.redirect(new URL('/admin/login', request.url));
  //   }

  //   try {
  //     const JWT_SECRET = process.env.JWT_SECRET || 'Gala2025';
  //     const decoded = jwt.verify(token, JWT_SECRET);
      
  //     // Token is valid, allow access
  //     return NextResponse.next();
  //   } catch (error) {
  //     // Token is invalid, redirect to login
  //     const response = NextResponse.redirect(new URL('/admin/login', request.url));
  //     // Clear the invalid cookie
  //     response.cookies.delete('admin_token');
  //     return response;
  //   }
  // }

  // return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
