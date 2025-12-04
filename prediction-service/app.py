from flask import Flask, request, jsonify
from supabase import create_client, Client
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import numpy as np
import datetime # Import datetime ditaruh di atas biar rapi

app = Flask(__name__)

# ==============================================================================
# 1. KONFIGURASI SUPABASE
# ==============================================================================
url = "https://sqeprcowwnbivpnkdumu.supabase.co"

# ⚠️ PENTING: GANTI KEY DI BAWAH INI
# Jangan pakai "sb_publishable_..." (Itu untuk Frontend/Browser)
# Pakai Key yang awalan "ey..." (Cari di Supabase > Settings > API > anon public)
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZXByY293d25iaXZwbmtkdW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMzgsImV4cCI6MjA4MDQxMTMzOH0.pQ3mAAHYQrASNy0svLwoA1VdGN4j0_bnpCq4bguLt7Y"

print(f"Mencoba koneksi ke: {url}")

try:
    supabase: Client = create_client(url, key)
    print("✅ Berhasil! Supabase client sudah siap.")
except Exception as e:
    print(f"❌ Terjadi error koneksi Supabase: {e}")
    # Kita tidak exit, tapi nanti akan ketahuan saat ambil data

# ==============================================================================
# 2. FUNGSI AMBIL & OLAH DATA
# ==============================================================================
def get_training_data():
    print("⏳ Sedang mengambil data dari Supabase...")
    
    try:
        # Ambil data
        response = supabase.table('supermarket_sales').select("*").execute()
        data = response.data
    except Exception as e:
        print(f"❌ Gagal mengambil data: {e}")
        return pd.DataFrame()

    # Cek Data Kosong
    if not data:
        print("⚠️ PERINGATAN: Data kosong! Cek API Key atau matikan RLS di Supabase.")
        return pd.DataFrame()

    df = pd.DataFrame(data)
    print(f"✅ Berhasil menarik {len(df)} baris data.")

    # Normalisasi Header (Huruf kecil & underscore)
    df.columns = [str(col).lower().replace(' ', '_') for col in df.columns]

    # Konversi Tanggal & BUAT DATE ORDINAL
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        
        # --- [FIX UTAMA ADA DI SINI] ---
        # Kita harus ubah tanggal jadi angka (ordinal) agar bisa dihitung matematika
        df['date_ordinal'] = df['date'].apply(lambda x: x.toordinal())
        # -------------------------------
        
    else:
        print("❌ Error: Kolom 'date' tidak ditemukan di database!")
    
    return df

# ==============================================================================
# 3. TRAINING MODEL (Jalan otomatis saat aplikasi start)
# ==============================================================================
print("\n--- Memulai Proses Training ---")
df = get_training_data()
models = {}

if not df.empty and 'date_ordinal' in df.columns:
    # Kita buat model terpisah untuk setiap 'Product Line'
    product_lines = df['product_line'].unique()

    for product in product_lines:
        product_df = df[df['product_line'] == product]
        
        if len(product_df) > 5: # Minimal 5 data baru boleh training
            X = product_df[['date_ordinal']] # Input: Tanggal (Angka)
            y = product_df['quantity']       # Target: Jumlah Terjual
            
            regr = RandomForestRegressor(max_depth=2, random_state=0)
            regr.fit(X, y)
            models[product] = regr
            print(f"   -> Model dilatih untuk: {product}")
        else:
            print(f"   -> Skip: {product} (Data terlalu sedikit)")

    print(f"✅ Selesai! {len(models)} model siap digunakan.")
else:
    print("❌ TIDAK ADA MODEL YANG DILATIH (Cek koneksi data).")

# ==============================================================================
# 4. API ENDPOINT
# ==============================================================================
@app.route('/predict', methods=['POST'])
def predict():
    if not models:
        return jsonify({"error": "Model belum siap (Data kosong/Gagal Training)"}), 500

    data = request.get_json()
    product_line = data.get('product_line') # Contoh: "Health and beauty"
    
    # Handle jika produk tidak dikenal
    if product_line not in models:
        return jsonify({
            "error": f"Produk '{product_line}' tidak ditemukan atau data kurang.",
            "available_products": list(models.keys())
        }), 404

    # Prediksi permintaan untuk 7 hari ke depan
    today = datetime.date.today()
    future_dates = [today + datetime.timedelta(days=x) for x in range(1, 8)]
    
    # Ubah tanggal masa depan jadi ordinal juga
    future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
    
    predictions = models[product_line].predict(future_ordinals)
    total_predicted_demand = int(sum(predictions))
    
    return jsonify({
        "product_line": product_line,
        "predicted_demand_7_days": total_predicted_demand,
        "prediction_breakdown": [int(x) for x in predictions], # Detail per hari
        "model_used": "RandomForestRegressor"
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)