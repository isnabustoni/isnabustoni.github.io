const API_KEY = "d755l2hr01qg1eo7nhlgd755l2hr01qg1eo7nhm0";
let watchlist = [];

async function fetchStock(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`
  );
  return await res.json();
}

async function searchStocks(query) {
  const res = await fetch(
    `https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`
  );
  return await res.json();
}


document.getElementById("searchStock").addEventListener("input", async (e) => {
  const query = e.target.value.trim();

  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = "";

  if (query.length < 2) return;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`
    );

    const data = await res.json();

    if (!data.result || data.result.length === 0) {
      suggestions.innerHTML = "<p>No results</p>";
      return;
    }

    data.result.slice(0, 5).forEach(stock => {
      const div = document.createElement("div");
      div.className = "card";
      div.style.cursor = "pointer";

      div.innerHTML = `
        <strong>${stock.symbol}</strong><br/>
        <small>${stock.description}</small>
      `;

      div.addEventListener("click", () => {
        selectStock(stock.symbol);
        
      });

 

      suggestions.appendChild(div);
    });

  } catch (err) {
    console.error("Search error:", err);
    suggestions.innerHTML = "<p>Error loading data</p>";
  }
});


async function selectStock(ticker) {
  document.getElementById("selectedStock").innerText = ticker;

  const history = await getHistory(ticker);
  const prices = history.c;

  drawChart(ticker);
  drawRSI(prices);

  const indicators = calculateIndicators(prices);
  const fundamentals = await getFundamentals(ticker);

  renderDetails(indicators, fundamentals, ticker);
}


async function addStock() {
  const ticker = document.getElementById("ticker").value;
  const data = await fetchStock(ticker);

  const trend = data.c > data.pc ? "bullish" : "bearish";

  watchlist.push({ ticker, data, trend });
  render();
}

function render() {
  const container = document.getElementById("watchlist");
  container.innerHTML = "";

  watchlist.forEach(stock => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${stock.ticker}</h3>
      <p class="${stock.trend}">
        Price: $${stock.data.c}
      </p>
    `;

    container.appendChild(div);
  });
}

function simulate() {
  const Q1 = parseFloat(document.getElementById("currentShares").value);
  const P1 = parseFloat(document.getElementById("avgPrice").value);
  const target = parseFloat(document.getElementById("targetAvg").value);
  const P2 = parseFloat(document.getElementById("currentPrice").value);

  const Q2 = (Q1 * (P1 - target)) / (target - P2);

  document.getElementById("result").innerText =
    `Buy ${Math.ceil(Q2)} shares to reach target average`;
}


function movingAverage(prices, period = 14) {
  return prices.slice(-period).reduce((a,b)=>a+b,0)/period;
}

function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;

  for (let i = 1; i < period; i++) {
    let diff = prices[i] - prices[i-1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function recommend(stock, profile) {
  let reasons = [];

  if (profile === "dividend") {
    if (stock.dividendYield > 3) reasons.push("High dividend");
    if (stock.pe < 20) reasons.push("Undervalued");
  }

  if (stock.rsi < 30) reasons.push("Oversold → good entry");

  return reasons.length > 0
    ? "✅ Good buy: " + reasons.join(", ")
    : "⚠️ Wait";
}

