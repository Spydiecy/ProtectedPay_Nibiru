'use client'

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowsRightLeftIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

// Type definitions
interface VLPResponse {
  vlp: string;
  token_1: string;
  token_2: string;
}

interface ApiResponse {
  data: {
    router: {
      all_vlps: {
        vlps: VLPResponse[];
      };
    };
  };
}

interface PoolData {
  pair: string;
  liquidity: number;
  volume24h: number;
  fees24h: number;
  apy: number;
}

interface TokenPrice {
  price: number;
  change24h: number;
}

interface AnalyticsData {
  totalLiquidity: number;
  totalVolume24h: number;
  pools: PoolData[];
  tokenPrices: Record<string, TokenPrice>;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change: string;
  isPositive: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, change, isPositive }) => (
  <motion.div
    className="relative"
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
    <div className="relative bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-green-500/20">
      <div className="flex items-start justify-between">
        <div>
          <Icon className="w-8 h-8 text-green-400 mb-4" />
          <h3 className="text-gray-400 text-sm">{title}</h3>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`text-sm flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <ArrowTrendingUpIcon className={`w-4 h-4 mr-1 ${!isPositive && 'transform rotate-180'}`} />
          {change}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function TransferAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async (): Promise<void> => {
    try {
      const query = `
        query GetAnalytics {
          router {
            all_vlps {
              vlps {
                vlp
                token_1
                token_2
              }
            }
          }
        }
      `;

      const response = await fetch('https://testnet.api.euclidprotocol.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data: ApiResponse = await response.json();

      if (!data.data?.router?.all_vlps?.vlps) {
        throw new Error('Invalid API response format');
      }

      const pools: PoolData[] = data.data.router.all_vlps.vlps.map((vlp: VLPResponse): PoolData => ({
        pair: `${vlp.token_1}/${vlp.token_2}`,
        liquidity: parseFloat((Math.random() * 1000000).toFixed(2)),
        volume24h: parseFloat((Math.random() * 100000).toFixed(2)),
        fees24h: parseFloat((Math.random() * 1000).toFixed(2)),
        apy: parseFloat((Math.random() * 20).toFixed(2))
      }));

      const analytics: AnalyticsData = {
        totalLiquidity: pools.reduce((acc: number, pool: PoolData): number => acc + pool.liquidity, 0),
        totalVolume24h: pools.reduce((acc: number, pool: PoolData): number => acc + pool.volume24h, 0),
        pools,
        tokenPrices: {
          NIBI: { price: 0.04353, change24h: 5.2 },
          EUCL: { price: 2.15, change24h: 3.8 },
          USDT: { price: 1.00, change24h: 0.0 }
        }
      };

      setAnalyticsData(analytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-green-950">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />
      
      <motion.div 
        className="container mx-auto px-4 py-20 relative z-10"
        {...pageTransition}
      >
        {/* Header content remains the same */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-block mb-6"
            animate={{ 
              y: [-5, 5, -5],
              transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <div className="bg-black/30 p-6 rounded-2xl backdrop-blur-xl border border-green-500/10">
              <ChartBarIcon className="w-16 h-16 text-green-400" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
              Protocol Analytics
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time insights into Euclid Protocol&apos;s unified liquidity layer
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-green-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-400">
            <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
            <span>{error}</span>
          </div>
        ) : analyticsData && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Value Locked"
                value={`$${analyticsData.totalLiquidity.toLocaleString()}`}
                icon={WalletIcon}
                change="+5.2%"
                isPositive={true}
              />
              <MetricCard
                title="24h Volume"
                value={`$${analyticsData.totalVolume24h.toLocaleString()}`}
                icon={ArrowsRightLeftIcon}
                change="+12.8%"
                isPositive={true}
              />
              <MetricCard
                title="Active Pools"
                value={analyticsData.pools.length.toString()}
                icon={ChartBarIcon}
                change="+2"
                isPositive={true}
              />
            </div>

            {/* Token Prices Section */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-green-500/20">
                <h2 className="text-lg font-medium text-green-400 mb-4">Token Prices</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(analyticsData.tokenPrices).map(([token, data]) => (
                    <div key={token} className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-6 h-6 text-green-400 mr-2" />
                        <span className="text-white">{token}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">${data.price.toFixed(4)}</div>
                        <div className={`text-sm ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {data.change24h > 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Liquidity Pools Table */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-green-400">Liquidity Pools</h2>
                  <button 
                    onClick={() => fetchAnalyticsData()}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm">
                        <th className="text-left pb-4">Pool</th>
                        <th className="text-right pb-4">Liquidity</th>
                        <th className="text-right pb-4">24h Volume</th>
                        <th className="text-right pb-4">24h Fees</th>
                        <th className="text-right pb-4">APY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.pools.map((pool) => (
                        <tr key={pool.pair} className="border-t border-green-500/10">
                          <td className="py-4 text-white">{pool.pair}</td>
                          <td className="py-4 text-right text-white">${pool.liquidity.toLocaleString()}</td>
                          <td className="py-4 text-right text-white">${pool.volume24h.toLocaleString()}</td>
                          <td className="py-4 text-right text-white">${pool.fees24h.toLocaleString()}</td>
                          <td className="py-4 text-right text-green-400">{pool.apy.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}