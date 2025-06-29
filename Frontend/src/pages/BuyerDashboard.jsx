import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const BuyerDashboard = () => {
  const [kpis, setKpis] = useState({
    totalAmountSpent: 0,
    totalWeightPurchased: 0,
    totalEmissionsOffset: 0,
    totalTransactions: 0,
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    fetchOrders();
  }, [token, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/buyer/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setKpis(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/buyer/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load orders');
      setLoading(false);
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Accepted': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'Pending');
  const previousOrders = orders.filter(order => order.status !== 'Pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">AgriLoop Buyer Dashboard</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/marketplace')} 
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Go to Marketplace
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            className="text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            Profile
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }} 
            className="text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total Amount Spent" value={`₹${kpis.totalAmountSpent?.toLocaleString() || 0}`} />
        <KpiCard title="Total Weight Purchased" value={`${kpis.totalWeightPurchased || 0} kg`} />
        <KpiCard title="Emissions Offset" value={`${Math.round(kpis.totalEmissionsOffset || 0)} kg CO₂`} />
        <KpiCard title="Total Transactions" value={kpis.totalTransactions || 0} />
      </div>

      {/* Pending Orders Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Pending Orders</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold">Order ID</th>
                <th className="text-left p-4 font-semibold">Item</th>
                <th className="text-left p-4 font-semibold">Seller</th>
                <th className="text-left p-4 font-semibold">Weight (kg)</th>
                <th className="text-left p-4 font-semibold">Amount (₹)</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Order Date</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-500">
                    No pending orders at the moment.
                  </td>
                </tr>
              ) : (
                pendingOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">#{order.id}</td>
                    <td className="p-4">{order.item_name}</td>
                    <td className="p-4">{order.seller_name}</td>
                    <td className="p-4">{order.weight_kg}</td>
                    <td className="p-4">₹{order.amount_paid}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Previous Orders Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Previous Orders</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold">Order ID</th>
                <th className="text-left p-4 font-semibold">Item</th>
                <th className="text-left p-4 font-semibold">Seller</th>
                <th className="text-left p-4 font-semibold">Weight (kg)</th>
                <th className="text-left p-4 font-semibold">Amount (₹)</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Order Date</th>
              </tr>
            </thead>
            <tbody>
              {previousOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-500">
                    No previous orders yet. Visit the marketplace to start buying!
                  </td>
                </tr>
              ) : (
                previousOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">#{order.id}</td>
                    <td className="p-4">{order.item_name}</td>
                    <td className="p-4">{order.seller_name}</td>
                    <td className="p-4">{order.weight_kg}</td>
                    <td className="p-4">₹{order.amount_paid}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow text-center">
    <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
    <p className="text-xl font-bold text-green-700">{value}</p>
  </div>
);

export default BuyerDashboard;