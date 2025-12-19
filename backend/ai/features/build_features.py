"""
build_features.py
=================
Single source of truth for feature engineering.
Used by:
- Training
- Prediction (inference)
"""

from __future__ import annotations
import numpy as np
import pandas as pd
from typing import List, Dict

# ======================================================
# CONFIG
# ======================================================

BASE_COLS = [
    "temp_c",
    "rh_pct",
    "tvoc_ppb",
    "eco2_ppm",
    "dust_ugm3",
]

# Lags in HOURS (for hourly model)
LAGS = [1, 2, 3, 6, 12, 24]

# Rolling windows in HOURS
ROLL_WINDOWS = [3, 6, 12, 24]

# ======================================================
# FEATURE NAME GENERATOR
# ======================================================

def get_feature_names() -> List[str]:
    feats = []

    # Base (latest value)
    for c in BASE_COLS:
        feats.append(c)

    # Lag features
    for c in BASE_COLS:
        for l in LAGS:
            feats.append(f"{c}_lag_{l}")

    # Rolling statistics
    for c in BASE_COLS:
        for w in ROLL_WINDOWS:
            feats.append(f"{c}_roll_mean_{w}")
            feats.append(f"{c}_roll_std_{w}")

    # Time features
    feats += [
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos",
    ]

    return feats


# ======================================================
# FEATURE BUILDER
# ======================================================

def build_features(
    df: pd.DataFrame,
    freq: str = "1H",
    fillna: bool = True,
) -> pd.DataFrame:
    """
    Build ML features from historical dataframe.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain:
        - datetime index
        - BASE_COLS
    freq : str
        Expected frequency ("1H")
    fillna : bool
        Forward/backward fill missing values

    Returns
    -------
    pd.DataFrame
        Feature dataframe (rows aligned with df)
    """

    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError("DataFrame index must be DatetimeIndex")

    # Sort & resample to fixed freq
    df = df.sort_index()
    df = df.asfreq(freq)

    if fillna:
        df = df.ffill().bfill()

    feats: Dict[str, pd.Series] = {}

    # ------------------------------
    # Base features (current value)
    # ------------------------------
    for c in BASE_COLS:
        feats[c] = df[c]

    # ------------------------------
    # Lag features
    # ------------------------------
    for c in BASE_COLS:
        for l in LAGS:
            feats[f"{c}_lag_{l}"] = df[c].shift(l)

    # ------------------------------
    # Rolling features
    # ------------------------------
    for c in BASE_COLS:
        for w in ROLL_WINDOWS:
            feats[f"{c}_roll_mean_{w}"] = df[c].rolling(w).mean()
            feats[f"{c}_roll_std_{w}"] = df[c].rolling(w).std()

    # ------------------------------
    # Time-based cyclical features
    # ------------------------------
    hour = df.index.hour.astype(float)
    dow = df.index.dayofweek.astype(float)

    feats["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    feats["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    feats["dow_sin"] = np.sin(2 * np.pi * dow / 7)
    feats["dow_cos"] = np.cos(2 * np.pi * dow / 7)

    # ------------------------------
    # Assemble dataframe
    # ------------------------------
    X = pd.DataFrame(feats, index=df.index)

    # Ensure column order is FIXED
    feature_names = get_feature_names()
    X = X.reindex(columns=feature_names)

    # Final NA handling
    if fillna:
        X = X.ffill().bfill()

    return X


# ======================================================
# UTILITY
# ======================================================

def build_latest_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build features and return only the LAST ROW
    (used for prediction)

    Returns shape: (1, n_features)
    """
    X = build_features(df)
    return X.iloc[[-1]]


# ======================================================
# SELF TEST
# ======================================================

if __name__ == "__main__":
    # Simple self-test
    idx = pd.date_range("2025-01-01", periods=48, freq="1H")
    df_test = pd.DataFrame(
        {
            "temp_c": np.random.rand(48) * 10 + 25,
            "rh_pct": np.random.rand(48) * 20 + 50,
            "tvoc_ppb": np.random.rand(48) * 500 + 300,
            "eco2_ppm": np.random.rand(48) * 300 + 700,
            "dust_ugm3": np.random.rand(48) * 50 + 100,
        },
        index=idx,
    )

    X = build_latest_features(df_test)
    print("Feature shape:", X.shape)
    print("Feature columns:", len(get_feature_names()))
