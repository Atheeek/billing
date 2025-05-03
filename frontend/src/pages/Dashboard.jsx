import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import CreateInvoice from './CreateInvoice';
import ViewInvoices from './ViewInvoices';
import UpdateRates from './UpdateRates';

// Icons
const DollarSignIcon = () => <span className="text-green-500">💰</span>;
const ClockIcon = () => <span className="text-blue-500">🕒</span>;
const UsersIcon = () => <span className="text-purple-500">👥</span>;
const PlusCircleIcon = () => <span className="text-white">➕</span>;
const ListIcon = () => <span className="text-white">📄</span>;

const getTitle = (pathname) => {
  if (pathname.includes('/create')) return 'Create New Invoice';
  if (pathname.includes('/invoices')) return 'View All Invoices';
  if (pathname.includes('/rates')) return 'Update Product Rates';
  return 'Dashboard Overview';
};

const Dashboard = () => {
  const location = useLocation();
  const currentTitle = getTitle(location.pathname);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md p-4 px-6 z-10">
          <h1 className="text-2xl font-semibold text-gray-700">{currentTitle}</h1>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="create" element={<CreateInvoice />} />
            <Route path="invoices" element={<ViewInvoices />} />
            <Route path="rates" element={<UpdateRates />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardOverview = () => {
  const [invoices, setInvoices] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`);
        const data = await response.json(); // ✅ fixed line
        setInvoices(data);
        setTotalSales(data.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0));
        setPendingInvoices(data.filter(inv => !inv.paid).length);
        const uniqueCustomers = Array.from(new Set(data.map(inv => inv.customer?.phone)));
        setCustomers(uniqueCustomers);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
  
    fetchDashboardData();
  }, []);
  

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800 font-serif">Welcome Back!</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<DollarSignIcon />} label="Total Sales" value={`₹ ${totalSales.toFixed(2)}`} color="yellow" />
        <StatCard icon={<ClockIcon />} label="Pending Invoices" value={pendingInvoices} color="blue" />
        <StatCard icon={<UsersIcon />} label="Unique Customers" value={customers.length} color="purple" />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <QuickButton icon={<PlusCircleIcon />} label="Create New Invoice" link="/dashboard/create" color="yellow" />
          <QuickButton icon={<ListIcon />} label="View Recent Invoices" link="/dashboard/invoices" color="blue" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Recent Activity</h3>
        <ul className="space-y-2 text-gray-600 text-sm">
          {invoices.slice(0, 5).map((invoice) => (
            <li key={invoice._id}>
              Invoice <strong>{invoice.invoiceNumber}</strong> created for <strong>{invoice.customer?.name}</strong>
              {' '}— {new Date(invoice.date).toLocaleDateString('en-IN')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => {
  const bgMap = {
    yellow: 'bg-yellow-100',
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
  };
  const borderMap = {
    yellow: 'border-yellow-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${borderMap[color]} transform hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgMap[color]} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase">{label}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

const QuickButton = ({ icon, label, link, color }) => {
  const fromColor = {
    yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  }[color] || 'from-gray-500 to-gray-600';

  return (
    <a
      href={link}
      className={`flex items-center bg-gradient-to-r ${fromColor} text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-150 ease-in-out`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </a>
  );
};

export default Dashboard;
