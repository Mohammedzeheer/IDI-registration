'use client';
import AdminQRScanner from '../../../components/AdminQrScanner';
import { withAuth } from '../../../components/withAuth';

function DashboardPage() {
  return <AdminQRScanner />;
}

export default withAuth(DashboardPage);