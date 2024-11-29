import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface TokenPrice {
  displayAmount: number;
  exchangeRate: number;
  lastUpdated: Date;
}

interface PriceData {
  usdt: TokenPrice;
  eucl: TokenPrice;
}

interface EuclidPriceInfoProps {
  amount: string;
  onPriceUpdate?: (prices: PriceData) => void;
}

export default function EuclidPriceInfo({ amount, onPriceUpdate }: EuclidPriceInfoProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrice = useCallback(async (outputToken: string) => {
    const query = `
      query GetPrice {
        router {
          simulate_swap(
            asset_in: "nibi"
            amount_in: "${(parseFloat(amount) * 1000000).toString()}"
            asset_out: "${outputToken}"
            min_amount_out: "1"
            swaps: ["nibi", "${outputToken}"]
          ) {
            amount_out
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

    const rawAmount = data.data?.router?.simulate_swap?.amount_out;
    if (!rawAmount) {
      throw new Error(`Failed to get price for ${outputToken}`);
    }

    const displayAmount = parseFloat(rawAmount) / 1000000;
    return {
      displayAmount,
      exchangeRate: displayAmount / parseFloat(amount),
      lastUpdated: new Date()
    };
  }, [amount]);

  const updatePrices = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const [usdtPrice, euclPrice] = await Promise.all([
        fetchPrice('usdt'),
        fetchPrice('euclid')
      ]);

      const newPriceData = {
        usdt: usdtPrice,
        eucl: euclPrice
      };

      setPriceData(newPriceData);
      setLastUpdated(new Date());
      onPriceUpdate?.(newPriceData);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Unable to fetch current prices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [amount, fetchPrice, onPriceUpdate]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      updatePrices();
    }, 500);

    const updateInterval = setInterval(() => {
      updatePrices();
    }, 30000);

    return () => {
      clearTimeout(debounceTimeout);
      clearInterval(updateInterval);
    };
  }, [amount, updatePrices]);

  if (!amount || parseFloat(amount) <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl blur-xl" />
        <div className="relative bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Price Information</span>
            </div>
            {!isLoading && !error && (
              <button 
                onClick={updatePrices}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Fetching latest prices...</span>
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : priceData ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">NIBI Amount:</span>
                  <span className="text-white">{parseFloat(amount).toFixed(6)} NIBI</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">USD Value:</span>
                  <span className="text-white">${priceData.usdt.displayAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">EUCL Value:</span>
                  <span className="text-white">{priceData.eucl.displayAmount.toFixed(6)} EUCL</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-green-500/10">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-400">
                    <p>Real-time prices via Euclid Protocol</p>
                    {lastUpdated && (
                      <p className="mt-1">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Enter an amount to see price information
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
