// components/NetworkStatusPanel.tsx
import { useEffect, useState } from 'react';
import { 
    ServerIcon, 
} from '@heroicons/react/24/outline';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface VLP {
    vlp: string;
    token_1: string;
    token_2: string;
}

interface NetworkStats {
    chainId: string;
    status: 'active' | 'congested' | 'down';
    currentRate: number;
    liquidityPools: number;
    historicalRates: Array<{
        timestamp: string;
        rate: number;
    }>;
}

export default function NetworkStatusPanel() {
    const [euclidStats, setEuclidStats] = useState<NetworkStats | null>(null);
    const [, setHistoricalRates] = useState<Array<{ timestamp: string; rate: number }>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let rateHistory: Array<{ timestamp: string; rate: number }> = [];

        const fetchNetworkStats = async () => {
            try {
                const query = `
                    query GetNetworkStatus {
                        router {
                            simulate_swap(
                                asset_in: "nibi",
                                amount_in: "1000000",
                                asset_out: "euclid",
                                min_amount_out: "1",
                                swaps: ["nibi", "euclid"]
                            ) {
                                amount_out
                            }
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

                const data = await response.json();

                if (data.errors) {
                    throw new Error(data.errors[0].message);
                }

                // Process real data from response
                const currentRate = parseFloat(data.data.router.simulate_swap.amount_out) / 1000000;
                const vlps: VLP[] = data.data.router.all_vlps.vlps;
                const activePools = vlps.filter(vlp => 
                    vlp.token_1 === "nibi" || vlp.token_2 === "nibi"
                ).length;

                // Update historical rates
                const newRate = {
                    timestamp: new Date().toLocaleTimeString(),
                    rate: currentRate
                };
                
                rateHistory = [...rateHistory, newRate].slice(-24); // Keep last 24 data points
                setHistoricalRates(rateHistory);

                setEuclidStats({
                    chainId: 'Euclid Protocol',
                    status: currentRate > 0 ? 'active' : 'down',
                    currentRate,
                    liquidityPools: activePools,
                    historicalRates: rateHistory
                });

            } catch (error) {
                console.error('Error fetching network stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNetworkStats();
        const interval = setInterval(fetchNetworkStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const NetworkCard = ({ stats }: { stats: NetworkStats }) => (
        <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-green-500/10 p-6">
            {/* Network Status Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <ServerIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-green-400">{stats.chainId}</h3>
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                                stats.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                            <span className="text-sm text-gray-400">
                                {stats.status === 'active' ? 'Operational' : 'Issues Detected'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Exchange Rate</div>
                    <div className="text-xl font-semibold text-green-400">
                        1 NIBI = {stats.currentRate.toFixed(6)} EUCL
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Active Pools</div>
                    <div className="text-xl font-semibold text-green-400">
                        {stats.liquidityPools}
                    </div>
                </div>
            </div>

            {/* Rate History Chart */}
            <div className="mb-6">
                <div className="text-sm text-gray-400 mb-2">Exchange Rate History</div>
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.historicalRates}>
                            <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#10B981" 
                                strokeWidth={2}
                                dot={false}
                            />
                            <XAxis 
                                dataKey="timestamp" 
                                stroke="#6B7280" 
                                fontSize={10}
                                tickLine={false}
                            />
                            <YAxis 
                                stroke="#6B7280" 
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: '0.5rem'
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center space-x-2 mb-6">
                <ServerIcon className="w-6 h-6 text-green-400" />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
                    Network Status
                </span>
            </h2>

            {isLoading ? (
                <div className="h-96 bg-black/20 rounded-xl animate-pulse" />
            ) : euclidStats ? (
                <NetworkCard stats={euclidStats} />
            ) : (
                <div className="text-center text-gray-400 py-8">
                    Unable to fetch network status
                </div>
            )}
        </div>
    );
}