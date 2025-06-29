import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, Users, Leaf, TrendingUp, ArrowLeft, Globe } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Helper functions moved outside component
const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-500" />;
    default:
      return <span className="text-lg font-bold text-green-600">#{rank}</span>;
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
  const [greenProgress, setGreenProgress] = useState(0);
  const [earthRotation, setEarthRotation] = useState(0);
  const [liquidWave, setLiquidWave] = useState(0);
  const [bubbles, setBubbles] = useState([]);

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
    // Continuous earth rotation
    const rotationInterval = setInterval(() => {
      setEarthRotation(prev => (prev + 0.3) % 360);
    }, 100);

    // Liquid wave animation
    const waveInterval = setInterval(() => {
      setLiquidWave(prev => (prev + 2) % 360);
    }, 50);

    // Generate bubbles periodically
    const bubbleInterval = setInterval(() => {
      if (greenProgress > 10) {
        setBubbles(prev => [
          ...prev.slice(-8), // Keep only last 8 bubbles
          {
            id: Date.now(),
            x: 20 + Math.random() * 60,
            y: 100,
            size: 2 + Math.random() * 4,
            speed: 0.5 + Math.random() * 1
          }
        ]);
      }
    }, 800);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(waveInterval);
      clearInterval(bubbleInterval);
    };
  }, [greenProgress]);

  useEffect(() => {
    // Animate bubbles
    const animateBubbles = setInterval(() => {
      setBubbles(prev => prev.map(bubble => ({
        ...bubble,
        y: bubble.y - bubble.speed
      })).filter(bubble => bubble.y > -10));
    }, 50);

    return () => clearInterval(animateBubbles);
  }, []);

  useEffect(() => {
    // Start earth animation after data loads
    if (!loading && leaderboardData.platformStats.total_co2_prevented) {
      const totalCO2 = leaderboardData.platformStats.total_co2_prevented;
      const maxCO2ForAnimation = 10000; // Adjust based on expected values
      const targetProgress = Math.min((totalCO2 / maxCO2ForAnimation) * 100, 100);
      
      // Animate earth getting filled with green liquid
      const greenInterval = setInterval(() => {
        setGreenProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(greenInterval);
            return targetProgress;
          }
          return prev + 0.5;
        });
      }, 50);

      return () => {
        clearInterval(greenInterval);
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
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto relative">
              {/* White Earth with subtle rotation */}
              <div className="absolute inset-0 rounded-full bg-white border-4 border-gray-200 shadow-xl" style={{ transform: `rotate(${earthRotation}deg)` }}>
                {/* Continents outline */}
                <div className="absolute top-2 left-4 w-6 h-4 border-2 border-gray-300 rounded-full"></div>
                <div className="absolute bottom-3 right-3 w-4 h-6 border-2 border-gray-300 rounded-lg"></div>
                <div className="absolute top-8 right-6 w-3 h-3 border-2 border-gray-300 rounded-full"></div>
                
                {/* Green liquid starting to fill */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 via-green-300 to-green-200 rounded-full transition-all duration-1000"
                  style={{ height: '30%' }}
                ></div>
              </div>
              
              {/* Subtle glow */}
              <div className="absolute -inset-2 bg-green-100 rounded-full blur-md opacity-50"></div>
            </div>
          </div>
          <p className="text-gray-700 text-xl font-medium mb-4">🌍 Loading Earth Champions...</p>
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-3 mx-auto">
            <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full animate-pulse shadow-lg" style={{ width: '60%' }}></div>
          </div>
          <p className="text-gray-500 text-sm mt-2">Calculating environmental impact...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, #10b981 1px, transparent 1px),
                           radial-gradient(circle at 80% 80%, #3b82f6 1px, transparent 1px),
                           radial-gradient(circle at 40% 60%, #f59e0b 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="relative z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-green-600 hover:text-green-700 font-medium flex items-center transition-all transform hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Globe 
                    className="h-8 w-8 text-green-600" 
                    style={{ transform: `rotate(${earthRotation}deg)` }}
                  />
                  <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  🌍 Earth Champions Leaderboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/profile')} 
                className="text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-md"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Enhanced Earth Impact Visualization */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-200 relative overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-blue-50/30"></div>
          
          <h2 className="relative text-3xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center">
            <Globe 
              className="h-8 w-8 text-green-600 mr-3" 
              style={{ transform: `rotate(${earthRotation}deg)` }}
            />
            🌍 Our Planet's Healing Progress
          </h2>
          
          {/* Enhanced White Earth with Green Liquid Fill */}
          <div className="flex justify-center mb-8">
            <div className="relative w-80 h-80">
              {/* Outer glow */}
              <div className="absolute -inset-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-full blur-2xl opacity-30"></div>
              
              {/* Earth Container */}
              <div 
                className="absolute inset-0 rounded-full bg-white shadow-2xl overflow-hidden border-8 border-gray-100"
                style={{ transform: `rotate(${earthRotation}deg)` }}
              >
                {/* Continent outlines on white earth */}
                <div className="absolute top-12 left-16 w-20 h-16 border-4 border-gray-300 rounded-full opacity-60"></div>
                <div className="absolute top-20 right-12 w-16 h-20 border-4 border-gray-300 rounded-lg opacity-60"></div>
                <div className="absolute bottom-16 left-12 w-24 h-12 border-4 border-gray-300 rounded-full opacity-60"></div>
                <div className="absolute bottom-12 right-16 w-12 h-16 border-4 border-gray-300 rounded-full opacity-60"></div>
                <div className="absolute top-32 left-32 w-8 h-8 border-3 border-gray-300 rounded-full opacity-50"></div>
                <div className="absolute top-24 right-24 w-6 h-10 border-3 border-gray-300 rounded-lg opacity-50"></div>
                
                {/* Green liquid fill with wave effect */}
                <div 
                  className="absolute bottom-0 left-0 right-0 transition-all duration-3000 ease-out rounded-full overflow-hidden"
                  style={{ height: `${greenProgress}%` }}
                >
                  {/* Main green liquid */}
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500 via-green-400 to-green-300"></div>
                  
                  {/* Wave effect on top of liquid */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-green-300 to-transparent"
                    style={{
                      transform: `translateY(-4px)`,
                      clipPath: `polygon(0 ${50 + 20 * Math.sin(liquidWave * Math.PI / 180)}%, 
                                         25% ${50 + 15 * Math.sin((liquidWave + 90) * Math.PI / 180)}%, 
                                         50% ${50 + 20 * Math.sin((liquidWave + 180) * Math.PI / 180)}%, 
                                         75% ${50 + 15 * Math.sin((liquidWave + 270) * Math.PI / 180)}%, 
                                         100% ${50 + 20 * Math.sin((liquidWave + 360) * Math.PI / 180)}%, 
                                         100% 100%, 0 100%)`
                    }}
                  ></div>
                  
                  {/* Bubbles in the liquid */}
                  {bubbles.map(bubble => (
                    <div
                      key={bubble.id}
                      className="absolute bg-white/40 rounded-full animate-pulse"
                      style={{
                        left: `${bubble.x}%`,
                        bottom: `${bubble.y}%`,
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        transition: 'bottom 0.1s linear'
                      }}
                    />
                  ))}
                </div>
                
                {/* Sparkle effects when liquid is present */}
                {greenProgress > 20 && (
                  <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full animate-ping"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          bottom: `${Math.random() * greenProgress}%`,
                          width: `${2 + Math.random() * 3}px`,
                          height: `${2 + Math.random() * 3}px`,
                          backgroundColor: ['#10b981', '#34d399', '#6ee7b7'][Math.floor(Math.random() * 3)],
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: `${1.5 + Math.random() * 1}s`
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Liquid surface reflection */}
                {greenProgress > 5 && (
                  <div 
                    className="absolute left-0 right-0 h-4 bg-gradient-to-b from-white/30 to-transparent"
                    style={{ bottom: `${greenProgress - 2}%` }}
                  ></div>
                )}
              </div>
              
              {/* Orbital rings */}
              <div className="absolute inset-0 border-2 border-green-200 rounded-full animate-spin opacity-40" style={{ animationDuration: '20s' }}></div>
              <div className="absolute inset-4 border border-blue-200 rounded-full animate-spin opacity-30" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-8 border border-green-100 rounded-full animate-spin opacity-20" style={{ animationDuration: '25s' }}></div>
              
              {/* Subtle outer glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              title="Earth Guardians" 
              value={leaderboardData.platformStats.total_sellers || 0}
              icon="🌱"
              color="from-green-400 to-green-600"
              delay="0s"
            />
            <StatCard 
              title="Eco Warriors" 
              value={leaderboardData.platformStats.total_buyers || 0}
              icon="🛡️"
              color="from-blue-400 to-blue-600"
              delay="0.2s"
            />
            <StatCard 
              title="CO₂ Saved" 
              value={`${Math.round(leaderboardData.platformStats.total_co2_prevented || 0)} kg`}
              icon="🌍"
              color="from-green-500 to-emerald-600"
              delay="0.4s"
            />
            <StatCard 
              title="Green Missions" 
              value={leaderboardData.platformStats.total_completed_orders || 0}
              icon="✅"
              color="from-yellow-400 to-orange-500"
              delay="0.6s"
            />
            <StatCard 
              title="Impact Value" 
              value={`₹${(leaderboardData.platformStats.total_transaction_value || 0).toLocaleString()}`}
              icon="💚"
              color="from-purple-400 to-pink-500"
              delay="0.8s"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`flex-1 py-6 px-6 text-center font-bold text-lg transition-all relative ${
                  activeTab === 'sellers'
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-b-4 border-green-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="relative">🌱 Earth Guardians (Sellers)</span>
              </button>
              <button
                onClick={() => setActiveTab('buyers')}
                className={`flex-1 py-6 px-6 text-center font-bold text-lg transition-all relative ${
                  activeTab === 'buyers'
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-b-4 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="relative">🛡️ Eco Warriors (Buyers)</span>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'sellers' ? (
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-8 text-center">
                  🌱 Top Earth Guardians by CO₂ Prevention
                </h3>
                {leaderboardData.topSellers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">🌱</div>
                    <p className="text-gray-600 text-xl">No Earth Guardians yet - be the first!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {leaderboardData.topSellers.map((seller, index) => (
                      <LeaderboardCard
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
                        animationDelay={index * 0.15}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-8 text-center">
                  🛡️ Top Eco Warriors by CO₂ Offset
                </h3>
                {leaderboardData.topBuyers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">🛡️</div>
                    <p className="text-gray-600 text-xl">No Eco Warriors yet - join the fight!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {leaderboardData.topBuyers.map((buyer, index) => (
                      <LeaderboardCard
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
                        animationDelay={index * 0.15}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl shadow-xl p-8 text-center text-white relative overflow-hidden">
          <div className="relative">
            <div className="text-6xl mb-4 animate-bounce">🌍</div>
            <h3 className="text-3xl font-bold mb-4">
              Join the Earth's Defense Force!
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Every action counts in healing our planet. Start your environmental mission today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/marketplace')}
                className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all transform hover:scale-105 border border-white/30 shadow-lg"
              >
                🛒 Join Marketplace
              </button>
              <button 
                onClick={() => navigate('/impactcalculator')}
                className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105 backdrop-blur-sm shadow-lg"
              >
                📊 Calculate Impact
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), parseFloat(delay) * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${color} text-white text-center transform transition-all duration-1000 shadow-lg relative overflow-hidden ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
    } hover:scale-105 hover:shadow-xl`}>
      <div className="relative">
        <div className="text-3xl mb-2 animate-bounce" style={{ animationDelay: delay }}>{icon}</div>
        <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

const LeaderboardCard = ({ rank, user, primaryMetric, primaryLabel, secondaryMetrics, type, animationDelay }) => {
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
    <div className={`p-6 rounded-2xl border-2 transition-all duration-1000 transform relative overflow-hidden ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    } ${
      isTopThree 
        ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg shadow-yellow-200/50' 
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
    } hover:shadow-xl hover:scale-105`}>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Rank Badge */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(rank)} transform hover:scale-110 transition-transform relative overflow-hidden`}>
              <div className="text-center relative">
                <div className="text-lg">{getThemeEmoji(rank)}</div>
                {getRankIcon(rank)}
              </div>
            </div>
            
            {/* User Info */}
            <div>
              <h4 className="text-xl font-bold text-gray-800">{user.full_name}</h4>
              <p className="text-green-600">@{user.username}</p>
              <p className="text-xs text-gray-500">{type === 'seller' ? '🌱 Earth Guardian' : '🛡️ Eco Warrior'}</p>
            </div>
          </div>

          {/* Primary Metric */}
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">{primaryMetric}</div>
            <div className="text-sm text-gray-600">{primaryLabel}</div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {secondaryMetrics.map((metric, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
              <div className="text-lg font-bold text-gray-800">{metric.value}</div>
              <div className="text-xs text-gray-600">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Top 3 Special Badge */}
        {isTopThree && (
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold relative overflow-hidden ${
              rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-400/50' :
              rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/50' :
              'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-400/50'
            }`}>
              <span className="relative">
                {rank === 1 ? '👑 Planet Champion' : rank === 2 ? '🥈 Earth Protector' : '🥉 Green Hero'}
              </span>
            </span>
          </div>
        )}

        {/* Animated particles for top 3 */}
        {isTopThree && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  backgroundColor: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#f59e0b',
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;