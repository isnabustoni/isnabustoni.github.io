async function getHistory(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&count=100&token=${API_KEY}`
  );
  return await res.json();
}

let priceChart;

async function drawChart(ticker) {
  const data = await getHistory(ticker);

  const prices = data.c;
  const labels = data.t.map(t => new Date(t * 1000).toLocaleDateString());

  const ctx = document.getElementById("priceChart");

  if (priceChart) priceChart.destroy();

  priceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: ticker,
        data: prices,
        borderColor: "#00ff9c",
        tension: 0.2
      }]
    }
  });

  drawRSI(prices);
}

function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

let rsiChart;

function drawRSI(prices) {
  const rsiValues = prices.map((_, i) =>
    i > 14 ? calculateRSI(prices.slice(0, i)) : null
  );

  const ctx = document.getElementById("rsiChart");

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

function selectStock(ticker) {
  document.getElementById("selectedStock").innerText = ticker;

  drawChart(ticker);
  loadDetails(ticker);
}

async function loadDetails(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`
  );

  const data = await res.json();

  const trend = data.c > data.pc ? "bullish" : "bearish";

  document.getElementById("stockDetails").innerHTML = `
    <p class="${trend}">Price: $${data.c}</p>
    <p>Previous Close: $${data.pc}</p>
  `;
}

