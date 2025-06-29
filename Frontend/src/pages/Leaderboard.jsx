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
  const [earthRotation, setEarthRotation] = useState(0);
  const [atmosphereGlow, setAtmosphereGlow] = useState(0);

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
      setEarthRotation(prev => (prev + 0.5) % 360);
    }, 100);

    // Atmosphere glow animation
    const glowInterval = setInterval(() => {
      setAtmosphereGlow(prev => (prev + 1) % 100);
    }, 50);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(glowInterval);
    };
  }, []);

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
          return prev - 1;
        });
      }, 80);

      // Animate earth getting greener
      const greenInterval = setInterval(() => {
        setGreenProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(greenInterval);
            return targetProgress;
          }
          return prev + 0.5;
        });
      }, 50);

      // Overall animation progress
      const progressInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 0.3;
        });
      }, 100);

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated cosmic background */}
        <div className="absolute inset-0">
          {/* Nebula clouds */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-green-600/20 animate-pulse"></div>
          
          {/* Twinkling stars */}
          {[...Array(200)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 4}s`
              }}
            />
          ))}
          
          {/* Shooting stars */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`shooting-${i}`}
              className="absolute w-1 h-20 bg-gradient-to-b from-white to-transparent opacity-70 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto relative">
              {/* Earth with rotation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 animate-spin shadow-2xl" style={{ animationDuration: '4s' }}>
                <div className="absolute top-2 left-4 w-6 h-4 bg-green-500 rounded-full opacity-80"></div>
                <div className="absolute bottom-3 right-3 w-4 h-6 bg-green-500 rounded-lg opacity-80"></div>
                <div className="absolute top-8 right-6 w-3 h-3 bg-green-500 rounded-full opacity-80"></div>
              </div>
              {/* Atmosphere glow */}
              <div className="absolute -inset-2 bg-blue-400/30 rounded-full blur-md animate-pulse"></div>
              <div className="absolute -inset-4 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
          </div>
          <p className="text-white text-xl font-medium mb-4">🌍 Scanning Earth's Champions...</p>
          <div className="mt-4 w-64 bg-blue-900/50 rounded-full h-3 mx-auto backdrop-blur-sm border border-blue-400/30">
            <div className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full animate-pulse shadow-lg" style={{ width: '60%' }}></div>
          </div>
          <p className="text-blue-300 text-sm mt-2">Loading environmental impact data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Space Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        {/* Nebula layers */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-blue-600/10 to-green-600/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-pink-600/5 via-indigo-600/5 to-cyan-600/5" style={{ animationDelay: '1s' }}></div>
        
        {/* Animated star field */}
        {[...Array(300)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${3 + Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.7
            }}
          />
        ))}
        
        {/* Constellation patterns */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`constellation-${i}`}
            className="absolute w-1 h-1 bg-blue-300 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* Floating cosmic particles */}
        {[...Array(50)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full animate-bounce opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
        
        {/* Shooting stars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`shooting-star-${i}`}
            className="absolute opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `shootingStar ${5 + Math.random() * 5}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          >
            <div className="w-1 h-16 bg-gradient-to-b from-white via-blue-300 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Fog overlay that clears */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-gray-800/60 via-gray-600/40 to-transparent transition-opacity duration-2000"
        style={{ opacity: fogOpacity / 100 }}
      />
      
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-cyan-400/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center transition-all transform hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-cyan-400/50"></div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Globe 
                    className="h-8 w-8 text-cyan-400 animate-spin" 
                    style={{ 
                      animationDuration: '8s',
                      filter: `hue-rotate(${atmosphereGlow * 3.6}deg)`
                    }} 
                  />
                  <div className="absolute inset-0 bg-cyan-400/30 rounded-full animate-ping"></div>
                  <div className="absolute -inset-1 bg-green-400/20 rounded-full animate-pulse"></div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                  🌍 Earth Champions Leaderboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/profile')} 
                className="text-sm text-white bg-gradient-to-r from-green-600/80 to-blue-600/80 hover:from-green-600 hover:to-blue-600 px-4 py-2 rounded-lg backdrop-blur-sm transition-all transform hover:scale-105 border border-white/20"
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

        {/* Enhanced Earth Impact Visualization */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-cyan-400/30 relative overflow-hidden">
          {/* Background cosmic effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-green-600/10 animate-pulse"></div>
          
          <h2 className="relative text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
            <Globe 
              className="h-8 w-8 text-cyan-400 mr-3" 
              style={{ 
                transform: `rotate(${earthRotation}deg)`,
                filter: `hue-rotate(${atmosphereGlow * 2}deg)`
              }} 
            />
            🌍 Our Planet's Healing Progress
          </h2>
          
          {/* Enhanced Earth Visualization */}
          <div className="flex justify-center mb-8">
            <div className="relative w-80 h-80">
              {/* Outer space glow */}
              <div className="absolute -inset-8 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-2xl animate-pulse"></div>
              
              {/* Earth Base */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl overflow-hidden border-4 border-cyan-400/30"
                style={{ transform: `rotate(${earthRotation}deg)` }}
              >
                {/* Enhanced Continents with more detail */}
                <div className="absolute top-12 left-16 w-20 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full opacity-90 transform rotate-12 shadow-lg"></div>
                <div className="absolute top-20 right-12 w-16 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-lg opacity-90 transform -rotate-6 shadow-lg"></div>
                <div className="absolute bottom-16 left-12 w-24 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full opacity-90 shadow-lg"></div>
                <div className="absolute bottom-12 right-16 w-12 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full opacity-90 shadow-lg"></div>
                <div className="absolute top-32 left-32 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full opacity-80"></div>
                <div className="absolute top-24 right-24 w-6 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg opacity-80"></div>
                
                {/* Ocean currents */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full"></div>
                
                {/* Green growth overlay with gradient */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-400 via-green-300 to-green-200 opacity-80 transition-all duration-3000 ease-out rounded-full"
                  style={{ height: `${greenProgress}%` }}
                ></div>
                
                {/* Enhanced sparkle effects */}
                {greenProgress > 20 && (
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full animate-ping"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          width: `${2 + Math.random() * 4}px`,
                          height: `${2 + Math.random() * 4}px`,
                          backgroundColor: ['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 4)],
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: `${1 + Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Cloud formations */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-8 left-8 w-16 h-8 bg-white rounded-full blur-sm animate-pulse"></div>
                  <div className="absolute top-16 right-20 w-12 h-6 bg-white rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-20 left-20 w-20 h-10 bg-white rounded-full blur-sm animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
              </div>
              
              {/* Enhanced orbital rings */}
              <div className="absolute inset-0 border-2 border-cyan-300/50 rounded-full animate-spin opacity-60" style={{ animationDuration: '20s' }}></div>
              <div className="absolute inset-4 border border-blue-300/50 rounded-full animate-spin opacity-40" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-8 border border-green-300/30 rounded-full animate-spin opacity-30" style={{ animationDuration: '25s' }}></div>
              
              {/* Enhanced atmosphere glow */}
              <div 
                className="absolute -inset-6 bg-gradient-to-br from-cyan-400/30 to-green-400/30 rounded-full blur-xl animate-pulse"
                style={{ filter: `hue-rotate(${atmosphereGlow * 2}deg)` }}
              ></div>
              <div 
                className="absolute -inset-4 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-lg animate-pulse"
                style={{ animationDelay: '1s' }}
              ></div>
            </div>
          </div>

          {/* Enhanced Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <EarthStatCard 
              title="Earth Guardians" 
              value={leaderboardData.platformStats.total_sellers || 0}
              icon="🌱"
              color="from-green-500 to-green-700"
              delay="0s"
            />
            <EarthStatCard 
              title="Eco Warriors" 
              value={leaderboardData.platformStats.total_buyers || 0}
              icon="🛡️"
              color="from-blue-500 to-blue-700"
              delay="0.2s"
            />
            <EarthStatCard 
              title="CO₂ Saved" 
              value={`${Math.round(leaderboardData.platformStats.total_co2_prevented || 0)} kg`}
              icon="🌍"
              color="from-green-400 to-emerald-600"
              delay="0.4s"
            />
            <EarthStatCard 
              title="Green Missions" 
              value={leaderboardData.platformStats.total_completed_orders || 0}
              icon="✅"
              color="from-yellow-500 to-orange-600"
              delay="0.6s"
            />
            <EarthStatCard 
              title="Impact Value" 
              value={`₹${(leaderboardData.platformStats.total_transaction_value || 0).toLocaleString()}`}
              icon="💚"
              color="from-purple-500 to-pink-600"
              delay="0.8s"
            />
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-cyan-400/30">
          <div className="border-b border-cyan-400/30">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`flex-1 py-6 px-6 text-center font-bold text-lg transition-all relative overflow-hidden ${
                  activeTab === 'sellers'
                    ? 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-300 border-b-4 border-green-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {activeTab === 'sellers' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-600/10 animate-pulse"></div>
                )}
                <span className="relative">🌱 Earth Guardians (Sellers)</span>
              </button>
              <button
                onClick={() => setActiveTab('buyers')}
                className={`flex-1 py-6 px-6 text-center font-bold text-lg transition-all relative overflow-hidden ${
                  activeTab === 'buyers'
                    ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-300 border-b-4 border-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {activeTab === 'buyers' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 animate-pulse"></div>
                )}
                <span className="relative">🛡️ Eco Warriors (Buyers)</span>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'sellers' ? (
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-8 text-center">
                  🌱 Top Earth Guardians by CO₂ Prevention
                </h3>
                {leaderboardData.topSellers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">🌱</div>
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
                        animationDelay={index * 0.15}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8 text-center">
                  🛡️ Top Eco Warriors by CO₂ Offset
                </h3>
                {leaderboardData.topBuyers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 animate-bounce">🛡️</div>
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
                        animationDelay={index * 0.15}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-green-600/80 via-blue-600/80 to-purple-600/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center text-white border border-cyan-400/30 relative overflow-hidden">
          {/* Background cosmic effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10 animate-pulse"></div>
          
          <div className="relative">
            <div className="text-6xl mb-4 animate-bounce">🌍</div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
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

      {/* Custom CSS for shooting star animation */}
      <style jsx>{`
        @keyframes shootingStar {
          0% {
            transform: translateX(-100px) translateY(-100px) rotate(45deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100vw) translateY(100vh) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const EarthStatCard = ({ title, value, icon, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), parseFloat(delay) * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${color} text-white text-center transform transition-all duration-1000 shadow-lg backdrop-blur-sm border border-white/20 relative overflow-hidden ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
    } hover:scale-105 hover:shadow-xl`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
      
      <div className="relative">
        <div className="text-3xl mb-2 animate-bounce" style={{ animationDelay: delay }}>{icon}</div>
        <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
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
    <div className={`p-6 rounded-2xl border-2 transition-all duration-1000 transform relative overflow-hidden ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    } ${
      isTopThree 
        ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 shadow-lg shadow-yellow-400/20' 
        : 'border-cyan-400/30 bg-black/30 hover:border-cyan-400/50 hover:bg-black/40'
    } backdrop-blur-xl hover:shadow-xl hover:scale-105`}>
      
      {/* Background cosmic effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-green-600/5 animate-pulse"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Enhanced Rank Badge */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(rank)} transform hover:scale-110 transition-transform relative overflow-hidden`}>
              {/* Badge glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse"></div>
              <div className="text-center relative">
                <div className="text-lg">{getThemeEmoji(rank)}</div>
                {getRankIcon(rank)}
              </div>
            </div>
            
            {/* User Info */}
            <div>
              <h4 className="text-xl font-bold text-white">{user.full_name}</h4>
              <p className="text-cyan-300">@{user.username}</p>
              <p className="text-xs text-gray-400">{type === 'seller' ? '🌱 Earth Guardian' : '🛡️ Eco Warrior'}</p>
            </div>
          </div>

          {/* Primary Metric */}
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">{primaryMetric}</div>
            <div className="text-sm text-gray-300">{primaryLabel}</div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {secondaryMetrics.map((metric, index) => (
            <div key={index} className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              <div className="text-lg font-bold text-white">{metric.value}</div>
              <div className="text-xs text-gray-300">{metric.label}</div>
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
              {/* Badge glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
              <span className="relative">
                {rank === 1 ? '👑 Planet Champion' : rank === 2 ? '🥈 Earth Protector' : '🥉 Green Hero'}
              </span>
            </span>
          </div>
        )}

        {/* Enhanced animated particles for top 3 */}
        {isTopThree && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(8)].map((_, i) => (
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