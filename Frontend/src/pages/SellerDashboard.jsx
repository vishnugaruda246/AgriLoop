import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Trophy } from 'lucide-react';

const SellerDashboard = () => {
  const [kpis, setKpis] = useState({
    totalAmountSold: 0,
    totalWeightSold: 0,
    totalEmissionsPrevented: 0,
    totalTransactions: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    waste_type: '', 
    weight_kg: '', 
    price: '' 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const wasteTypes = [
    'Crop Residue',
    'Animal Waste',
    'Food Waste',
    'Organic Compost',
    'Biogas Material',
    'Agricultural Byproduct',
    'Green Waste'
  ];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    fetchItems();
    fetchOrders();
  }, [token, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/seller/dashboard', {
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

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/seller/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/seller/orders', {
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

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.waste_type || !newItem.weight_kg || !newItem.price) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newItem.name,
          waste_type: newItem.waste_type,
          weight_kg: parseFloat(newItem.weight_kg),
          price: parseFloat(newItem.price)
        })
      });

      if (!response.ok) throw new Error('Failed to add item');

      const addedItem = await response.json();
      setItems(prev => [addedItem, ...prev]);
      setShowModal(false);
      setNewItem({ name: '', waste_type: '', weight_kg: '', price: '' });
      setError('');
      toast.success('Item added successfully!');
    } catch (err) {
      toast.error('Failed to add item');
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`http://localhost:3000/api/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      // Refresh orders and dashboard data
      await fetchOrders();
      await fetchDashboardData();
      setShowOrderModal(false);
      setSelectedOrder(null);
      toast.success(`Order ${status.toLowerCase()} successfully!`);
    } catch (err) {
      toast.error('Failed to update order status');
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/seller/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete item');

      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete item');
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
        <h1 className="text-3xl font-bold text-green-700">AgriLoop Seller Dashboard</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/leaderboard')} 
            className="text-sm text-white bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg flex items-center"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard title="Total Revenue" value={`₹${kpis.totalAmountSold?.toLocaleString() || 0}`} />
        <KpiCard title="Total Weight Sold" value={`${kpis.totalWeightSold || 0} kg`} />
        <KpiCard title="CO₂ Prevented" value={`${Math.round(kpis.totalEmissionsPrevented || 0)} kg`} />
        <KpiCard title="Total Orders" value={kpis.totalTransactions || 0} />
        <KpiCard title="Pending Orders" value={kpis.pendingOrders || 0} color="yellow" />
        <KpiCard title="Completed Orders" value={kpis.completedOrders || 0} color="green" />
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Items for Sale</h2>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              + Add Item for Sale
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold">Item Name</th>
                <th className="text-left p-4 font-semibold">Waste Type</th>
                <th className="text-left p-4 font-semibold">Weight (kg)</th>
                <th className="text-left p-4 font-semibold">Price (₹)</th>
                <th className="text-left p-4 font-semibold">CO₂ Prevented (kg)</th>
                <th className="text-left p-4 font-semibold">Listed Date</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-500">
                    No items listed yet. Add your first item to get started!
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {item.waste_type}
                      </span>
                    </td>
                    <td className="p-4">{item.weight_kg}</td>
                    <td className="p-4">₹{item.price}</td>
                    <td className="p-4">{Math.round(item.emissions_prevented)}</td>
                    <td className="p-4">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                <th className="text-left p-4 font-semibold">Buyer</th>
                <th className="text-left p-4 font-semibold">Weight (kg)</th>
                <th className="text-left p-4 font-semibold">Amount (₹)</th>
                <th className="text-left p-4 font-semibold">Order Date</th>
                <th className="text-left p-4 font-semibold">Actions</th>
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
                    <td className="p-4">{order.buyer_name}</td>
                    <td className="p-4">{order.weight_kg}</td>
                    <td className="p-4">₹{order.amount_paid}</td>
                    <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'Rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
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
                <th className="text-left p-4 font-semibold">Buyer</th>
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
                    No previous orders yet.
                  </td>
                </tr>
              ) : (
                previousOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">#{order.id}</td>
                    <td className="p-4">{order.item_name}</td>
                    <td className="p-4">{order.buyer_name}</td>
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

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Item for Sale</h2>
            
            <input
              className="w-full mb-3 border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="Item Name (e.g., Rice Straw, Cow Manure)"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            />
            
            <select
              className="w-full mb-3 border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500"
              value={newItem.waste_type}
              onChange={e => setNewItem({ ...newItem, waste_type: e.target.value })}
            >
              <option value="">Select Waste Type</option>
              {wasteTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <input
              className="w-full mb-3 border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="Weight in kg"
              type="number"
              step="0.01"
              min="0"
              value={newItem.weight_kg}
              onChange={e => setNewItem({ ...newItem, weight_kg: e.target.value })}
            />
            
            <input
              className="w-full mb-4 border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="Price in ₹"
              type="number"
              step="0.01"
              min="0"
              value={newItem.price}
              onChange={e => setNewItem({ ...newItem, price: e.target.value })}
            />
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg" 
                onClick={() => {
                  setShowModal(false);
                  setNewItem({ name: '', waste_type: '', weight_kg: '', price: '' });
                  setError('');
                }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg" 
                onClick={handleAddItem}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, color = 'green' }) => {
  const colorClasses = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow text-center">
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
};

export default SellerDashboard;