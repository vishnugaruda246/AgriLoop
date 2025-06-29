import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Users, Leaf, TrendingUp, ArrowLeft, Globe } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Helper functions moved outside component
const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-400" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-300" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-500" />;
    default:
      return <span className="text-lg font-bold text-green-200">#{rank}</span>;
  }
};

const getRankBadgeColor = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-400/50';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/50';
    case 3:
      return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-400/50';
    default:
      return 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg shadow-green-400/30';
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
  const [animationProgress, setAnimationProgress] = useState(0);
  const [fogOpacity, setFogOpacity] = useState(100);
  const [greenProgress, setGreenProgress] = useState(0);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLeaderboardData();
  }, [token, navigate]);

  useEffect(() => {
    // Start earth animation after data loads
    if (!loading && leaderboardData.platformStats.total_co2_prevented) {
      const totalCO2 = leaderboardData.platformStats.total_co2_prevented;
      const maxCO2ForAnimation = 10000; // Adjust based on expected values
      const targetProgress = Math.min((totalCO2 / maxCO2ForAnimation) * 100, 100);
      
      // Animate fog clearing
      const fogInterval = setInterval(() => {
        setFogOpacity(prev => {
          if (prev <= 0) {
            clearInterval(fogInterval);
            return 0;
          }
          return prev - 2;
        });
      }, 50);

      // Animate earth getting greener
      const greenInterval = setInterval(() => {
        setGreenProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(greenInterval);
            return targetProgress;
          }
          return prev + 1;
        });
      }, 30);

      // Overall animation progress
      const progressInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 0.5;
        });
      }, 50);

      return () => {
        clearInterval(fogInterval);
        clearInterval(greenInterval);
        clearInterval(progressInterval);
      };
    }
  }, [loading, leaderboardData.platformStats.total_co2_prevented]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="text-center z-10">
          <div className="relative mb-8">
            <Globe className="h-16 w-16 text-blue-400 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 bg-green-400 rounded-full opacity-30 animate-ping"></div>
          </div>
          <p className="text-white text-xl font-medium">Loading Earth's Champions...</p>
          <div className="mt-4 w-64 bg-blue-800 rounded-full h-2 mx-auto">
            <div className="bg-green-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-900 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars */}
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-green-400 rounded-full opacity-60 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Fog overlay that clears */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-gray-600 to-transparent transition-opacity duration-1000"
        style={{ opacity: fogOpacity / 100 }}
      />
      
      {/* Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-md border-b border-green-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-green-400 hover:text-green-300 font-medium flex items-center transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-green-400/50"></div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Globe className="h-8 w-8 text-green-400 animate-pulse" />
                  <div className="absolute inset-0 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                </div>
                <h1 className="text-2xl font-bold text-white">🌍 Earth Champions Leaderboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/profile')} 
                className="text-sm text-white bg-green-600/80 hover:bg-green-600 px-4 py-2 rounded-lg backdrop-blur-sm transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Earth Impact Visualization */}
        <div className="bg-black/30 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-8 border border-green-400/30">
          <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
            <Globe className="h-8 w-8 text-green-400 mr-3 animate-spin" style={{ animationDuration: '10s' }} />
            🌍 Our Planet's Healing Progress
          </h2>
          
          {/* Earth Visualization */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              {/* Earth Base */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl overflow-hidden">
                {/* Continents */}
                <div className="absolute top-8 left-12 w-16 h-12 bg-green-600 rounded-full opacity-80 transform rotate-12"></div>
                <div className="absolute top-16 right-8 w-12 h-16 bg-green-600 rounded-lg opacity-80 transform -rotate-6"></div>
                <div className="absolute bottom-12 left-8 w-20 h-8 bg-green-600 rounded-full opacity-80"></div>
                <div className="absolute bottom-8 right-12 w-8 h-12 bg-green-600 rounded-full opacity-80"></div>
                
                {/* Green growth overlay */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 to-green-300 opacity-70 transition-all duration-2000 ease-out"
                  style={{ height: `${greenProgress}%` }}
                ></div>
                
                {/* Sparkle effects */}
                {greenProgress > 20 && (
                  <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          animationDelay: `${i * 0.3}s`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Orbital rings */}
              <div className="absolute inset-0 border-2 border-green-300/50 rounded-full animate-spin opacity-60" style={{ animationDuration: '20s' }}></div>
              <div className="absolute inset-4 border border-blue-300/50 rounded-full animate-spin opacity-40" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
              
              {/* Atmosphere glow */}
              <div className="absolute -inset-4 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <EarthStatCard 
              title="Earth Guardians" 
              value={leaderboardData.platformStats.total_sellers || 0}
              icon="🌱"
              color="from-green-500 to-green-700"
            />
            <EarthStatCard 
              title="Eco Warriors" 
              value={leaderboardData.platformStats.total_buyers || 0}
              icon="🛡️"
              color="from-blue-500 to-blue-700"
            />
            <EarthStatCard 
              title="CO₂ Saved" 
              value={`${Math.round(leaderboardData.platformStats.total_co2_prevented || 0)} kg`}
              icon="🌍"
              color="from-green-400 to-emerald-600"
            />
            <EarthStatCard 
              title="Green Missions" 
              value={leaderboardData.platformStats.total_completed_orders || 0}
              icon="✅"
              color="from-yellow-500 to-orange-600"
            />
            <EarthStatCard 
              title="Impact Value" 
              value={`₹${(leaderboardData.platformStats.total_transaction_value || 0).toLocaleString()}`}
              icon="💚"
              color="from-purple-500 to-pink-600"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-black/30 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-green-400/30">
          <div className="border-b border-green-400/30">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`flex-1 py-6 px-6 text-center font-bold text-lg transition-all ${
                  activeTab === 'sellers'
                    ? 'bg-green-500/30 text-green-300 border-b-4 border-green-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🌱 Earth Guardians (Sellers)
              </button>
              <button
                onClick={() => setActiveTab('buyers')}
                className={`flex-1 py-6 px-6 text-center font-bold text-lg transition-all ${
                  activeTab === 'buyers'
                    ? 'bg-blue-500/30 text-blue-300 border-b-4 border-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                🛡️ Eco Warriors (Buyers)
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'sellers' ? (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                  🌱 Top Earth Guardians by CO₂ Prevention
                </h3>
                {leaderboardData.topSellers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🌱</div>
                    <p className="text-gray-300 text-xl">No Earth Guardians yet - be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {leaderboardData.topSellers.map((seller, index) => (
                      <EarthLeaderboardCard
                        key={seller.id}
                        rank={index + 1}
                        user={seller}
                        primaryMetric={Math.round(seller.total_co2_prevented)}
                        primaryLabel="kg CO₂ Prevented"
                        secondaryMetrics={[
                          { label: 'Revenue', value: `₹${seller.total_revenue.toLocaleString()}` },
                          { label: 'Missions', value: seller.completed_orders },
                          { label: 'Location', value: seller.city || 'Earth' }
                        ]}
                        type="seller"
                        animationDelay={index * 0.1}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                  🛡️ Top Eco Warriors by CO₂ Offset
                </h3>
                {leaderboardData.topBuyers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛡️</div>
                    <p className="text-gray-300 text-xl">No Eco Warriors yet - join the fight!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {leaderboardData.topBuyers.map((buyer, index) => (
                      <EarthLeaderboardCard
                        key={buyer.id}
                        rank={index + 1}
                        user={buyer}
                        primaryMetric={Math.round(buyer.total_co2_offset)}
                        primaryLabel="kg CO₂ Offset"
                        secondaryMetrics={[
                          { label: 'Investment', value: `₹${buyer.total_spent.toLocaleString()}` },
                          { label: 'Purchases', value: buyer.completed_purchases },
                          { label: 'Location', value: buyer.city || 'Earth' }
                        ]}
                        type="buyer"
                        animationDelay={index * 0.1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-600/80 to-blue-600/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center text-white border border-green-400/30">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-3xl font-bold mb-4">Join the Earth's Defense Force!</h3>
          <p className="text-xl mb-8 opacity-90">
            Every action counts in healing our planet. Start your environmental mission today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all transform hover:scale-105 border border-white/30"
            >
              🛒 Join Marketplace
            </button>
            <button 
              onClick={() => navigate('/impactcalculator')}
              className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105 backdrop-blur-sm"
            >
              📊 Calculate Impact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EarthStatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${color} text-white text-center transform hover:scale-105 transition-all shadow-lg backdrop-blur-sm border border-white/20`}>
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

const EarthLeaderboardCard = ({ rank, user, primaryMetric, primaryLabel, secondaryMetrics, type, animationDelay }) => {
  const isTopThree = rank <= 3;
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay * 1000);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const getThemeEmoji = (rank) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return type === 'seller' ? '🌱' : '🛡️';
    }
  };
  
  return (
    <div className={`p-6 rounded-2xl border-2 transition-all duration-1000 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    } ${
      isTopThree 
        ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 shadow-lg shadow-yellow-400/20' 
        : 'border-green-400/30 bg-black/20 hover:border-green-400/50 hover:bg-black/30'
    } backdrop-blur-md hover:shadow-xl hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Rank Badge */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(rank)} transform hover:scale-110 transition-transform`}>
            <div className="text-center">
              <div className="text-lg">{getThemeEmoji(rank)}</div>
              {getRankIcon(rank)}
            </div>
          </div>
          
          {/* User Info */}
          <div>
            <h4 className="text-xl font-bold text-white">{user.full_name}</h4>
            <p className="text-green-300">@{user.username}</p>
            <p className="text-xs text-gray-400">{type === 'seller' ? '🌱 Earth Guardian' : '🛡️ Eco Warrior'}</p>
          </div>
        </div>

        {/* Primary Metric */}
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">{primaryMetric}</div>
          <div className="text-sm text-gray-300">{primaryLabel}</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {secondaryMetrics.map((metric, index) => (
          <div key={index} className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-lg font-bold text-white">{metric.value}</div>
            <div className="text-xs text-gray-300">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Top 3 Special Badge */}
      {isTopThree && (
        <div className="mt-4 text-center">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
            rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-400/50' :
            rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/50' :
            'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-400/50'
          }`}>
            {rank === 1 ? '👑 Planet Champion' : rank === 2 ? '🥈 Earth Protector' : '🥉 Green Hero'}
          </span>
        </div>
      )}

      {/* Animated particles for top 3 */}
      {isTopThree && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;