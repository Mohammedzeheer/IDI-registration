'use client';
import AdminDashboard from '../../../components/AdminDashboard';
import { withAuth } from '../../../components/withAuth';

function DashboardPage() {
  return <AdminDashboard />;
}

export default withAuth(DashboardPage);