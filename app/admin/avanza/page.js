'use client';
import AvanzaScanner from '../../../components/AvanzaScanner';
import { withAuth } from '../../../components/withAuth';

function AvanzaCheckinPage() {
  return <AvanzaScanner />;
}

export default withAuth(AvanzaCheckinPage);
