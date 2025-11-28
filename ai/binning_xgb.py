# contoh_binning_xgb.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import KBinsDiscretizer
from sklearn.multioutput import MultiOutputClassifier
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, confusion_matrix

# 1. load data
df = pd.read_csv('data/sensor.csv')  # ganti path sesuai
# asumsikan df sudah berisi fitur X dan target kolom 'temperature' dan 'tvoc'
feature_cols = ['sensor1','sensor2','sensor3']  # ganti sesuai
X = df[feature_cols].values
y_cont = df[['temperature','tvoc']].values

# 2. ubah continuous -> kelas (misal 3 kelas: low, mid, high) per target
n_bins = 3
# gunakan KBinsDiscretizer (strategy='quantile' menjaga proporsi)
kbd = KBinsDiscretizer(n_bins=n_bins, encode='ordinal', strategy='quantile')
y_binned = kbd.fit_transform(y_cont)  # shape (n_samples, 2), values 0..n_bins-1
y_binned = y_binned.astype(int)

# 3. train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y_binned, test_size=0.2, random_state=42)

# 4. MultiOutputClassifier dengan XGBClassifier
xgb_clf = XGBClassifier(
    objective='multi:softprob',
    num_class=n_bins,
    use_label_encoder=False,
    eval_metric='mlogloss',
    n_estimators=100,
    max_depth=4,
    random_state=42
)

multi_clf = MultiOutputClassifier(xgb_clf, n_jobs=1)  # n_jobs=-1 juga bisa
multi_clf.fit(X_train, y_train)

# 5. Evaluasi
y_pred = multi_clf.predict(X_test)
# Laporan per target
for i, col in enumerate(['temperature','tvoc']):
    print(f'===== Report untuk {col} =====')
    print(classification_report(y_test[:,i], y_pred[:,i]))
    print('Confusion matrix:\n', confusion_matrix(y_test[:,i], y_pred[:,i]))

# 6. contoh prediksi live -> konversi kembali ke label teks jika perlu
label_names = {0:'low', 1:'mid', 2:'high'}
sample = X_test[0:5]
pred_classes = multi_clf.predict(sample)
pred_named = [[label_names[c] for c in row] for row in pred_classes]
print(pred_named)
