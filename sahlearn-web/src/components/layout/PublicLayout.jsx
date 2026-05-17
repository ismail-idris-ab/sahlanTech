import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppFAB from '../common/WhatsAppFAB';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
