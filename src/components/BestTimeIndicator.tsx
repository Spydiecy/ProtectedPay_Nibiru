'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface VLP {
    vlp: string;
    token_1: string;
    token_2: string;
}

interface PoolCondition {
    status: 'optimal' | 'moderate' | 'poor';
    exchangeRate: number;
    poolCount: number;
    lastUpdated: string;
}

export default function BestTimeIndicator() {
    const [poolCondition, setPoolCondition] = useState<PoolCondition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const checkPoolConditions = async () => {
            try {
                const query = `
                    query GetPoolConditions {
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
                    body: JSON.stringify({ query }),
                });

                const data = await response.json();

                if (data.errors) {
                    throw new Error(data.errors[0].message);
                }

                const exchangeRate =
                    parseFloat(data.data.router.simulate_swap.amount_out) / 1000000;
                const poolCount = data.data.router.all_vlps.vlps.filter(
                    (vlp: VLP) => vlp.token_1 === 'nibi' || vlp.token_2 === 'nibi',
                ).length;

                let status: 'optimal' | 'moderate' | 'poor';
                if (exchangeRate > 0.5 && poolCount >= 2) {
                    status = 'optimal';
                } else if (exchangeRate > 0.2 || poolCount >= 1) {
                    status = 'moderate';
                } else {
                    status = 'poor';
                }

                setPoolCondition({
                    status,
                    exchangeRate,
                    poolCount,
                    lastUpdated: new Date().toLocaleTimeString(),
                });
            } catch (error) {
                console.error('Error checking pool conditions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkPoolConditions();
        const interval = setInterval(checkPoolConditions, 30000);
        return () => clearInterval(interval);
    }, []);

    const getRecommendation = (condition: PoolCondition) => {
        switch (condition.status) {
            case 'optimal':
                return 'Great time to transfer! Good rates and multiple pools available.';
            case 'moderate':
                return 'Decent conditions. Consider your transfer size.';
            case 'poor':
                return 'Limited liquidity available. Consider waiting.';
        }
    };

    const getStatusIcon = (status: PoolCondition['status'], className?: string) => {
        switch (status) {
            case 'optimal':
                return <CheckCircleIcon className={`w-6 h-6 text-green-400 ${className}`} />;
            case 'moderate':
                return <ExclamationTriangleIcon className={`w-6 h-6 text-yellow-400 ${className}`} />;
            case 'poor':
                return <XCircleIcon className={`w-6 h-6 text-red-400 ${className}`} />;
        }
    };

    return (
        <motion.div 
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20 
            }}
        >
            <motion.div 
                className={`
                    cursor-pointer 
                    bg-black/80 
                    backdrop-blur-lg 
                    rounded-xl 
                    border 
                    border-gray-700 
                    shadow-2xl 
                    transition-all 
                    duration-500 
                    ease-in-out
                    overflow-hidden
                    ${isExpanded ? 'w-80 p-4' : 'w-14 h-14 p-2'}
                `}
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Collapsed State */}
                {!isExpanded && (
                    <div className="flex items-center justify-center h-full w-full">
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-green-400"></div>
                        ) : poolCondition ? (
                            getStatusIcon(poolCondition.status)
                        ) : (
                            <InformationCircleIcon className="w-6 h-6 text-gray-400" />
                        )}
                    </div>
                )}

                {/* Expanded State */}
                <AnimatePresence>
                    {isExpanded && poolCondition && (
                        <motion.div 
                            initial={{ 
                                opacity: 0, 
                                y: 10,
                                height: 0 
                            }}
                            animate={{ 
                                opacity: 1, 
                                y: 0,
                                height: 'auto'
                            }}
                            exit={{ 
                                opacity: 0, 
                                y: 10,
                                height: 0 
                            }}
                            transition={{
                                duration: 0.3,
                                type: 'tween'
                            }}
                            className="space-y-3 text-gray-200 relative"
                        >
                            {/* Subtle Close Indicator */}
                            <div 
                                className="absolute -top-2 right-0 w-8 h-1 bg-white/30 rounded-full opacity-50 hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                }}
                            />

                            {/* Status Header */}
                            <div className="flex items-center space-x-3 mt-2">
                                {getStatusIcon(poolCondition.status, "w-8 h-8")}
                                <span className="font-bold text-xl capitalize">
                                    {poolCondition.status} Conditions
                                </span>
                            </div>

                            {/* Recommendation */}
                            <p className="text-sm text-gray-300 truncate">
                                {getRecommendation(poolCondition)}
                            </p>

                            {/* Detailed Info */}
                            <div className="space-y-1 text-sm">
                                <div className="truncate">
                                    <strong>Exchange Rate:</strong>{' '}
                                    1 NIBI = {poolCondition.exchangeRate.toFixed(6)} EUCL
                                </div>
                                <div>
                                    <strong>Active Pools:</strong> {poolCondition.poolCount}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                    Last updated: {poolCondition.lastUpdated}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}