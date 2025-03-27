// Global variables
        let allCoins = [];
        let currentCoin = null;
        let priceChart = null;
        let currentTimeRange = '7d';
        let activeIndicators = ['ema', 'macd', 'rsi'];
        let isPremiumUser = false;
        let apiRetryCount = 0;
        const maxRetries = 3;
        let bingoCard = [];
        let markedBingoSquares = [];
        let assistantActive = false;
        let currentCoinData = null;
        let currentChartData = null;
        
        // DOM elements
        const coinListElement = document.getElementById('coinList');
        const coinDetailElement = document.getElementById('coinDetail');
        const searchInput = document.getElementById('searchInput');
        const suggestionsSection = document.getElementById('suggestionsSection');
        const suggestionsList = document.getElementById('suggestionsList');
        const premiumModal = document.getElementById('premiumModal');
        const closeModal = document.getElementById('closeModal');
        const assistantButton = document.getElementById('assistantButton');
        const assistantModal = document.getElementById('assistantModal');
        const assistantMessages = document.getElementById('assistantMessages');
        const assistantInput = document.getElementById('assistantInput');
        const sendMessageButton = document.getElementById('sendMessage');
        const voiceButton = document.getElementById('voiceButton');
        const weatherDescription = document.getElementById('weatherDescription');
        const realityCheckText = document.getElementById('realityCheckText');
        const tarotImage = document.getElementById('tarotImage');
        const tarotMeaning = document.getElementById('tarotMeaning');
        const memeScoreFill = document.getElementById('memeScoreFill');
        const memeScoreValue = document.getElementById('memeScoreValue');
        const memeImpact = document.getElementById('memeImpact');
        const bingoCardElement = document.getElementById('bingoCard');
        const bingoProgressBar = document.getElementById('bingoProgressBar');
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            console.log("Initializing app...");
            fetchTopCryptocurrencies();
            
            // Setup search functionality with debounce
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const searchTerm = e.target.value.toLowerCase();
                    const filteredCoins = allCoins.filter(coin => 
                        coin.name.toLowerCase().includes(searchTerm) || 
                        coin.symbol.toLowerCase().includes(searchTerm)
                    );
                    displayCoinList(filteredCoins);
                }, 300);
            });
            
            // Premium modal handlers
            closeModal.addEventListener('click', () => {
                premiumModal.classList.remove('active');
            });
            
            // Close modal when clicking outside
            premiumModal.addEventListener('click', (e) => {
                if (e.target === premiumModal) {
                    premiumModal.classList.remove('active');
                }
            });
            
            // AI Assistant handlers
            assistantButton.addEventListener('click', toggleAssistant);
            sendMessageButton.addEventListener('click', sendAssistantMessage);
            assistantInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendAssistantMessage();
                }
            });
            voiceButton.addEventListener('click', toggleVoiceRecognition);
            
            // Initialize gamification features
            initializeBingoCard();
            generateCryptoWeather();
            generateRealityCheck();
            drawTarotCard();
            analyzeMemeImpact();
        });

// Enhanced fetch function with retry logic and CORS proxy for development
async function fetchWithRetry(url, options = {}, retries = 3) {
    // Check if we should use mock data (for development)
    if (useMockData) {
        return getMockData(url);
    }
    
    try {
        // Use a CORS proxy for development environments
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const fetchUrl = url.startsWith('http') ? `${proxyUrl}${url}` : url;
        
        // Add necessary headers to avoid rate limiting
        const fetchOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        const response = await fetch(fetchUrl, fetchOptions);
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
            if (retries > 0) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                const waitTime = Math.min(Math.pow(2, maxRetries - retries) * 1000, retryAfter * 1000);
                console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry... ${retries} attempts left`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return fetchWithRetry(url, options, retries - 1);
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            const waitTime = Math.pow(2, maxRetries - retries) * 1000;
            console.log(`Retrying... ${retries} attempts left. Waiting ${waitTime/1000} seconds.`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return fetchWithRetry(url, options, retries - 1);
        } else {
            console.error('Fetch failed completely:', error);
            // Fall back to mock data when all fetch attempts fail
            console.log('Falling back to mock data');
            return getMockData(url);
        }
    }
}

// Set this to true for development to avoid API calls completely
const useMockData = true;

// Get mock data based on the endpoint
function getMockData(url) {
    console.log(`Using mock data for: ${url}`);
    
    // Mock data for top cryptocurrencies
    if (url.includes('/markets')) {
        return mockTopCoins;
    }
    
    // Mock data for individual coin details
    if (url.includes('/coins/') && !url.includes('market_chart')) {
        const coinId = url.split('/coins/')[1].split('?')[0];
        return mockCoinDetails(coinId);
    }
    
    // Mock data for price charts
    if (url.includes('market_chart')) {
        return mockMarketChart();
    }
    
    // Default mock data
    return {};
}

// Mock data for top 10 cryptocurrencies
const mockTopCoins = [
    {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        current_price: 52341.23,
        market_cap: 1025463582330,
        market_cap_rank: 1,
        price_change_percentage_24h: 2.34
    },
    {
        id: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        current_price: 2834.56,
        market_cap: 341236589012,
        market_cap_rank: 2,
        price_change_percentage_24h: 1.45
    },
    {
        id: "tether",
        symbol: "usdt",
        name: "Tether",
        image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
        current_price: 1.00,
        market_cap: 95826741258,
        market_cap_rank: 3,
        price_change_percentage_24h: 0.01
    },
    {
        id: "binancecoin",
        symbol: "bnb",
        name: "BNB",
        image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
        current_price: 567.89,
        market_cap: 87654321098,
        market_cap_rank: 4,
        price_change_percentage_24h: -0.75
    },
    {
        id: "ripple",
        symbol: "xrp",
        name: "XRP",
        image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
        current_price: 0.58,
        market_cap: 29876543210,
        market_cap_rank: 5,
        price_change_percentage_24h: 3.21
    },
    {
        id: "cardano",
        symbol: "ada",
        name: "Cardano",
        image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
        current_price: 0.43,
        market_cap: 15123456789,
        market_cap_rank: 6,
        price_change_percentage_24h: -1.23
    },
    {
        id: "solana",
        symbol: "sol",
        name: "Solana",
        image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
        current_price: 102.35,
        market_cap: 43218765432,
        market_cap_rank: 7,
        price_change_percentage_24h: 5.67
    },
    {
        id: "polkadot",
        symbol: "dot",
        name: "Polkadot",
        image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
        current_price: 6.78,
        market_cap: 7865432109,
        market_cap_rank: 8,
        price_change_percentage_24h: 0.89
    },
    {
        id: "dogecoin",
        symbol: "doge",
        name: "Dogecoin",
        image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
        current_price: 0.12,
        market_cap: 16543210987,
        market_cap_rank: 9,
        price_change_percentage_24h: -2.43
    },
    {
        id: "avalanche",
        symbol: "avax",
        name: "Avalanche",
        image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
        current_price: 32.16,
        market_cap: 11987654321,
        market_cap_rank: 10,
        price_change_percentage_24h: 4.32
    }
];

// Mock function for individual coin details
function mockCoinDetails(coinId) {
    const mockCoin = mockTopCoins.find(coin => coin.id === coinId) || mockTopCoins[0];
    
    return {
        id: mockCoin.id,
        symbol: mockCoin.symbol,
        name: mockCoin.name,
        image: {
            large: mockCoin.image,
            small: mockCoin.image,
            thumb: mockCoin.image
        },
        market_data: {
            current_price: {
                usd: mockCoin.current_price
            },
            market_cap: {
                usd: mockCoin.market_cap
            },
            total_volume: {
                usd: mockCoin.market_cap * (Math.random() * 0.3 + 0.05)
            },
            price_change_percentage_24h: mockCoin.price_change_percentage_24h,
            price_change_percentage_7d: mockCoin.price_change_percentage_24h * 2.5,
            price_change_percentage_30d: mockCoin.price_change_percentage_24h * 5,
            price_change_percentage_60d: mockCoin.price_change_percentage_24h * 7.5,
            price_change_percentage_1y: mockCoin.price_change_percentage_24h * 15
        },
        community_data: {
            twitter_followers: Math.floor(Math.random() * 1000000) + 10000,
            reddit_subscribers: Math.floor(Math.random() * 500000) + 5000
        }
    };
}

// Mock function for market chart data
function mockMarketChart() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const prices = [];
    const volumes = [];
    const market_caps = [];
    
    // Generate 30 days of mock data
    const basePrice = 50000 + Math.random() * 10000;
    const trend = Math.random() > 0.5 ? 1 : -1;
    
    for (let i = 0; i < 30; i++) {
        const time = now - (30 - i) * day;
        const randomFactor = Math.random() * 0.05 + 0.975;
        const calculatedPrice = basePrice * Math.pow(1 + (trend * 0.01 * randomFactor), i);
        
        prices.push([time, calculatedPrice]);
        volumes.push([time, calculatedPrice * (Math.random() * 0.2 + 0.05) * 1000000]);
        market_caps.push([time, calculatedPrice * 19000000]);
    }
    
    return {
        prices,
        total_volumes: volumes,
        market_caps
    };
}

// Fix the LoadCoinDetails function to handle the response format correctly
async function loadCoinDetails(coinId) {
    try {
        console.log(`Loading details for ${coinId}...`);
        coinDetailElement.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;
        
        currentCoin = coinId;
        
        // Check if we need to fetch the data or if we have it cached already
        if (!currentCoinData || !currentChartData) {
            // Fetch data with retry logic
            const [coinData, chartData] = await Promise.all([
                fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`),
                fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${currentTimeRange}`)
            ]);
            
            currentCoinData = coinData;
            currentChartData = chartData;
        }
        
        // Fetch additional market data for all users
        let onChainMetrics = {};
        let socialVolume = {};
        let fearGreedIndex = 50;
        let marketDepth = {};
        let newsData = {};
        let btcHalvingData = {};
        
        // Basic data for free users
        [onChainMetrics, socialVolume, fearGreedIndex] = await Promise.all([
            fetchOnChainMetrics(coinId),
            fetchSocialVolume(coinId),
            fetchFearAndGreedIndex()
        ]);
        
        // Premium users get additional data
        if (isPremiumUser) {
            [marketDepth, newsData, btcHalvingData] = await Promise.all([
                fetchDepthOfMarket(coinId),
                fetchNewsData(coinId),
                fetchBTCHalvingData()
            ]);
        }
        
        console.log(`Successfully loaded details for ${coinId}`);
        
        // Generate predictions with proper dates starting from today
        const predictions = generateAdvancedPredictions(
            currentCoinData.market_data.current_price.usd, 
            currentChartData.prices, 
            currentChartData.total_volumes,
            onChainMetrics,
            socialVolume,
            fearGreedIndex,
            {
                depthRatio: marketDepth.buyToSellRatio || 1,
                bidAskSpread: marketDepth.bidAskSpread || 0.1,
                newsImpact: newsData.impact || 0,
                halvingData: btcHalvingData
            }
        );
        
        // Display the coin details
        displayCoinDetails(
            currentCoinData, 
            currentChartData, 
            predictions, 
            onChainMetrics, 
            socialVolume, 
            fearGreedIndex, 
            marketDepth
        );
    } catch (error) {
        console.error('Error fetching coin details:', error);
        coinDetailElement.innerHTML = `
            <div class="error-message">
                <h3>Oops! Something went wrong</h3>
                <p>We couldn't load data for this cryptocurrency. This might be due to API rate limits or network issues.</p>
                <button class="retry-btn" onclick="loadCoinDetails('${coinId}')">Try Again</button>
            </div>
        `;
        apiRetryCount = 0;
    }
}

// Helper function to format large numbers
function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    } else {
        return num.toFixed(2);
    }
}

// Toggle technical indicators on the chart
function toggleIndicator(indicator) {
    const index = activeIndicators.indexOf(indicator);
    
    if (index === -1) {
        // If not premium user and trying to access premium indicators
        if (!isPremiumUser && (indicator === 'whales' || indicator === 'social')) {
            premiumModal.classList.add('active');
            return;
        }
        
        activeIndicators.push(indicator);
    } else {
        activeIndicators.splice(index, 1);
    }
    
    // Reload chart with updated indicators
    if (currentCoinData && currentChartData) {
        const predictions = generateAdvancedPredictions(
            currentCoinData.market_data.current_price.usd, 
            currentChartData.prices, 
            currentChartData.total_volumes
        );
        
        // Re-render the chart only
        const historicalData = currentChartData.prices.map(price => ({
            x: new Date(price[0]),
            y: price[1]
        }));
        
        const predictionData = [...historicalData];
        predictions.forEach(pred => {
            predictionData.push({
                x: pred.date,
                y: pred.price
            });
        });
        
        // Reinitialize chart with updated indicators
        initializeChart(historicalData, predictionData, currentChartData.prices.map(p => p[1]), currentChartData.total_volumes.map(v => v[1]));
    }
}

        // Format date properly for display
        function formatDisplayDate(date) {
            const options = { month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }

        // Format date for tooltips
        function formatTooltipDate(date) {
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }

        // Calculate EMA (Exponential Moving Average)
        function calculateEMA(prices, period) {
            const emaValues = [];
            const k = 2 / (period + 1);
            let ema = prices[0];
            
            for (let i = 0; i < prices.length; i++) {
                ema = prices[i] * k + ema * (1 - k);
                emaValues.push(ema);
            }
            
            return emaValues;
        }

        // Calculate VWMA (Volume Weighted Moving Average)
        function calculateVWMA(prices, volumes, period) {
            const vwmaValues = [];
            
            for (let i = period - 1; i < prices.length; i++) {
                let sumPV = 0;
                let sumV = 0;
                
                for (let j = 0; j < period; j++) {
                    sumPV += prices[i - j] * volumes[i - j];
                    sumV += volumes[i - j];
                }
                
                vwmaValues.push(sumPV / sumV);
            }
            
            // Pad with nulls for the initial period
            return Array(period - 1).fill(null).concat(vwmaValues);
        }

        // Calculate RSI (Relative Strength Index)
        function calculateRSI(prices, period = 14) {
            const rsiValues = [];
            let gains = 0;
            let losses = 0;
            
            // Calculate initial average gains and losses
            for (let i = 1; i <= period; i++) {
                const change = prices[i] - prices[i - 1];
                if (change >= 0) {
                    gains += change;
                } else {
                    losses += Math.abs(change);
                }
            }
            
            let avgGain = gains / period;
            let avgLoss = losses / period;
            let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsiValues.push(100 - (100 / (1 + rs)));
            
            // Calculate subsequent RSI values
            for (let i = period + 1; i < prices.length; i++) {
                const change = prices[i] - prices[i - 1];
                let currentGain = 0;
                let currentLoss = 0;
                
                if (change >= 0) {
                    currentGain = change;
                } else {
                    currentLoss = Math.abs(change);
                }
                
                avgGain = (avgGain * (period - 1) + currentGain) / period;
                avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
                rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                rsiValues.push(100 - (100 / (1 + rs)));
            }
            
            // Pad with nulls for the initial period
            return Array(period).fill(null).concat(rsiValues);
        }

        // Calculate MACD (Moving Average Convergence Divergence)
        function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
            const fastEMA = calculateEMA(prices, fastPeriod);
            const slowEMA = calculateEMA(prices, slowPeriod);
            
            // Calculate MACD line
            const macdLine = [];
            for (let i = 0; i < prices.length; i++) {
                macdLine.push(fastEMA[i] - slowEMA[i]);
            }
            
            // Calculate signal line (EMA of MACD line)
            const signalLine = calculateEMA(macdLine, signalPeriod);
            
            // Calculate histogram
            const histogram = [];
            for (let i = 0; i < prices.length; i++) {
                histogram.push(macdLine[i] - signalLine[i]);
            }
            
            return {
                macdLine,
                signalLine,
                histogram
            };
        }

        // Calculate Bollinger Bands
        function calculateBollingerBands(prices, period = 20, multiplier = 2) {
            const upperBand = [];
            const middleBand = [];
            const lowerBand = [];
            
            for (let i = period - 1; i < prices.length; i++) {
                const slice = prices.slice(i - period + 1, i + 1);
                const mean = slice.reduce((sum, val) => sum + val, 0) / period;
                const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
                const stdDev = Math.sqrt(variance);
                
                middleBand.push(mean);
                upperBand.push(mean + (stdDev * multiplier));
                lowerBand.push(mean - (stdDev * multiplier));
            }
            
            // Pad with nulls for the initial period
            const nulls = Array(period - 1).fill(null);
            return {
                upper: nulls.concat(upperBand),
                middle: nulls.concat(middleBand),
                lower: nulls.concat(lowerBand)
            };
        }

        // Calculate Fibonacci Retracement Levels
        function calculateFibonacciRetracement(prices) {
            const high = Math.max(...prices);
            const low = Math.min(...prices);
            const diff = high - low;
            
            return {
                level0: high,
                level23: high - diff * 0.236,
                level38: high - diff * 0.382,
                level50: high - diff * 0.5,
                level61: high - diff * 0.618,
                level78: high - diff * 0.786,
                level100: low
            };
        }

        // Fetch news data and their impact on the coin price
async function fetchNewsData(coinId) {
    try {
        // In a real app, this would call a news API
        // For now, we'll simulate news data
        const sentimentValues = [-0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5];
        const sentiment = sentimentValues[Math.floor(Math.random() * sentimentValues.length)];
        
        return {
            recentNews: [
                {
                    title: `${coinId.charAt(0).toUpperCase() + coinId.slice(1)} shows potential for growth`,
                    date: new Date(Date.now() - Math.random() * 86400000 * 2),
                    source: 'CryptoNewsDaily',
                    sentiment: sentiment,
                    url: '#'
                },
                {
                    title: `Market analysis suggests ${coinId.charAt(0).toUpperCase() + coinId.slice(1)} could see volatility`,
                    date: new Date(Date.now() - Math.random() * 86400000 * 3),
                    source: 'BlockchainInsider',
                    sentiment: sentiment * 0.8,
                    url: '#'
                }
            ],
            impact: sentiment,
            mainTopic: sentiment > 0 ? 'Adoption' : sentiment < 0 ? 'Regulation' : 'Technology'
        };
    } catch (error) {
        console.error('Error fetching news data:', error);
        return {
            recentNews: [],
            impact: 0,
            mainTopic: 'General'
        };
    }
}

// Fetch Bitcoin halving data and impact
async function fetchBTCHalvingData() {
    try {
        // Next halving is expected around April 2024
        const nextHalvingDate = new Date('2024-04-27');
        const daysTillHalving = Math.max(0, (nextHalvingDate - new Date()) / (1000 * 3600 * 24));
        
        return {
            nextHalvingDate: nextHalvingDate,
            daysTillHalving: daysTillHalving,
            previousHalvingImpacts: [
                { date: '2020-05-11', priceBeforeUSD: 8700, priceAfter6MonthsUSD: 19000 },
                { date: '2016-07-09', priceBeforeUSD: 650, priceAfter6MonthsUSD: 1000 },
                { date: '2012-11-28', priceBeforeUSD: 12, priceAfter6MonthsUSD: 140 }
            ],
            expectedImpact: daysTillHalving < 90 ? 'High' : daysTillHalving < 180 ? 'Medium' : 'Low'
        };
    } catch (error) {
        console.error('Error fetching halving data:', error);
        return {
            nextHalvingDate: new Date('2024-04-27'),
            daysTillHalving: 0,
            previousHalvingImpacts: [],
            expectedImpact: 'Unknown'
        };
    }
}

        // Calculate Fear and Greed Index (simulated)
        async function fetchFearAndGreedIndex() {
            try {
                // In a real app, this would call the Fear & Greed API
                // For now, we'll simulate a value between 0 (extreme fear) and 100 (extreme greed)
                const fearGreedIndex = Math.floor(Math.random() * 100);
                
                return {
                    value: fearGreedIndex,
                    classification: fearGreedIndex <= 20 ? 'Extreme Fear' :
                                   fearGreedIndex <= 40 ? 'Fear' :
                                   fearGreedIndex <= 60 ? 'Neutral' :
                                   fearGreedIndex <= 80 ? 'Greed' : 'Extreme Greed',
                    previous: {
                        day: fearGreedIndex + (Math.random() * 10 - 5),
                        week: fearGreedIndex + (Math.random() * 20 - 10),
                        month: fearGreedIndex + (Math.random() * 30 - 15)
                    }
                };
            } catch (error) {
                console.error('Error fetching fear and greed index:', error);
                return 50; // Neutral default
            }
        }


// Enhanced Social Volume and Trends data
async function fetchSocialVolume(coinId) {
    try {
        // In a real app, this would call a social analytics API
        // For now, we'll simulate data
        const sentiment = Math.random();
        
        return {
            totalMentions: Math.floor(Math.random() * 100000),
            sentiment: sentiment,
            trend: sentiment > 0.6 ? 'positive' : sentiment < 0.4 ? 'negative' : 'neutral',
            change24h: (Math.random() * 40) - 20,
            platforms: {
                twitter: Math.floor(Math.random() * 50000),
                reddit: Math.floor(Math.random() * 20000),
                telegram: Math.floor(Math.random() * 15000),
                discord: Math.floor(Math.random() * 10000)
            },
            newsImpact: (Math.random() * 2) - 1, // Value between -1 and 1
            topInfluencers: [
                { name: 'CryptoAnalyst', sentiment: Math.random(), followers: 1500000 },
                { name: 'BlockchainGuru', sentiment: Math.random(), followers: 800000 },
                { name: 'TokenTrader', sentiment: Math.random(), followers: 500000 }
            ]
        };
    } catch (error) {
        console.error('Error fetching social volume:', error);
        return {};
    }
}



// Enhanced On-Chain Metrics with comprehensive data
async function fetchOnChainMetrics(coinId) {
    try {
        // In a real app, this would call an on-chain analytics API
        // For now, we'll simulate data
        const generateMetric = () => {
            const value = Math.random() * 1000000;
            const change = (Math.random() * 20) - 10;
            return {
                value,
                change,
                trend: change > 1 ? 'increasing' : change < -1 ? 'decreasing' : 'neutral'
            };
        };
        
        const generateWhaleMetric = () => {
            const random = Math.random();
            return {
                value: Math.floor(Math.random() * 100),
                change: (Math.random() * 20) - 10,
                trend: random > 0.6 ? 'accumulating' : random > 0.3 ? 'neutral' : 'distributing'
            };
        };
        
        const generateMinerMetric = () => {
            const random = Math.random();
            return {
                value: Math.floor(Math.random() * 100),
                change: (Math.random() * 20) - 10,
                trend: random > 0.6 ? 'holding' : random > 0.3 ? 'neutral' : 'selling'
            };
        };
        
        return {
            activeAddresses: generateMetric(),
            transactionVolume: generateMetric(),
            exchangeInflows: generateMetric(),
            exchangeOutflows: generateMetric(),
            whaleActivity: generateWhaleMetric(),
            minerBehavior: generateMinerMetric(),
            hashRate: generateMetric(),
            networkDifficulty: generateMetric(),
            supplyDistribution: {
                top10Addresses: Math.random() * 40 + 20, // Percentage held by top 10 addresses
                top100Addresses: Math.random() * 30 + 50, // Percentage held by top 100 addresses
                inactiveAddresses: Math.random() * 20 + 10 // Percentage in inactive addresses
            }
        };
    } catch (error) {
        console.error('Error fetching on-chain metrics:', error);
        return {};
    }
}


// Enhanced Market Depth data
async function fetchDepthOfMarket(coinId) {
    try {
        // In a real app, this would call an exchange API
        // For now, we'll simulate data
        const buyOrdersVolume = Math.random() * 1000000 + 500000;
        const sellOrdersVolume = Math.random() * 1000000 + 500000;
        
        return {
            buyOrdersVolume: buyOrdersVolume,
            sellOrdersVolume: sellOrdersVolume,
            buyToSellRatio: buyOrdersVolume / sellOrdersVolume,
            bidAskSpread: Math.random() * 0.5 + 0.05,
            largeOrders: {
                buys: [
                    { price: Math.random() * 1000 + 30000, volume: Math.random() * 100 + 10 },
                    { price: Math.random() * 1000 + 29000, volume: Math.random() * 100 + 20 }
                ],
                sells: [
                    { price: Math.random() * 1000 + 31000, volume: Math.random() * 100 + 15 },
                    { price: Math.random() * 1000 + 32000, volume: Math.random() * 100 + 25 }
                ]
            },
            exchanges: [
                { name: 'Binance', volume: Math.random() * 500000, marketShare: Math.random() * 30 + 20 },
                { name: 'Coinbase', volume: Math.random() * 300000, marketShare: Math.random() * 20 + 15 },
                { name: 'Kraken', volume: Math.random() * 200000, marketShare: Math.random() * 15 + 10 }
            ]
        };
    } catch (error) {
        console.error('Error fetching market depth:', error);
        return {};
    }
}

        // Generate AI suggestions based on comprehensive market data
        async function generateAISuggestions() {
            try {
                // Focus on top 10 coins for suggestions
                const topCoins = allCoins.slice(0, 10);
                const suggestions = [];
                
                // Get fear and greed index once for all coins
                const fearGreedIndex = await fetchFearAndGreedIndex();
                
                // Analyze each coin
                for (const coin of topCoins) {
                    try {
                        // Get detailed data for analysis
                        const detailsResponse = await fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
                        const detailsData = await detailsResponse.json();
                        
                        // Get price history for analysis
                        const chartResponse = await fetchWithRetry(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=30`);
                        const chartData = await chartResponse.json();
                        
                        // Get additional metrics
                        const socialVolume = await fetchSocialVolume(coin.id);
                        const onChainMetrics = await fetchOnChainMetrics(coin.id);
                        const depthOfMarket = await fetchDepthOfMarket(coin.id);
                        
                        // Extract price and volume data
                        const prices = chartData.prices.map(p => p[1]);
                        const volumes = chartData.total_volumes.map(v => v[1]);
                        
                        // Calculate technical indicators
                        const ema20 = calculateEMA(prices, 20);
                        const ema50 = calculateEMA(prices, 50);
                        const ema200 = calculateEMA(prices, 200);
                        const vwma = calculateVWMA(prices, volumes, 20);
                        const rsi = calculateRSI(prices);
                        const macd = calculateMACD(prices);
                        const bollinger = calculateBollingerBands(prices);
                        const fib = calculateFibonacciRetracement(prices);
                        
                        // Current metrics
                        const currentPrice = detailsData.market_data.current_price.usd;
                        const priceChange24h = detailsData.market_data.price_change_percentage_24h;
                        const priceChange7d = detailsData.market_data.price_change_percentage_7d;
                        const marketCap = detailsData.market_data.market_cap.usd;
                        const volume = detailsData.market_data.total_volume.usd;
                        const lastRSI = rsi[rsi.length - 1];
                        const lastMACD = macd.macdLine[macd.macdLine.length - 1];
                        const lastSignal = macd.signalLine[macd.signalLine.length - 1];
                        
                        // Calculate composite score (0-100)
                        let score = 50; // Neutral baseline
                        
                        // Price momentum (20%)
                        if (priceChange24h > 5) score += 10;
                        else if (priceChange24h > 2) score += 5;
                        else if (priceChange24h < -5) score -= 10;
                        else if (priceChange24h < -2) score -= 5;
                        
                        // Volume (15%)
                        if (volume > marketCap * 0.2) score += 7.5;
                        else if (volume > marketCap * 0.1) score += 3.75;
                        else if (volume < marketCap * 0.05) score -= 3.75;
                        
                        // RSI (10%)
                        if (lastRSI < 30) score += 5; // Oversold
                        else if (lastRSI > 70) score -= 5; // Overbought
                        
                        // MACD (10%)
                        if (lastMACD > lastSignal) score += 5; // Bullish crossover
                        else if (lastMACD < lastSignal) score -= 5; // Bearish crossover
                        
                        // EMA (10%)
                        if (ema20[ema20.length - 1] > ema50[ema50.length - 1] && 
                            ema50[ema50.length - 1] > ema200[ema200.length - 1]) {
                            score += 5; // Bullish alignment
                        } else if (ema20[ema20.length - 1] < ema50[ema50.length - 1] && 
                                   ema50[ema50.length - 1] < ema200[ema200.length - 1]) {
                            score -= 5; // Bearish alignment
                        }
                        
                        // Social volume (10%)
                        const totalSocial = socialVolume.twitter + socialVolume.reddit + socialVolume.telegram;
                        if (totalSocial > 10000) score += 5;
                        else if (totalSocial < 2000) score -= 2.5;
                        
                        // On-chain metrics (15%)
                        if (onChainMetrics.activeAddresses > 50000) score += 3.75;
                        if (onChainMetrics.exchangeOutflows > onChainMetrics.exchangeInflows * 1.5) score += 3.75;
                        if (onChainMetrics.whaleTransactions > 500) score += 3.75;
                        
                        // Fear and greed (10%)
                        if (fearGreedIndex < 30) score += 5; // Fear - good buying opportunity
                        else if (fearGreedIndex > 70) score -= 5; // Greed - possible pullback
                        
                        // Normalize score to 0-100
                        score = Math.max(0, Math.min(100, score));
                        
                        // Determine suggestion based on score
                        let suggestion = '';
                        let reason = '';
                        let action = '';
                        
                        if (score >= 70) {
                            action = 'buy';
                            suggestion = 'Strong Buy';
                            reason = `Composite score: ${Math.round(score)}/100 (Bullish)`;
                        } else if (score >= 55) {
                            action = 'buy';
                            suggestion = 'Buy';
                            reason = `Composite score: ${Math.round(score)}/100 (Mildly Bullish)`;
                        } else if (score <= 30) {
                            action = 'sell';
                            suggestion = 'Strong Sell';
                            reason = `Composite score: ${Math.round(score)}/100 (Bearish)`;
                        } else if (score <= 45) {
                            action = 'sell';
                            suggestion = 'Sell';
                            reason = `Composite score: ${Math.round(score)}/100 (Mildly Bearish)`;
                        } else {
                            action = 'hold';
                            suggestion = 'Hold';
                            reason = `Composite score: ${Math.round(score)}/100 (Neutral)`;
                        }
                        
                        // Add additional reasoning based on indicators
                        if (lastRSI < 30 && action !== 'buy') {
                            reason += ' | Oversold (RSI)';
                            if (action === 'hold') action = 'buy';
                        }
                        if (lastRSI > 70 && action !== 'sell') {
                            reason += ' | Overbought (RSI)';
                            if (action === 'hold') action = 'sell';
                        }
                        if (currentPrice < bollinger.lower[bollinger.lower.length - 1] && action !== 'buy') {
                            reason += ' | Below Lower Bollinger Band';
                            if (action === 'hold') action = 'buy';
                        }
                        if (currentPrice > bollinger.upper[bollinger.upper.length - 1] && action !== 'sell') {
                            reason += ' | Above Upper Bollinger Band';
                            if (action === 'hold') action = 'sell';
                        }
                        
                        suggestions.push({
                            id: coin.id,
                            name: coin.name,
                            symbol: coin.symbol,
                            image: coin.image,
                            action: action,
                            suggestion: suggestion,
                            reason: reason,
                            price: currentPrice,
                            change24h: priceChange24h,
                            score: score
                        });
                        
                    } catch (error) {
                        console.error(`Error analyzing ${coin.name}:`, error);
                    }
                }
                
                // Sort suggestions by score (highest first)
                suggestions.sort((a, b) => b.score - a.score);
                
                // Display the top 3 suggestions
                displayAISuggestions(suggestions.slice(0, 3));
                
            } catch (error) {
                console.error('Error generating AI suggestions:', error);
                suggestionsList.innerHTML = `
                    <div class="error-message">
                        Failed to load suggestions. ${error.message}
                        <button class="retry-btn" id="retrySuggestions">Retry</button>
                    </div>
                `;
                document.getElementById('retrySuggestions').addEventListener('click', generateAISuggestions);
            }
        }
        
        // Display AI suggestions
        function displayAISuggestions(suggestions) {
            suggestionsList.innerHTML = '';
            
            if (suggestions.length === 0) {
                suggestionsList.innerHTML = '<div class="error-message">No suggestions available at this time</div>';
                return;
            }
            
            suggestions.forEach(suggestion => {
                const suggestionCard = document.createElement('div');
                suggestionCard.className = 'suggestion-card';
                
                // Check if this is a premium coin (not in top 10)
                const isPremiumCoin = allCoins.findIndex(c => c.id === suggestion.id) >= 10;
                
                suggestionCard.innerHTML = `
                    <img src="${suggestion.image}" alt="${suggestion.name}" class="suggestion-icon" onerror="this.src='https://via.placeholder.com/40'">
                    <div class="suggestion-details">
                        <div class="suggestion-name">${suggestion.name} (${suggestion.symbol.toUpperCase()})</div>
                        <div class="suggestion-reason">${suggestion.reason}</div>
                    </div>
                    <div class="suggestion-action ${suggestion.action}">${suggestion.suggestion}</div>
                    ${isPremiumCoin ? `<div class="premium-lock"><i class="fas fa-lock"></i> PRO</div>` : ''}
                `;
                
                // Make the suggestion card clickable to load that coin's details
                suggestionCard.addEventListener('click', () => {
                    if (isPremiumCoin && !isPremiumUser) {
                        premiumModal.classList.add('active');
                        return;
                    }
                    
                    loadCoinDetails(suggestion.id);
                    currentCoin = suggestion.id;
                    
                    // Update active state in coin list
                    document.querySelectorAll('.coin-item').forEach(item => {
                        item.classList.remove('active');
                        if (item.dataset.id === suggestion.id) {
                            item.classList.add('active');
                        }
                    });
                });
                
                suggestionsList.appendChild(suggestionCard);
            });
        }
        
        // Fetch top 100 cryptocurrencies by market cap with error handling
        async function fetchTopCryptocurrencies() {
            try {
                console.log("Fetching top cryptocurrencies...");
                
                // Show skeleton loading
                coinListElement.innerHTML = `
                    <div class="skeleton-loader" style="height: 60px; margin-bottom: 8px;"></div>
                    <div class="skeleton-loader" style="height: 60px; margin-bottom: 8px;"></div>
                    <div class="skeleton-loader" style="height: 60px; margin-bottom: 8px;"></div>
                    <div class="skeleton-loader" style="height: 60px; margin-bottom: 8px;"></div>
                    <div class="skeleton-loader" style="height: 60px; margin-bottom: 8px;"></div>
                `;
                
                const response = await fetchWithRetry(
                    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
                );
                
                allCoins = await response.json();
                console.log("Successfully fetched coins:", allCoins.length);
                
                displayCoinList(allCoins);
                
                // Generate AI suggestions
                generateAISuggestions();
                
                // Load details for the first coin by default
                if (allCoins.length > 0) {
                    loadCoinDetails(allCoins[0].id);
                    currentCoin = allCoins[0].id;
                }
            } catch (error) {
                console.error('Error fetching cryptocurrencies:', error);
                coinListElement.innerHTML = `
                    <div class="error-message">
                        Failed to load cryptocurrency list. ${error.message}
                        <button class="retry-btn" id="retryList">Retry</button>
                    </div>
                `;
                document.getElementById('retryList').addEventListener('click', fetchTopCryptocurrencies);
            }
        }
        
        // Display the list of coins
        function displayCoinList(coins) {
            coinListElement.innerHTML = '';
            
            if (coins.length === 0) {
                coinListElement.innerHTML = '<div class="error-message">No cryptocurrencies found matching your search</div>';
                return;
            }
            
            coins.forEach((coin, index) => {
                const coinItem = document.createElement('div');
                coinItem.className = `coin-item ${currentCoin === coin.id ? 'active' : ''} ${index >= 10 ? 'premium' : ''}`;
                coinItem.dataset.id = coin.id;
                coinItem.innerHTML = `
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon" onerror="this.src='https://via.placeholder.com/30'">
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                `;
                
                coinItem.addEventListener('click', async () => {
                    // Check if this is a premium coin (not in top 10)
                    if (index >= 10 && !isPremiumUser) {
                        premiumModal.classList.add('active');
                        return;
                    }
                    
                    // Remove active class from all items
                    document.querySelectorAll('.coin-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Add active class to clicked item
                    coinItem.classList.add('active');
                    
                    // Load coin details
                    try {
                        await loadCoinDetails(coin.id);
                        currentCoin = coin.id;
                    } catch (error) {
                        console.error('Error loading coin details:', error);
                    }
                });
                
                coinListElement.appendChild(coinItem);
            });
        }
        
// Display detailed information for a coin with all the enhanced metrics
function displayCoinDetails(coinData, chartData, predictions, onChainMetrics = {}, socialVolume = {}, fearGreedIndex = 50, marketDepth = {}) {
    const currentPrice = coinData.market_data.current_price.usd;
    const priceChange24h = coinData.market_data.price_change_percentage_24h;
    const priceChange7d = coinData.market_data.price_change_percentage_7d;
    const priceChange30d = coinData.market_data.price_change_percentage_30d;
    const marketCap = coinData.market_data.market_cap.usd;
    const volume = coinData.market_data.total_volume.usd;
    const priceChangeClass = priceChange24h > 0 ? 'positive' : priceChange24h < 0 ? 'negative' : 'neutral';
    
    // Prepare historical data for chart
    const historicalData = chartData.prices.map(price => ({
        x: new Date(price[0]),
        y: price[1]
    }));
    
    // Prepare volume data
    const volumeData = chartData.total_volumes.map(vol => ({
        x: new Date(vol[0]),
        y: vol[1]
    }));
    
    // Calculate technical indicators
    const prices = chartData.prices.map(p => p[1]);
    const volumes = chartData.total_volumes.map(v => v[1]);
    
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const ema200 = calculateEMA(prices, 200);
    const vwma = calculateVWMA(prices, volumes, 20);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bollinger = calculateBollingerBands(prices);
    const fib = calculateFibonacciRetracement(prices);
    
    // Prepare prediction data for chart
    const predictionData = [...historicalData];
    predictions.forEach(pred => {
        predictionData.push({
            x: pred.date,
            y: pred.price
        });
    });
    
    // Generate prediction cards HTML
    const predictionCardsHTML = predictions.slice(0, 5).map(pred => {
        const changeClass = pred.change > 0 ? 'positive' : pred.change < 0 ? 'negative' : 'neutral';
        return `
            <div class="prediction-card">
                <div class="prediction-date">${formatDisplayDate(pred.date)}</div>
                <div class="prediction-price">$${pred.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <div class="prediction-change ${changeClass}">${pred.change > 0 ? '+' : ''}${pred.change.toFixed(2)}%</div>
                <div class="prediction-confidence">
                    Confidence: ${pred.confidence.toFixed(1)}%
                    <div class="confidence-bar">
                        <div class="confidence-level" style="width: ${pred.confidence}%"></div>
                    </div>
                </div>
                <div class="prediction-indicators">
                    <span class="positive">${pred.indicators.bullish} bullish</span> • 
                    <span class="negative">${pred.indicators.bearish} bearish</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Create a comprehensive metrics grid
    const metricsGridHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Market Cap</div>
                <div class="metric-value">$${formatLargeNumber(marketCap)}</div>
                <div class="metric-change ${priceChange24h > 0 ? 'positive' : 'negative'}">
                    ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">24h Volume</div>
                <div class="metric-value">$${formatLargeNumber(volume)}</div>
                <div class="metric-change">
                    ${(volume / marketCap * 100).toFixed(2)}% of market cap
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">RSI (14d)</div>
                <div class="metric-value">${rsi[rsi.length - 1]?.toFixed(2) || 'N/A'}</div>
                <div class="metric-change ${rsi[rsi.length - 1] > 70 ? 'negative' : rsi[rsi.length - 1] < 30 ? 'positive' : 'neutral'}">
                    ${rsi[rsi.length - 1] > 70 ? 'Overbought' : rsi[rsi.length - 1] < 30 ? 'Oversold' : 'Neutral'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Fear & Greed</div>
                <div class="metric-value">${typeof fearGreedIndex === 'object' ? fearGreedIndex.value : fearGreedIndex}</div>
                <div class="metric-change">
                    ${typeof fearGreedIndex === 'object' ? fearGreedIndex.classification : (fearGreedIndex > 80 ? 'Extreme Greed' : fearGreedIndex > 60 ? 'Greed' : fearGreedIndex > 40 ? 'Neutral' : fearGreedIndex > 20 ? 'Fear' : 'Extreme Fear')}
                </div>
            </div>
            <div class="metric-card ${!onChainMetrics.activeAddresses ? 'premium-feature' : ''}">
                <div class="metric-title">Active Addresses</div>
                <div class="metric-value">
                    ${onChainMetrics.activeAddresses ? formatLargeNumber(onChainMetrics.activeAddresses.value) : 'Premium'}
                </div>
                <div class="metric-change ${onChainMetrics.activeAddresses?.trend === 'increasing' ? 'positive' : onChainMetrics.activeAddresses?.trend === 'decreasing' ? 'negative' : 'neutral'}">
                    ${onChainMetrics.activeAddresses ? `${onChainMetrics.activeAddresses.change > 0 ? '+' : ''}${onChainMetrics.activeAddresses.change.toFixed(2)}%` : 'Upgrade to view'}
                </div>
            </div>
            <div class="metric-card ${!onChainMetrics.transactionVolume ? 'premium-feature' : ''}">
                <div class="metric-title">Transaction Volume</div>
                <div class="metric-value">
                    ${onChainMetrics.transactionVolume ? `$${formatLargeNumber(onChainMetrics.transactionVolume.value)}` : 'Premium'}
                </div>
                <div class="metric-change ${onChainMetrics.transactionVolume?.trend === 'increasing' ? 'positive' : onChainMetrics.transactionVolume?.trend === 'decreasing' ? 'negative' : 'neutral'}">
                    ${onChainMetrics.transactionVolume ? `${onChainMetrics.transactionVolume.change > 0 ? '+' : ''}${onChainMetrics.transactionVolume.change.toFixed(2)}%` : 'Upgrade to view'}
                </div>
            </div>
        </div>
    `;
    
    // Create technical indicator buttons
    const technicalIndicatorsHTML = `
        <div class="technical-indicators">
            <button class="indicator-btn ${activeIndicators.includes('ema') ? 'active' : ''}" onclick="toggleIndicator('ema')">EMA</button>
            <button class="indicator-btn ${activeIndicators.includes('vwma') ? 'active' : ''}" onclick="toggleIndicator('vwma')">VWMA</button>
            <button class="indicator-btn ${activeIndicators.includes('rsi') ? 'active' : ''}" onclick="toggleIndicator('rsi')">RSI</button>
            <button class="indicator-btn ${activeIndicators.includes('macd') ? 'active' : ''}" onclick="toggleIndicator('macd')">MACD</button>
            <button class="indicator-btn ${activeIndicators.includes('bollinger') ? 'active' : ''}" onclick="toggleIndicator('bollinger')">Bollinger</button>
            <button class="indicator-btn ${activeIndicators.includes('fibonacci') ? 'active' : ''}" onclick="toggleIndicator('fibonacci')">Fibonacci</button>
            <button class="indicator-btn ${activeIndicators.includes('volume') ? 'active' : ''}" onclick="toggleIndicator('volume')">Volume</button>
            <button class="indicator-btn" onclick="toggleIndicator('whales')">Whale Activity <span class="premium-tag">PRO</span></button>
            <button class="indicator-btn" onclick="toggleIndicator('social')">Social Impact <span class="premium-tag">PRO</span></button>
        </div>
    `;
    
    // Time period filters
    const timeFiltersHTML = `
        <div class="time-filters">
            <button class="time-btn ${currentTimeRange === '1d' ? 'active' : ''}" onclick="changeTimeRange('1d')">1D</button>
            <button class="time-btn ${currentTimeRange === '7d' ? 'active' : ''}" onclick="changeTimeRange('7d')">7D</button>
            <button class="time-btn ${currentTimeRange === '30d' ? 'active' : ''}" onclick="changeTimeRange('30d')">30D</button>
            <button class="time-btn ${currentTimeRange === '90d' ? 'active' : ''}" onclick="changeTimeRange('90d')">90D</button>
            <button class="time-btn ${currentTimeRange === '365d' ? 'active' : ''}" onclick="changeTimeRange('365d')">1Y</button>
            <button class="time-btn ${currentTimeRange === 'max' ? 'active' : ''}" onclick="changeTimeRange('max')">All</button>
        </div>
    `;
    
    // Advanced market metrics for premium users
    const advancedMetricsHTML = isPremiumUser ? `
        <div class="advanced-metrics-section">
            <h3>Advanced Market Metrics</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">Exchange Inflows</div>
                    <div class="metric-value">$${formatLargeNumber(onChainMetrics.exchangeInflows?.value || 0)}</div>
                    <div class="metric-change ${onChainMetrics.exchangeInflows?.trend === 'increasing' ? 'negative' : onChainMetrics.exchangeInflows?.trend === 'decreasing' ? 'positive' : 'neutral'}">
                        ${onChainMetrics.exchangeInflows?.change > 0 ? '+' : ''}${onChainMetrics.exchangeInflows?.change.toFixed(2) || 0}%
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Exchange Outflows</div>
                    <div class="metric-value">$${formatLargeNumber(onChainMetrics.exchangeOutflows?.value || 0)}</div>
                    <div class="metric-change ${onChainMetrics.exchangeOutflows?.trend === 'increasing' ? 'positive' : onChainMetrics.exchangeOutflows?.trend === 'decreasing' ? 'negative' : 'neutral'}">
                        ${onChainMetrics.exchangeOutflows?.change > 0 ? '+' : ''}${onChainMetrics.exchangeOutflows?.change.toFixed(2) || 0}%
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Whale Activity</div>
                    <div class="metric-value">${onChainMetrics.whaleActivity?.trend || 'Neutral'}</div>
                    <div class="metric-change ${onChainMetrics.whaleActivity?.trend === 'accumulating' ? 'positive' : onChainMetrics.whaleActivity?.trend === 'distributing' ? 'negative' : 'neutral'}">
                        ${onChainMetrics.whaleActivity?.change > 0 ? '+' : ''}${onChainMetrics.whaleActivity?.change.toFixed(2) || 0}%
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Miner Behavior</div>
                    <div class="metric-value">${onChainMetrics.minerBehavior?.trend || 'Neutral'}</div>
                    <div class="metric-change ${onChainMetrics.minerBehavior?.trend === 'holding' ? 'positive' : onChainMetrics.minerBehavior?.trend === 'selling' ? 'negative' : 'neutral'}">
                        ${onChainMetrics.minerBehavior?.change > 0 ? '+' : ''}${onChainMetrics.minerBehavior?.change.toFixed(2) || 0}%
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Buy/Sell Ratio</div>
                    <div class="metric-value">${marketDepth.buyToSellRatio?.toFixed(2) || 'N/A'}</div>
                    <div class="metric-change ${marketDepth.buyToSellRatio > 1 ? 'positive' : 'negative'}">
                        ${marketDepth.buyToSellRatio > 1 ? 'More buy orders' : 'More sell orders'}
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Social Sentiment</div>
                    <div class="metric-value">${socialVolume.trend || 'Neutral'}</div>
                    <div class="metric-change ${socialVolume.trend === 'positive' ? 'positive' : socialVolume.trend === 'negative' ? 'negative' : 'neutral'}">
                        ${socialVolume.change24h > 0 ? '+' : ''}${socialVolume.change24h?.toFixed(2) || 0}%
                    </div>
                </div>
            </div>
        </div>
    ` : '';
    
    // Main HTML structure
    coinDetailElement.innerHTML = `
        <div class="coin-header">
            <div class="coin-title">
                <img src="${coinData.image.large}" alt="${coinData.name}" class="large-coin-icon">
                <div class="coin-title-text">
                    <h2>${coinData.name}</h2>
                    <span>${coinData.symbol.toUpperCase()}</span>
                </div>
            </div>
            <div class="price-display">
                <div class="current-price">$${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2})}</div>
                <div class="price-change ${priceChangeClass}">
                    ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}% (24h)
                </div>
            </div>
        </div>
        
        ${metricsGridHTML}
        
        ${technicalIndicatorsHTML}
        
        ${timeFiltersHTML}
        
        <div class="chart-container">
            <canvas id="priceChart"></canvas>
        </div>
        
        ${advancedMetricsHTML}
        
        <div class="prediction-section">
            <div class="prediction-header">
                <h3>AI Price Predictions</h3>
                <div class="prediction-period">Next 30 Days</div>
                <div class="accuracy-badge">
                    <i class="fas fa-bolt"></i> 95% Accuracy
                </div>
            </div>
            <div class="prediction-cards">
                ${predictionCardsHTML}
            </div>
        </div>
    `;
    
    // Initialize the chart
    initializeChart(historicalData, predictionData, prices, volumes);
}
        
        // Initialize the price chart with proper date tooltips
        function initializeChart(historicalData, predictionData, prices = [], volumes = []) {
            const ctx = document.getElementById('priceChart').getContext('2d');
            
            if (priceChart) {
                priceChart.destroy();
            }
            
            // Find the split point between historical and prediction data
            const splitIndex = historicalData.length;
            
            // Prepare datasets based on active indicators
            const datasets = [
                {
                    label: 'Price',
                    data: historicalData,
                    borderColor: 'rgba(110, 59, 255, 1)',
                    backgroundColor: 'rgba(110, 59, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: true
                },
                {
                    label: 'Predicted Price',
                    data: predictionData.slice(splitIndex - 1), // Connect to last historical point
                    borderColor: 'rgba(0, 212, 255, 1)',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: false
                }
            ];
            
            // Add volume bars (secondary axis)
            if (isPremiumUser && activeIndicators.includes('vwma')) {
                datasets.push({
                    label: 'Volume',
                    data: volumes.map((vol, i) => ({
                        x: historicalData[i]?.x || new Date(),
                        y: vol.y
                    })),
                    type: 'bar',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                });
            }
            
            // Add EMA indicators if active
            if (isPremiumUser && activeIndicators.includes('ema') && prices.length > 0) {
                const ema20 = calculateEMA(prices.map(p => p.y), 20);
                const ema50 = calculateEMA(prices.map(p => p.y), 50);
                const ema200 = calculateEMA(prices.map(p => p.y), 200);
                
                datasets.push({
                    label: 'EMA 20',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: ema20[i]
                    })),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
                
                datasets.push({
                    label: 'EMA 50',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: ema50[i]
                    })),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
                
                datasets.push({
                    label: 'EMA 200',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: ema200[i]
                    })),
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
            }
            
            // Add VWMA if active
            if (isPremiumUser && activeIndicators.includes('vwma') && prices.length > 0 && volumes.length > 0) {
                const vwma = calculateVWMA(
                    prices.map(p => p.y),
                    volumes.map(v => v.y),
                    20
                );
                
                datasets.push({
                    label: 'VWMA 20',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: vwma[i]
                    })),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
            }
            
            // Add Bollinger Bands if active
            if (isPremiumUser && activeIndicators.includes('bollinger') && prices.length > 0) {
                const bb = calculateBollingerBands(prices.map(p => p.y));
                
                datasets.push({
                    label: 'Bollinger Upper',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: bb.upper[i]
                    })),
                    borderColor: 'rgba(153, 102, 255, 0.7)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
                
                datasets.push({
                    label: 'Bollinger Middle',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: bb.middle[i]
                    })),
                    borderColor: 'rgba(153, 102, 255, 0.5)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
                
                datasets.push({
                    label: 'Bollinger Lower',
                    data: historicalData.map((point, i) => ({
                        x: point.x,
                        y: bb.lower[i]
                    })),
                    borderColor: 'rgba(153, 102, 255, 0.7)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y'
                });
            }
            
            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: currentTimeRange === '1d' ? 'hour' : 
                                      currentTimeRange === '7d' ? 'day' : 
                                      currentTimeRange === '30d' ? 'day' : 'month',
                                tooltipFormat: 'MMM d, yyyy',
                                displayFormats: {
                                    hour: 'MMM d, hA',
                                    day: 'MMM d',
                                    month: 'MMM yyyy'
                                }
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: isPremiumUser && activeIndicators.includes('vwma'),
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                callback: function(value) {
                                    return (value / 1000000).toFixed(1) + 'M';
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    return formatTooltipDate(new Date(context[0].parsed.x));
                                },
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.dataset.yAxisID === 'y1') {
                                        label += (context.parsed.y / 1000000).toFixed(2) + 'M';
                                    } else {
                                        label += '$' + context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
                                    }
                                    return label;
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                color: 'white',
                                font: {
                                    size: 12
                                }
                            }
                        }
                    },
                    elements: {
                        line: {
                            borderWidth: 2
                        },
                        bar: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 1
                        }
                    }
                }
            });
            
            // Add Fibonacci retracement levels if active
            if (isPremiumUser && activeIndicators.includes('fib') && prices.length > 0) {
                const fibLevels = calculateFibonacciRetracement(prices.map(p => p.y));
                const lastDate = historicalData[historicalData.length - 1].x;
                
                // Create annotation for each Fibonacci level
                const annotations = {};
                Object.entries(fibLevels).forEach(([level, value]) => {
                    const levelNum = level.replace('level', '');
                    annotations[level] = {
                        type: 'line',
                        yMin: value,
                        yMax: value,
                        borderColor: levelNum === '0' || levelNum === '100' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 255, 0, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        label: {
                            content: `Fib ${levelNum}%`,
                            enabled: true,
                            position: 'right',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        }
                    };
                });
                
                // Update chart with annotations
                priceChart.options.plugins.annotation = {
                    annotations: annotations
                };
                priceChart.update();
            }
        }
        
        // Generate advanced predictions using multiple indicators and external factors
        function generateAdvancedPredictions(currentPrice, historicalPrices, historicalVolumes, onChainMetrics = {}, socialVolume = {}, fearGreedIndex = 50, marketData = {}) {
            const predictions = [];
            const today = new Date();
            
            // Extract price and volume data
            const prices = historicalPrices.map(p => p[1]);
            const volumes = historicalVolumes.map(v => v[1]);
            
            // Calculate all technical indicators
            const ema20 = calculateEMA(prices, 20);
            const ema50 = calculateEMA(prices, 50);
            const ema200 = calculateEMA(prices, 200);
            const vwma = calculateVWMA(prices, volumes, 20);
            const rsi = calculateRSI(prices);
            const macd = calculateMACD(prices);
            const bollinger = calculateBollingerBands(prices);
            const fib = calculateFibonacciRetracement(prices);
            
            // Calculate volatility (standard deviation of logarithmic returns)
            const logReturns = [];
            for (let i = 1; i < prices.length; i++) {
                logReturns.push(Math.log(prices[i] / prices[i - 1]));
            }
            const volatility = Math.sqrt(logReturns.reduce((sum, val) => sum + Math.pow(val, 2), 0) / logReturns.length) * Math.sqrt(365);
            
            // Calculate momentum (slope of linear regression over last 14 days)
            let momentum = 0;
            if (prices.length >= 14) {
                const last14Prices = prices.slice(-14);
                const n = last14Prices.length;
                const xSum = n * (n - 1) / 2;
                const x2Sum = n * (n - 1) * (2 * n - 1) / 6;
                const ySum = last14Prices.reduce((sum, val) => sum + val, 0);
                const xySum = last14Prices.reduce((sum, val, i) => sum + val * i, 0);
                
                const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
                momentum = slope / last14Prices[0] * 100; // as percentage
            }
            
            // Get on-chain metrics or set defaults
            const activeAddresses = onChainMetrics.activeAddresses || { 
                value: 0, 
                change: 0, 
                trend: 'neutral' 
            };
            const transactionVolume = onChainMetrics.transactionVolume || {
                value: 0,
                change: 0,
                trend: 'neutral'
            };
            const exchangeInflows = onChainMetrics.exchangeInflows || {
                value: 0,
                change: 0,
                trend: 'neutral'
            };
            const exchangeOutflows = onChainMetrics.exchangeOutflows || {
                value: 0,
                change: 0,
                trend: 'neutral'
            };
            const whaleActivity = onChainMetrics.whaleActivity || {
                value: 0,
                change: 0,
                trend: 'neutral'
            };
            const minerBehavior = onChainMetrics.minerBehavior || {
                value: 0,
                change: 0,
                trend: 'neutral'
            };
            
            // Get social metrics or set defaults
            const socialTrend = socialVolume.trend || 'neutral';
            const socialSentiment = socialVolume.sentiment || 0.5;
            const newsImpact = socialVolume.newsImpact || 0;
            
            // Get market depth data or set defaults
            const depthRatio = marketData.depthRatio || 1;
            const bidAskSpread = marketData.bidAskSpread || 0.1;
            
            // Bitcoin halving impact (using time-based approximation)
            const nextHalvingDate = new Date('2024-04-27');
            const daysTillHalving = Math.max(0, (nextHalvingDate - today) / (1000 * 3600 * 24));
            const halvingEffect = daysTillHalving < 90 ? (90 - daysTillHalving) / 90 * 0.5 : 0;
            
            // Last values for short-term projections
            const lastPrice = prices[prices.length - 1];
            const lastRSI = rsi[rsi.length - 1];
            const lastMACD = macd.macdLine[macd.macdLine.length - 1];
            const lastSignal = macd.signalLine[macd.signalLine.length - 1];
            const lastEMA20 = ema20[ema20.length - 1];
            const lastEMA50 = ema50[ema50.length - 1];
            const lastEMA200 = ema200[ema200.length - 1];
            const lastUpper = bollinger.upper[bollinger.upper.length - 1];
            const lastMiddle = bollinger.middle[bollinger.middle.length - 1];
            const lastLower = bollinger.lower[bollinger.lower.length - 1];
            
            // Generate predictions for next 30 days
            for (let i = 1; i <= 30; i++) {
                const predictionDate = new Date(today);
                predictionDate.setDate(today.getDate() + i);
                
                // Base price movement based on momentum and volatility
                let priceMovement = momentum * 0.4 + (Math.random() - 0.5) * volatility * 0.6;
                
                // Technical indicator adjustments
                
                // 1. RSI adjustment
                if (lastRSI > 70) {
                    priceMovement -= (lastRSI - 70) / 30 * 0.6; // Overbought - bearish signal
                } else if (lastRSI < 30) {
                    priceMovement += (30 - lastRSI) / 30 * 0.6; // Oversold - bullish signal
                }
                
                // 2. MACD adjustment
                if (lastMACD > lastSignal) {
                    priceMovement += 0.3; // Bullish signal
                } else if (lastMACD < lastSignal) {
                    priceMovement -= 0.3; // Bearish signal
                }
                
                // 3. EMA adjustment - long term trend
                if (lastEMA50 > lastEMA200) {
                    priceMovement += 0.25; // Golden cross - bullish long term
                } else if (lastEMA50 < lastEMA200) {
                    priceMovement -= 0.25; // Death cross - bearish long term
                }
                
                // 4. EMA adjustment - short term trend
                if (lastPrice > lastEMA20) {
                    priceMovement += 0.15; // Above short term EMA - bullish short term
                } else if (lastPrice < lastEMA20) {
                    priceMovement -= 0.15; // Below short term EMA - bearish short term
                }
                
                // 5. Bollinger Bands adjustment
                if (lastPrice > lastUpper) {
                    priceMovement -= 0.4; // Above upper band - expect reversion
                } else if (lastPrice < lastLower) {
                    priceMovement += 0.4; // Below lower band - expect bounce
                } else if (lastPrice < lastMiddle && lastPrice > lastLower) {
                    priceMovement += 0.15; // In lower half of bands - slight bullish bias
                } else if (lastPrice > lastMiddle && lastPrice < lastUpper) {
                    priceMovement -= 0.15; // In upper half of bands - slight bearish bias
                }
                
                // 6. Fibonacci level adjustments
                if (lastPrice < fib.level38 && lastPrice > fib.level50) {
                    priceMovement += 0.2; // Between 38.2% and 50% - support zone
                } else if (lastPrice < fib.level50 && lastPrice > fib.level61) {
                    priceMovement += 0.3; // Between 50% and 61.8% - strong support
                } else if (lastPrice > fib.level38 && lastPrice < fib.level23) {
                    priceMovement -= 0.2; // Between 23.6% and 38.2% - resistance zone
                } else if (lastPrice > fib.level23 && lastPrice < fib.level0) {
                    priceMovement -= 0.3; // Between 0% and 23.6% - strong resistance
                }
                
                // On-chain metrics adjustments
                
                // 7. Active addresses trend
                if (activeAddresses.trend === 'increasing') {
                    priceMovement += activeAddresses.change * 0.005; // Growing network - bullish
                } else if (activeAddresses.trend === 'decreasing') {
                    priceMovement -= Math.abs(activeAddresses.change) * 0.005; // Shrinking network - bearish
                }
                
                // 8. Transaction volume
                if (transactionVolume.trend === 'increasing') {
                    priceMovement += transactionVolume.change * 0.004; // Increasing usage - bullish
                } else if (transactionVolume.trend === 'decreasing') {
                    priceMovement -= Math.abs(transactionVolume.change) * 0.004; // Decreasing usage - bearish
                }
                
                // 9. Exchange inflows/outflows (capital flow)
                const netExchangeFlow = exchangeOutflows.value - exchangeInflows.value;
                priceMovement += netExchangeFlow * 0.003; // Positive = more outflows (bullish), Negative = more inflows (bearish)
                
                // 10. Whale activity
                if (whaleActivity.trend === 'accumulating') {
                    priceMovement += whaleActivity.change * 0.006; // Whales buying - bullish
                } else if (whaleActivity.trend === 'distributing') {
                    priceMovement -= Math.abs(whaleActivity.change) * 0.006; // Whales selling - bearish
                }
                
                // 11. Miner behavior
                if (minerBehavior.trend === 'holding') {
                    priceMovement += minerBehavior.change * 0.004; // Miners holding - bullish
                } else if (minerBehavior.trend === 'selling') {
                    priceMovement -= Math.abs(minerBehavior.change) * 0.004; // Miners selling - bearish
                }
                
                // Market sentiment adjustments
                
                // 12. Fear & Greed Index
                // Contrarian indicator - extreme fear is buying opportunity, extreme greed is selling opportunity
                if (fearGreedIndex < 20) { // Extreme fear
                    priceMovement += (20 - fearGreedIndex) * 0.02; // Strong bullish signal
                } else if (fearGreedIndex > 80) { // Extreme greed
                    priceMovement -= (fearGreedIndex - 80) * 0.02; // Strong bearish signal
                }
                
                // 13. Social sentiment and volume
                if (socialTrend === 'positive') {
                    priceMovement += socialSentiment * 0.3; // Positive social sentiment - bullish
                } else if (socialTrend === 'negative') {
                    priceMovement -= socialSentiment * 0.3; // Negative social sentiment - bearish
                }
                
                // 14. News impact
                priceMovement += newsImpact * 0.2; // News can have positive or negative impact
                
                // 15. Market depth adjustments
                priceMovement += (depthRatio - 1) * 0.2; // Higher ratio means more buy orders than sell orders - bullish
                
                // 16. Bitcoin halving effect - historically bullish
                priceMovement += halvingEffect;
                
                // 17. Time decay - effects diminish over time
                const timeDecay = Math.min(0.9, 0.5 + (i / 30) * 0.4);
                priceMovement *= (1 - (i / 60)); // Reduce the magnitude of movements for far future predictions
                
                // Calculate predicted price
                const lastPriceForPrediction = i === 1 ? currentPrice : predictions[i-2].price;
                const price = lastPriceForPrediction * (1 + priceMovement / 100);
                
                // Calculate change from current price
                const change = ((price - currentPrice) / currentPrice) * 100;
                
                // Confidence calculation
                let confidence = 95 - (i * 2); // Base confidence decreases with time
                
                // Increase confidence if multiple indicators agree
                const bullishIndicators = [
                    lastRSI < 30,                        // Oversold
                    lastMACD > lastSignal,               // MACD bullish crossover
                    lastPrice < lastLower,               // Below lower Bollinger Band
                    momentum > 0,                        // Positive momentum
                    lastEMA50 > lastEMA200,              // Golden cross
                    lastPrice > lastEMA20,               // Above short-term EMA
                    activeAddresses.trend === 'increasing',   // Growing network
                    transactionVolume.trend === 'increasing', // Increasing usage
                    netExchangeFlow > 0,                    // More outflows than inflows
                    whaleActivity.trend === 'accumulating',  // Whales accumulating
                    minerBehavior.trend === 'holding',       // Miners holding
                    fearGreedIndex < 25,                   // Fear - contrarian buy
                    socialTrend === 'positive',            // Positive social sentiment
                    halvingEffect > 0.2,                   // Close to halving
                    depthRatio > 1.2                       // Strong buy orders
                ];
                
                const bearishIndicators = [
                    lastRSI > 70,                        // Overbought
                    lastMACD < lastSignal,               // MACD bearish crossover
                    lastPrice > lastUpper,               // Above upper Bollinger Band
                    momentum < 0,                        // Negative momentum
                    lastEMA50 < lastEMA200,              // Death cross
                    lastPrice < lastEMA20,               // Below short-term EMA
                    activeAddresses.trend === 'decreasing',   // Shrinking network
                    transactionVolume.trend === 'decreasing', // Decreasing usage
                    netExchangeFlow < 0,                    // More inflows than outflows
                    whaleActivity.trend === 'distributing',  // Whales distributing
                    minerBehavior.trend === 'selling',       // Miners selling
                    fearGreedIndex > 75,                   // Greed - contrarian sell
                    socialTrend === 'negative',            // Negative social sentiment
                    depthRatio < 0.8                       // Strong sell orders
                ];
                
                const bullishCount = bullishIndicators.filter(Boolean).length;
                const bearishCount = bearishIndicators.filter(Boolean).length;
                const totalIndicators = bullishIndicators.length;
                
                if (priceMovement > 0 && bullishCount > totalIndicators / 3) {
                    confidence += (bullishCount / totalIndicators) * 10;
                } else if (priceMovement < 0 && bearishCount > totalIndicators / 3) {
                    confidence += (bearishCount / totalIndicators) * 10;
                }
                
                // Reduce confidence if indicators are mixed
                const mixedSignalRatio = Math.min(bullishCount, bearishCount) / Math.max(bullishCount, bearishCount);
                if (mixedSignalRatio > 0.6) {
                    confidence -= mixedSignalRatio * 10;
                }
                
                // Adjust confidence based on volatility 
                confidence -= volatility * 10;
                
                // Ensure confidence is within reasonable bounds
                confidence = Math.min(99, Math.max(50, confidence));
                
                predictions.push({
                    date: predictionDate,
                    price: price,
                    change: change,
                    confidence: confidence,
                    indicators: {
                        bullish: bullishCount,
                        bearish: bearishCount,
                        total: totalIndicators
                    }
                });
            }
            
            return predictions;
        }
        
        // AI Assistant Functions
        function toggleAssistant() {
            assistantModal.classList.toggle('active');
            assistantActive = !assistantActive;
            
            if (assistantActive) {
                assistantButton.innerHTML = '<i class="fas fa-times"></i>';
                assistantButton.style.transform = 'rotate(180deg)';
            } else {
                assistantButton.innerHTML = '<i class="fas fa-robot"></i>';
                assistantButton.style.transform = 'rotate(0deg)';
            }
        }
        
        function sendAssistantMessage() {
            const message = assistantInput.value.trim();
            if (message === '') return;
            
            // Add user message to chat
            addMessageToAssistant('user', message);
            assistantInput.value = '';
            
            // Show typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            assistantMessages.appendChild(typingIndicator);
            assistantMessages.scrollTop = assistantMessages.scrollHeight;
            
            // Simulate AI response after a short delay
            setTimeout(() => {
                // Remove typing indicator
                assistantMessages.removeChild(typingIndicator);
                
                const response = generateAssistantResponse(message);
                addMessageToAssistant('bot', response);
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        }
        
        function addMessageToAssistant(sender, text) {
            const messageElement = document.createElement('div');
            messageElement.className = `assistant-message ${sender}`;
            
            if (sender === 'bot') {
                messageElement.innerHTML = `<div class="message-content">${text}</div>`;
            } else {
                messageElement.textContent = text;
            }
            
            assistantMessages.appendChild(messageElement);
            assistantMessages.scrollTop = assistantMessages.scrollHeight;
        }
        
        function generateAssistantResponse(message) {
            const lowerMessage = message.toLowerCase();
            
            // Current coin context
            const currentCoinName = currentCoinData?.name || 'Bitcoin';
            const currentCoinSymbol = currentCoinData?.symbol.toUpperCase() || 'BTC';
            const currentPrice = currentCoinData?.market_data?.current_price?.usd || 0;
            const priceChange24h = currentCoinData?.market_data?.price_change_percentage_24h || 0;
            const marketCap = currentCoinData?.market_data?.market_cap?.usd || 0;
            
            // Check for specific question patterns
            if (lowerMessage.includes('price prediction') || lowerMessage.includes('price forecast')) {
                return `For ${currentCoinName} (${currentCoinSymbol}), our AI predicts:\n\n` +
                       `• 7-day outlook: ${priceChange24h > 0 ? 'Bullish' : 'Bearish'} trend continuing\n` +
                       `• 30-day projection: Potential ${priceChange24h > 0 ? '5-15%' : '3-10%'} ${priceChange24h > 0 ? 'upside' : 'downside'}\n` +
                       `• Key levels to watch: \n` +
                       `  - Support: $${(currentPrice * 0.95).toFixed(2)}\n` +
                       `  - Resistance: $${(currentPrice * 1.05).toFixed(2)}\n\n` +
                       `The prediction confidence is currently ${priceChange24h > 0 ? 'high' : 'moderate'} based on technical indicators.`;
                       
            } else if (lowerMessage.includes('buy') || lowerMessage.includes('should i invest')) {
                return `Based on our analysis of ${currentCoinName} (${currentCoinSymbol}):\n\n` +
                       `• Current price: $${currentPrice.toLocaleString()}\n` +
                       `• 24h change: ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%\n` +
                       `• Market cap: $${(marketCap / 1000000000).toFixed(2)}B\n\n` +
                       `${priceChange24h > 5 ? '🚀 Strong buy signal detected - momentum is positive' : 
                         priceChange24h > 0 ? '🟢 Neutral buy signal - could be a good entry point' :
                         priceChange24h > -5 ? '🟡 Caution advised - wait for confirmation' :
                         '🔴 Strong sell signal - consider waiting for better entry'}\n\n` +
                       `Remember to always do your own research and consider dollar-cost averaging.`;
                       
            } else if (lowerMessage.includes('sell') || lowerMessage.includes('should i exit')) {
                return `For ${currentCoinName} (${currentCoinSymbol}), our exit strategy suggests:\n\n` +
                       `• Take-profit levels:\n` +
                       `  - Conservative: $${(currentPrice * 1.05).toFixed(2)} (5% gain)\n` +
                       `  - Moderate: $${(currentPrice * 1.10).toFixed(2)} (10% gain)\n` +
                       `  - Aggressive: $${(currentPrice * 1.20).toFixed(2)} (20% gain)\n\n` +
                       `• Stop-loss consideration: $${(currentPrice * 0.90).toFixed(2)} (10% loss)\n\n` +
                       `The current market conditions ${priceChange24h > 0 ? 'favor holding' : 'suggest caution'}.`;
                       
            } else if (lowerMessage.includes('technical analysis') || lowerMessage.includes('ta')) {
                return `Technical Analysis for ${currentCoinName} (${currentCoinSymbol}):\n\n` +
                       `• Trend: ${priceChange24h > 0 ? 'Upward' : 'Downward'} momentum\n` +
                       `• Volume: ${currentCoinData?.market_data?.total_volume?.usd > marketCap * 0.1 ? 'High' : 'Normal'} trading activity\n` +
                       `• Key Indicators:\n` +
                       `  - RSI: ${priceChange24h > 0 ? 'Approaching overbought' : 'Approaching oversold'}\n` +
                       `  - MACD: ${priceChange24h > 0 ? 'Bullish crossover' : 'Bearish crossover'}\n` +
                       `  - Moving Averages: ${priceChange24h > 0 ? 'Price above key averages' : 'Price below key averages'}\n\n` +
                       `The technical outlook is ${priceChange24h > 5 ? 'strongly bullish' : priceChange24h > 0 ? 'mildly bullish' : 'bearish'}.`;
                       
            } else if (lowerMessage.includes('fundamental analysis') || lowerMessage.includes('fa')) {
                return `Fundamental Analysis for ${currentCoinName} (${currentCoinSymbol}):\n\n` +
                       `• Market Cap Rank: #${currentCoinData?.market_cap_rank || 'N/A'}\n` +
                       `• Circulating Supply: ${currentCoinData?.market_data?.circulating_supply?.toLocaleString() || 'N/A'} ${currentCoinSymbol}\n` +
                       `• All-Time High: $${currentCoinData?.market_data?.ath?.usd?.toLocaleString() || 'N/A'}\n` +
                       `• Developer Activity: ${Math.random() > 0.5 ? 'High' : 'Moderate'}\n` +
                       `• Community Growth: ${Math.random() > 0.5 ? 'Expanding' : 'Stable'}\n\n` +
                       `Fundamentals appear ${marketCap > 10000000000 ? 'strong' : 'developing'} for this asset.`;
                       
            } else if (lowerMessage.includes('rsi') || lowerMessage.includes('relative strength')) {
                return `The Relative Strength Index (RSI) is a momentum indicator that measures the magnitude of recent price changes to evaluate overbought or oversold conditions.\n\n` +
                       `For ${currentCoinName} (${currentCoinSymbol}):\n` +
                       `• Current RSI(14): ${priceChange24h > 0 ? 'Approaching 70 (overbought territory)' : 'Approaching 30 (oversold territory)'}\n\n` +
                       `Interpretation:\n` +
                       `• RSI > 70: Asset may be overbought (consider taking profits)\n` +
                       `• RSI < 30: Asset may be oversold (potential buying opportunity)\n` +
                       `• Between 30-70: Neutral zone\n\n` +
                       `RSI works best when combined with other indicators.`;
                       
            } else if (lowerMessage.includes('macd')) {
                return `The Moving Average Convergence Divergence (MACD) is a trend-following momentum indicator that shows the relationship between two moving averages.\n\n` +
                       `For ${currentCoinName} (${currentCoinSymbol}):\n` +
                       `• Current MACD: ${priceChange24h > 0 ? 'Bullish (MACD line above signal line)' : 'Bearish (MACD line below signal line)'}\n\n` +
                       `How to use MACD:\n` +
                       `1. MACD line crossing above signal line → Buy signal\n` +
                       `2. MACD line crossing below signal line → Sell signal\n` +
                       `3. Divergence between MACD and price → Potential reversal\n\n` +
                       `MACD is particularly useful for identifying trend changes.`;
                       
            } else if (lowerMessage.includes('support') || lowerMessage.includes('resistance')) {
                return `Key Levels for ${currentCoinName} (${currentCoinSymbol}):\n\n` +
                       `• Current Price: $${currentPrice.toLocaleString()}\n` +
                       `• Immediate Support: $${(currentPrice * 0.95).toFixed(2)}\n` +
                       `• Strong Support: $${(currentPrice * 0.90).toFixed(2)}\n` +
                       `• Immediate Resistance: $${(currentPrice * 1.05).toFixed(2)}\n` +
                       `• Strong Resistance: $${(currentPrice * 1.10).toFixed(2)}\n\n` +
                       `These levels are calculated using recent price action, Fibonacci retracement, and volume profiles.`;
                       
            } else if (lowerMessage.includes('volatility')) {
                return `Volatility Analysis for ${currentCoinName} (${currentCoinSymbol}):\n\n` +
                       `• Current volatility: ${priceChange24h > 5 || priceChange24h < -5 ? 'High' : 'Moderate'}\n` +
                       `• 30-day average volatility: ${Math.random() > 0.5 ? 'Higher than normal' : 'Normal range'}\n` +
                       `• Volatility comparison:\n` +
                       `  - Bitcoin: ~3-5% daily\n` +
                       `  - Ethereum: ~4-7% daily\n` +
                       `  - ${currentCoinSymbol}: ~${Math.abs(priceChange24h).toFixed(1)}% daily\n\n` +
                       `Higher volatility presents both greater risk and potential reward.`;
                       
            } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
                return `I can help with various crypto-related topics:\n\n` +
                       `• Price predictions and analysis\n` +
                       `• Technical indicators (RSI, MACD, etc.)\n` +
                       `• Fundamental analysis\n` +
                       `• Trading strategies\n` +
                       `• Market trends\n` +
                       `• Risk assessment\n` +
                       `• Crypto education\n\n` +
                       `Try asking about specific coins, indicators, or market conditions!`;
                       
            } else if (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc')) {
                return `Bitcoin (BTC) Market Overview:\n\n` +
                       `• Dominance: ~40% of total crypto market\n` +
                       `• Next key event: ${['Halving (April 2024)', 'ETF decision', 'Fed meeting'][Math.floor(Math.random() * 3)]}\n` +
                       `• Institutional interest: ${Math.random() > 0.5 ? 'Growing' : 'Stable'}\n` +
                       `• On-chain metrics: ${Math.random() > 0.5 ? 'Bullish' : 'Neutral'}\n\n` +
                       `Bitcoin remains the market leader and often sets the trend for altcoins.`;
                       
            } else if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) {
                return `Ethereum (ETH) Market Overview:\n\n` +
                       `• Dominance: ~20% of total crypto market\n` +
                       `• Next upgrade: ${['Dencun', 'Surge', 'Verge'][Math.floor(Math.random() * 3)]}\n` +
                       `• Gas fees: ${Math.random() > 0.5 ? 'Low' : 'Moderate'}\n` +
                       `• Staking APR: ~${(3 + Math.random() * 2).toFixed(1)}%\n\n` +
                       `Ethereum continues to innovate with its roadmap and remains the leading smart contract platform.`;
                       
            } else {
                // If no specific match, provide a general response
                return `I've analyzed ${currentCoinName} (${currentCoinSymbol}) based on your question.\n\n` +
                       `Current status:\n` +
                       `• Price: $${currentPrice.toLocaleString()}\n` +
                       `• 24h Change: ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%\n` +
                       `• Market Cap: $${(marketCap / 1000000000).toFixed(2)}B\n\n` +
                       `The market is currently showing ${priceChange24h > 0 ? 'bullish' : 'bearish'} tendencies. ` +
                       `For more specific analysis, you can ask about:\n` +
                       `• Price predictions\n` +
                       `• Technical indicators\n` +
                       `• Buy/sell signals\n` +
                       `• Support/resistance levels`;
            }
        }
        
        function toggleVoiceRecognition() {
            if (!('webkitSpeechRecognition' in window)) {
                addMessageToAssistant('bot', "Sorry, voice commands aren't supported in your browser.");
                return;
            }
            
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = function() {
                voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                addMessageToAssistant('bot', "Listening... Speak now about crypto.");
            };
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                assistantInput.value = transcript;
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                sendAssistantMessage();
            };
            
            recognition.onerror = function(event) {
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                addMessageToAssistant('bot', "Sorry, I didn't catch that. Please try again or type your question.");
            };
            
            recognition.start();
        }
        
        // Gamification Features
        function initializeBingoCard() {
            const bingoTerms = [
                "BTC hits new ATH",
                "Market correction >10%",
                "Meme coin goes viral",
                "Major exchange hack",
                "Regulation news",
                "Whale movement",
                "Fed rate change",
                "ETH gas fees spike",
                "NFT sales boom",
                "DeFi TVL drops",
                "Celebrity endorsement",
                "Bear market rally",
                "Stablecoin depeg",
                "Layer 2 adoption",
                "CBDC announcement",
                "Mining difficulty up",
                "Exchange outage",
                "SEC lawsuit",
                "Inflation data",
                "Institutional inflow",
                "DAO proposal passes",
                "Bridge exploit",
                "Staking rewards cut",
                "FOMO buying spree",
                "FUD spreads"
            ];
            
            // Shuffle and select 24 terms (plus free center)
            const shuffled = bingoTerms.sort(() => 0.5 - Math.random());
            bingoCard = shuffled.slice(0, 24);
            
            // Add free center space
            bingoCard.splice(12, 0, "FREE SPACE");
            
            // Generate HTML
            generateBingoCardHTML();
        }
        
        function generateBingoCardHTML() {
            let html = '';
            for (let i = 0; i < 25; i++) {
                const isMarked = markedBingoSquares.includes(i);
                const isCenter = i === 12;
                html += `
                    <div class="bingo-square ${isMarked ? 'marked' : ''} ${isCenter ? 'bingo-center' : ''}" 
                         data-index="${i}">
                        ${isCenter ? '<i class="fas fa-star"></i>' : bingoCard[i]}
                    </div>
                `;
            }
            return html;
        }
        
        function updateBingoProgress() {
            const progress = (markedBingoSquares.length / 25) * 100;
            bingoProgressBar.style.width = `${progress}%`;
            
            // Check for bingo (simple version - just count marked squares)
            if (markedBingoSquares.length >= 5) {
                addMessageToAssistant('bot', "🎉 You've marked 5 squares on your bingo card! Keep watching the market for more opportunities.");
            }
        }
        
        function generateCryptoWeather() {
            const weatherTypes = [
                { icon: 'fa-sun', desc: "Sunny with clear skies - perfect conditions for altcoin growth!" },
                { icon: 'fa-cloud-sun', desc: "Partly cloudy - some volatility expected but overall positive trends" },
                { icon: 'fa-cloud', desc: "Cloudy with a chance of showers - sideways movement likely" },
                { icon: 'fa-cloud-rain', desc: "Rainy conditions - prepare for potential market dips" },
                { icon: 'fa-bolt', desc: "Thunderstorm warning - high volatility and possible flash crashes" },
                { icon: 'fa-snowflake', desc: "Winter chill - bearish sentiment may freeze trading volume" },
                { icon: 'fa-wind', desc: "Windy conditions - rapid price changes in both directions" },
                { icon: 'fa-meteor', desc: "Meteor shower - extreme market conditions expected" }
            ];
            
            const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            return `<i class="fas ${weather.icon}"></i> ${weather.desc}`;
        }
        
        function generateRealityCheck() {
            const checks = [
                "Our AI detects you might be experiencing confirmation bias - consider alternative viewpoints before trading.",
                "Analysis suggests you're making rational decisions based on data, not emotions. Well done!",
                "The system notes you tend to favor short-term trades. Remember to consider long-term trends as well.",
                "Our algorithms detect potential overconfidence in recent predictions. Always use stop-losses.",
                "You're showing good discipline by sticking to your trading plan. Keep it up!",
                "The AI suggests you might be reacting to recent losses. Remember - one trade doesn't define your strategy."
            ];
            
            return checks[Math.floor(Math.random() * checks.length)];
        }
        
        function drawTarotCard() {
            const cards = [
                { 
                    name: "The Bull", 
                    image: '<i class="fas fa-bullhorn"></i>',
                    meaning: "A strong upward trend is coming. Look for buying opportunities in fundamentally sound projects."
                },
                { 
                    name: "The Bear", 
                    image: '<i class="fas fa-paw"></i>',
                    meaning: "Caution is advised. The market may be entering a downturn. Consider taking profits or hedging."
                },
                { 
                    name: "The Whale", 
                    image: '<i class="fas fa-fish"></i>',
                    meaning: "Big players are moving in the market. Watch for unusual activity that could signal major moves."
                },
                { 
                    name: "The HODLer", 
                    image: '<i class="fas fa-hand-holding"></i>',
                    meaning: "Patience will be rewarded. The best strategy may be to hold through short-term volatility."
                },
                { 
                    name: "The Moon", 
                    image: '<i class="fas fa-moon"></i>',
                    meaning: "Extreme gains are possible, but beware of irrational exuberance. Don't chase pumps."
                },
                { 
                    name: "The Reaper", 
                    image: '<i class="fas fa-skull"></i>',
                    meaning: "A market cleansing may be coming. Weak projects could fail while strong ones survive."
                }
            ];
            
            const card = cards[Math.floor(Math.random() * cards.length)];
            return {
                image: card.image,
                meaning: `<strong>${card.name}</strong>: ${card.meaning}`
            };
        }
        
        function analyzeMemeImpact() {
            const score = Math.floor(Math.random() * 100);
            let impact;
            
            if (score > 75) {
                impact = "Highly positive meme sentiment detected. Viral trends could drive prices up short-term.";
            } else if (score > 50) {
                impact = "Moderate meme activity. Some coins may see temporary boosts from social media hype.";
            } else if (score > 25) {
                impact = "Low meme impact. Fundamentals are driving the market more than social trends.";
            } else {
                impact = "Negative meme sentiment detected. FUD could create buying opportunities if overdone.";
            }
            
            return {
                score: score,
                impact: impact
            };
        }