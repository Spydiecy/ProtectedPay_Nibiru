

export const fetchEuclidPrice = async (amount: string) => {
    // Convert the amount to base units (assuming 6 decimals for NIBI)
    const amountInBaseUnits = (parseFloat(amount) * 1000000).toString();
  
    const query = `
      query Router($assetIn: String!, $amountIn: String!, $assetOut: String!, $minAmountOut: String!, $swaps: [String!]) {
        router {
          simulate_swap(
            asset_in: $assetIn,
            amount_in: $amountIn,
            asset_out: $assetOut,
            min_amount_out: $minAmountOut,
            swaps: $swaps
          ) {
            amount_out
            asset_out
          }
        }
      }
    `;
  
    try {
      const response = await fetch('https://testnet.api.euclidprotocol.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            assetIn: "nibi",
            amountIn: amountInBaseUnits, // Now using the actual amount
            assetOut: "euclid",
            minAmountOut: "1",
            swaps: ["nibi", "euclid"]
          }
        })
      });
  
      const data = await response.json();
      console.log('Euclid API Response:', data); // For debugging
      return data.data.router.simulate_swap;
    } catch (error) {
      console.error('Error fetching Euclid price:', error);
      return null;
    }
  };