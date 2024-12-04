import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Fungsi untuk mengambil data OHLC
const fetchOHLC = async () => {
  const from = Math.floor(Date.now() / 1000) - 24 * 60 * 60; // 24 hours ago
  const to = Math.floor(Date.now() / 1000); // now
  const symbol = 'btcidr';
  const tf = '1'; // 1 second time frame
  const url = `https://indodax.com/tradingview/history_v2?from=${from}&symbol=${symbol}&tf=${tf}&to=${to}`;

  // console.log("Fetching data from URL:", url);  // Log URL untuk memastikan API yang benar dipanggil

  try {
    const response = await fetch(url);
    const data = await response.json();

    // console.log("Fetched data:", data);  // Log data yang diterima dari API

    if (!data || data.length === 0) {
      console.warn('No data available from API');
      return { currentPrice: 0, changePercent: 0 };
    }

    const currentPrice = parseFloat(data[data.length - 1].Close);
    const previousPrice = parseFloat(data[0].Close);

    if (isNaN(currentPrice) || isNaN(previousPrice)) {
      console.error('Invalid price data:', { currentPrice, previousPrice });
      return { currentPrice: 0, changePercent: 0 };
    }

    const changePercent =
      ((currentPrice - previousPrice) / previousPrice) * 100;

    // console.log("Current Price:", currentPrice);  // Log harga saat ini
    // console.log("Previous Price:", previousPrice);  // Log harga sebelumnya
    // console.log("Price Change Percentage:", changePercent);  // Log persentase perubahan harga

    return { currentPrice, changePercent };
  } catch (error) {
    console.error('Error fetching OHLC data:', error);
    return { currentPrice: 0, changePercent: 0 };
  }
};

// Komponen utama untuk menampilkan harga Bitcoin
const BitcoinPrice = () => {
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    const updatePrice = async () => {
      // console.log("Fetching new price data...");

      const { currentPrice, changePercent } = await fetchOHLC();
      // console.log("Received data:", { currentPrice, changePercent });

      // Pastikan harga yang diterima valid
      if (currentPrice > 0 && changePercent !== undefined) {
        // console.log("Updating state with:", { currentPrice, changePercent });
        setPrice(currentPrice);
        setChange(changePercent);
      } else {
        console.error('Invalid price data:', { currentPrice, changePercent });
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, 1000);

    return () => {
      clearInterval(interval); // Hentikan interval saat komponen dibersihkan
      console.log('Interval cleared');
    };
  }, []);

  // console.log("Rendering price:", price);  // Log harga yang sedang di-render
  // console.log("Rendering change:", change);  // Log perubahan harga yang sedang di-render

  return (
    <div className="mb-3 justify-items-center text-xs">
      {price === 0 ? (
        <p className="text-xs">Memuat harga Bitcoin...</p>
      ) : (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div id="btc">
                  {price.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs text-inherit">
                  Harga Bitcoin saat ini (sumber data: Indodax)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div>
            <span
              id="price-change"
              className={`text-center  ${
                change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}
            </span>{' '}
            <span className="text-muted-foreground">24 jam</span>
          </div>
        </>
      )}
    </div>
  );
};

export default BitcoinPrice;
