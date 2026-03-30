const API_KEY = "d755d69r01qg1eo7meq0d755d69r01qg1eo7meqg";
let watchlist = [];

async function fetchStock(ticker) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`
  );
  return await res.json();
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
