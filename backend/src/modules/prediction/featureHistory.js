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
      history[key].unshift(val); // newest at index 0
      if (history[key].length > 2) {
        history[key].pop(); // keep only lag1, lag2
      }
    }
  }
}

export function getHistory() {
  return history;
}
