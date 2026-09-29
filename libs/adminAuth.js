import jwt from 'jsonwebtoken';

// Returns true when the request carries a valid admin_token cookie
export function isAdmin(request) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
