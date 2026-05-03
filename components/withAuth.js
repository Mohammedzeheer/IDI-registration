import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function withAuth(Component) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      checkAuth();
    }, []);

    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('admin_user');
        console.log('User from localStorage:', user);
        
        if (!user) {
          router.push('/admin/login');
          return;
        }

        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('admin_user');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return isAuthenticated ? <Component {...props} /> : null;
  };
}