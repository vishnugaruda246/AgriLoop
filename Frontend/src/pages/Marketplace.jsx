import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { ShoppingCart, Leaf, User, MapPin, Calendar } from 'lucide-react';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const wasteTypes = [
    'All',
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
    fetchMarketplaceItems();
  }, [token, navigate]);

  const fetchMarketplaceItems = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/marketplace', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch marketplace items');
      
      const data = await response.json();
      setItems(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load marketplace items');
      setLoading(false);
      console.error(err);
    }
  };

  const handlePurchase = async (itemId) => {
    if (!window.confirm('Are you sure you want to purchase this item?')) return;

    try {
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ item_id: itemId })
      });

      if (!response.ok) throw new Error('Failed to create order');

      toast.success('Order placed successfully! The seller will review your request.');
      // Optionally refresh the items or navigate to orders page
      navigate('/dashboard/buyer');
    } catch (err) {
      toast.error('Failed to place order');
      console.error(err);
    }
  };

  const filteredAndSortedItems = items
    .filter(item => selectedWasteType === '' || selectedWasteType === 'All' || item.waste_type === selectedWasteType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'weight-high':
          return b.weight_kg - a.weight_kg;
        case 'weight-low':
          return a.weight_kg - b.weight_kg;
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard/buyer')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">AgriLoop Marketplace</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/profile')} 
                className="text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Waste Type</label>
                <select
                  value={selectedWasteType}
                  onChange={(e) => setSelectedWasteType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {wasteTypes.map(type => (
                    <option key={type} value={type === 'All' ? '' : type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="weight-high">Weight: High to Low</option>
                  <option value="weight-low">Weight: Low to High</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {filteredAndSortedItems.length} items available
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
            <p className="text-gray-600">
              {selectedWasteType ? 'Try adjusting your filters or check back later.' : 'Check back later for new listings.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.waste_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">₹{item.price}</div>
                      <div className="text-sm text-gray-500">{item.weight_kg} kg</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Leaf className="h-4 w-4 mr-2 text-green-500" />
                      <span>{Math.round(item.emissions_prevented)} kg CO₂ prevented</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Seller: {item.seller_name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Listed: {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(item.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;