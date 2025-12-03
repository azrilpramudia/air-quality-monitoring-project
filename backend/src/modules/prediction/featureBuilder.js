import { getHistory } from "./featureHistory.js";

function getTimeFeatures(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();

  // use hour + fraction of hour (minute/60)
  const hour = date.getHours() + date.getMinutes() / 60;
  const sin_day = Math.sin((2 * Math.PI * hour) / 24);
  const cos_day = Math.cos((2 * Math.PI * hour) / 24);

  return { sin_day, cos_day };
}

export function buildFeatures(current) {
  const h = getHistory();
  const { sin_day, cos_day } = getTimeFeatures(current.timestamp);

  const temp = current.temp_c;
  const rh = current.rh_pct;
  const tvoc = current.tvoc_ppb;
  const eco2 = current.eco2_ppm;
  const dust = current.dust_ugm3;

  const safe = (arr, fallback) =>
    arr.length > 0 && typeof arr[0] === "number" ? arr[0] : fallback;

  const safe2 = (arr, fallback) =>
    arr.length > 1 && typeof arr[1] === "number" ? arr[1] : fallback;

  return [
    // current values
    temp,
    rh,
    tvoc,
    eco2,
    dust,

    // temp_c_lag1, temp_c_lag2
    safe(h.temp_c, temp),
    safe2(h.temp_c, temp),

    // rh_pct_lag1, rh_pct_lag2
    safe(h.rh_pct, rh),
    safe2(h.rh_pct, rh),

    // tvoc_ppb_lag1, tvoc_ppb_lag2
    safe(h.tvoc_ppb, tvoc),
    safe2(h.tvoc_ppb, tvoc),

    // eco2_ppm_lag1, eco2_ppm_lag2
    safe(h.eco2_ppm, eco2),
    safe2(h.eco2_ppm, eco2),

    // dust_ugm3_lag1, dust_ugm3_lag2
    safe(h.dust_ugm3, dust),
    safe2(h.dust_ugm3, dust),

    // sin_day, cos_day
    sin_day,
    cos_day,
  ];
}
