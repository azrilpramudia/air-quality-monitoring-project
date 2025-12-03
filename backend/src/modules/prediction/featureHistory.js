// Keep last 2 values per sensor in memory
const history = {
  temp_c: [],
  rh_pct: [],
  tvoc_ppb: [],
  eco2_ppm: [],
  dust_ugm3: [],
};

export function updateHistory(current) {
  for (const key of Object.keys(history)) {
    const val = current[key];
    if (typeof val === "number" && !Number.isNaN(val)) {
      history[key].unshift(val); // add as newest
      if (history[key].length > 2) {
        history[key].pop(); // keep only 2 lags
      }
    }
  }
}

export function getHistory() {
  return history;
}
