import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Users, Leaf, TrendingUp, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Helper functions moved outside component
const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  }
};

const getRankBadgeColor = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    case 3:
      return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState({
    topSellers: [],
    topBuyers: [],
    platformStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sellers');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLeaderboardData();
  }, [token, navigate]);

  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');
      
      const data = await response.json();
      setLeaderboardData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load leaderboard data');
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-green-600 hover:text-green-700 font-medium flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-900">AgriLoop Leaderboard</h1>
              </div>
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

        {/* Platform Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
            Platform Impact Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              title="Total Sellers" 
              value={leaderboardData.platformStats.total_sellers || 0}
              icon={<Users className="h-6 w-6 text-blue-600" />}
              color="blue"
            />
            <StatCard 
              title="Total Buyers" 
              value={leaderboardData.platformStats.total_buyers || 0}
              icon={<Users className="h-6 w-6 text-purple-600" />}
              color="purple"
            />
            <StatCard 
              title="CO₂ Prevented" 
              value={`${Math.round(leaderboardData.platformStats.total_co2_prevented || 0)} kg`}
              icon={<Leaf className="h-6 w-6 text-green-600" />}
              color="green"
            />
            <StatCard 
              title="Completed Orders" 
              value={leaderboardData.platformStats.total_completed_orders || 0}
              icon={<Award className="h-6 w-6 text-yellow-600" />}
              color="yellow"
            />
            <StatCard 
              title="Total Value" 
              value={`₹${(leaderboardData.platformStats.total_transaction_value || 0).toLocaleString()}`}
              icon={<TrendingUp className="h-6 w-6 text-indigo-600" />}
              color="indigo"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'sellers'
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏆 Top Sellers (CO₂ Prevented)
              </button>
              <button
                onClick={() => setActiveTab('buyers')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'buyers'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏆 Top Buyers (CO₂ Offset)
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'sellers' ? (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Top Sellers by Environmental Impact
                </h3>
                {leaderboardData.topSellers.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No sellers data available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboardData.topSellers.map((seller, index) => (
                      <LeaderboardCard
                        key={seller.id}
                        rank={index + 1}
                        user={seller}
                        primaryMetric={Math.round(seller.total_co2_prevented)}
                        primaryLabel="kg CO₂ Prevented"
                        secondaryMetrics={[
                          { label: 'Revenue', value: `₹${seller.total_revenue.toLocaleString()}` },
                          { label: 'Orders', value: seller.completed_orders },
                          { label: 'City', value: seller.city || 'N/A' }
                        ]}
                        type="seller"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Top Buyers by Environmental Impact
                </h3>
                {leaderboardData.topBuyers.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No buyers data available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboardData.topBuyers.map((buyer, index) => (
                      <LeaderboardCard
                        key={buyer.id}
                        rank={index + 1}
                        user={buyer}
                        primaryMetric={Math.round(buyer.total_co2_offset)}
                        primaryLabel="kg CO₂ Offset"
                        secondaryMetrics={[
                          { label: 'Spent', value: `₹${buyer.total_spent.toLocaleString()}` },
                          { label: 'Purchases', value: buyer.completed_purchases },
                          { label: 'City', value: buyer.city || 'N/A' }
                        ]}
                        type="buyer"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Join the Environmental Champions!</h3>
          <p className="text-lg mb-6 opacity-90">
            Start trading organic waste today and climb the leaderboard while making a positive impact on the environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Marketplace
            </button>
            <button 
              onClick={() => navigate('/impactcalculator')}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Calculate Your Impact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    indigo: 'bg-indigo-50 border-indigo-200'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const LeaderboardCard = ({ rank, user, primaryMetric, primaryLabel, secondaryMetrics, type }) => {
  const isTopThree = rank <= 3;
  
  return (
    <div className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
      isTopThree 
        ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Rank Badge */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(rank)}`}>
            {getRankIcon(rank)}
          </div>
          
          {/* User Info */}
          <div>
            <h4 className="text-lg font-bold text-gray-900">{user.full_name}</h4>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>
        </div>

        {/* Primary Metric */}
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{primaryMetric}</div>
          <div className="text-sm text-gray-600">{primaryLabel}</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {secondaryMetrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium text-gray-900">{metric.value}</div>
            <div className="text-xs text-gray-500">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Top 3 Special Badge */}
      {isTopThree && (
        <div className="mt-4 text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            rank === 1 ? 'bg-yellow-100 text-yellow-800' :
            rank === 2 ? 'bg-gray-100 text-gray-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {rank === 1 ? '🥇 Champion' : rank === 2 ? '🥈 Runner-up' : '🥉 Third Place'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;