const API_KEY = "d755l2hr01qg1eo7nhlgd755l2hr01qg1eo7nhm0";

let watchlist = [];
let priceChart;
let rsiChart;


const STOCK_LIST = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "META", name: "Meta" },
  { symbol: "NESN.SW", name: "Nestlé (Swiss)" },
  { symbol: "ROG.SW", name: "Roche (Swiss)" }
];



/* =========================
   🔍 SEARCH STOCKS
========================= */

document.getElementById("searchStock").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const suggestions = document.getElementById("suggestions");

  suggestions.innerHTML = "";

  if (query.length < 1) return;

  const results = STOCK_LIST.filter(stock =>
    stock.symbol.toLowerCase().includes(query) ||
    stock.name.toLowerCase().includes(query)
  );

  results.slice(0, 5).forEach(stock => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <strong>${stock.symbol}</strong><br/>
      <small>${stock.name}</small>
    `;

    div.addEventListener("click", () => {
      selectStock(stock.symbol);
      suggestions.innerHTML = "";
    });

    suggestions.appendChild(div);
  });
});

/* =========================
   📊 SELECT STOCK
========================= */

async function selectStock(ticker) {
  document.getElementById("selectedStock").innerText = ticker;

  const history = await getHistory(ticker);
  const prices = history.c;

  if (!prices || prices.length === 0) {
    alert("No data available");
    return;
  }

  drawChart(ticker, prices);
  drawRSI(prices);

  const indicators = calculateIndicators(prices);
  const fundamentals = await getFundamentals(ticker);

  renderDetails(indicators, fundamentals, ticker);
}


/* =========================
   📈 GET HISTORICAL DATA
========================= */

async function getHistory(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;

    const res = await fetch(url);
    const data = await res.json();

    const result = data.chart.result[0];

    const prices = result.indicators.quote[0].close;

    return { c: prices };

  } catch (err) {
    console.error("Yahoo error:", err);
    return { c: [] };
  }
}

/* =========================
   📈 PRICE CHART
========================= */

function drawChart(ticker, prices) {
  const ctx = document.getElementById("priceChart");

  if (!ctx) return;

  if (priceChart) priceChart.destroy();

  priceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        label: ticker,
        data: prices,
        borderColor: "#00ff9c",
        tension: 0.2
      }]
    }
  });
}


/* =========================
   📉 RSI
========================= */

function calculateRSI(prices, period = 14) {
  if (prices.length < period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];

    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

function drawRSI(prices) {
  const ctx = document.getElementById("rsiChart");

  if (!ctx) return;

  const rsiValues = prices.map((_, i) =>
    i > 14 ? calculateRSI(prices.slice(0, i)) : null
  );

  if (rsiChart) rsiChart.destroy();

  rsiChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        label: "RSI",
        data: rsiValues,
        borderColor: "#facc15"
      }]
    }
  });
}


/* =========================
   📊 INDICATORS
========================= */

function movingAverage(prices, period = 20) {
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateIndicators(prices) {
  const ma = movingAverage(prices);
  const rsi = calculateRSI(prices);
  const currentPrice = prices[prices.length - 1];

  const trend = currentPrice > ma ? "Bullish" : "Bearish";

  return { ma, rsi, trend, currentPrice };
}


/* =========================
   💰 FUNDAMENTALS
========================= */
async function getFundamentals(ticker) {
  return {
    pe: null,
    dividend: null
  };
}


/* =========================
   🧾 RENDER DETAILS
========================= */

function renderDetails(ind, fund, ticker) {
  const trendColor = ind.trend === "Bullish" ? "bullish" : "bearish";

  document.getElementById("stockDetails").innerHTML = `
    <div class="card">
      <h3>${ticker}</h3>

      <p class="${trendColor}">
        Trend: ${ind.trend}
      </p>

      <p>Price: $${ind.currentPrice.toFixed(2)}</p>
      <p>Moving Avg: $${ind.ma.toFixed(2)}</p>
      <p>RSI: ${ind.rsi.toFixed(2)}</p>

      <hr/>

      <p>P/E Ratio: ${fund.pe ? fund.pe.toFixed(2) : "N/A"}</p>
      <p>Dividend Yield: ${fund.dividend ? fund.dividend.toFixed(2) + "%" : "N/A"}</p>

      <hr/>

      <h4>🔔 Price Alert</h4>
      <input id="alertPrice" placeholder="Enter price"/>
      <button onclick="setAlert('${ticker}')">Set Alert</button>

      <p id="alertMsg"></p>
    </div>
  `;
}


/* =========================
   🔔 ALERT SYSTEM
========================= */

let alerts = [];

function setAlert(ticker) {
  const price = parseFloat(document.getElementById("alertPrice").value);

  if (!price) return;

  alerts.push({ ticker, price });

  document.getElementById("alertMsg").innerText =
    `Alert set at $${price}`;
}

setInterval(async () => {
  for (let alertItem of alerts) {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${alertItem.ticker}&token=${API_KEY}`
    );

    const data = await res.json();

    if (data.c >= alertItem.price) {
      alert(`🚨 ${alertItem.ticker} reached $${alertItem.price}`);
    }
  }
}, 10000);


/* =========================
   📊 WATCHLIST
========================= */

async function addStock() {
  const ticker = document.getElementById("ticker").value;
  const data = await fetchStock(ticker);

  const trend = data.c > data.pc ? "bullish" : "bearish";

  watchlist.push({ ticker, data, trend });
  renderWatchlist();
}

function renderWatchlist() {
  const container = document.getElementById("watchlist");
  container.innerHTML = "";

  watchlist.forEach(stock => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${stock.ticker}</h3>
      <p class="${stock.trend}">
        $${stock.data.c}
      </p>
    `;

    div.addEventListener("click", () => {
      selectStock(stock.ticker);
    });

    container.appendChild(div);
  });
}

async function fetchStock(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`
  );
  return await res.json();
}


/* =========================
   🧮 SIMULATION
========================= */

function simulate() {
  const Q1 = parseFloat(document.getElementById("currentShares").value);
  const P1 = parseFloat(document.getElementById("avgPrice").value);
  const target = parseFloat(document.getElementById("targetAvg").value);
  const P2 = parseFloat(document.getElementById("currentPrice").value);

  const Q2 = (Q1 * (P1 - target)) / (target - P2);

  document.getElementById("result").innerText =
    `Buy ${Math.ceil(Q2)} shares`;
}
