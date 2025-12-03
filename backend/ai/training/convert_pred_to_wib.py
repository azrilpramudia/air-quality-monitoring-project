# convert_pred_to_wib.py
import pandas as pd
IN = "predictions/pred_7days_hourly_recursive.csv"
OUT = "predictions/pred_7days_hourly_recursive_wib.csv"

df = pd.read_csv(IN)
# parse timestamp (naive)
df['timestamp'] = pd.to_datetime(df['timestamp'])
# treat as UTC then convert to Asia/Jakarta (WIB)
df['timestamp'] = df['timestamp'].dt.tz_localize('UTC').dt.tz_convert('Asia/Jakarta')
# optional: drop timezone info and keep naive timestamps but shifted to WIB:
# df['timestamp'] = df['timestamp'].dt.tz_convert('Asia/Jakarta').dt.tz_localize(None)

# save (keep timezone info in ISO format including +07:00)
df.to_csv(OUT, index=False)
print("Saved:", OUT)
