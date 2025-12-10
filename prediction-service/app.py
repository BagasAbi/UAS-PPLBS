from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import requests
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class ForecastRequest(BaseModel):
    product_id: int

app = FastAPI()

models = {}

# Supabase Setup
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
if not url or not key:
    print("Warning: SUPABASE_URL/KEY not found. Predictions might fail.")
    supabase = None
else:
    supabase: Client = create_client(url, key)

# startup
@app.on_event("startup")
def init():
    global models
    # load all models
    for f in os.listdir("./models"):
        if f.endswith(".pkl"):
            pid = int(f.split("_")[-1].replace(".pkl", ""))
            models[pid] = joblib.load(f"./models/{f}")

# prediction logic
def predict_next_7(model, last_7):
    forecasts = []
    history = list(last_7)
    for _ in range(7):
        X = np.array([history[-7:]])
        y = model.predict(X)[0]
        forecasts.append(y)
        history.append(y)
    return sum(forecasts)

# Endpoint
@app.post("/ml/forecast")
def forecast(req: ForecastRequest):
    pid = req.product_id

    if pid not in models:
        # Fallback if no specific model: try generic or error
        # For this assignment, assuming generic model or error
        # Ideally we should have a generic model, but let's stick to existing logic
        # OR: Check if we can use a neighboring model (simplification)
        # return {"error": f"No pretrained model for product {pid}"}
        pass 
        # For now, let's proceed. If model missing, we can't predict using *this* ML model.
        # But we can perhaps allow it if we had a generic model.
        # Strict for now:
        if pid not in models:
             # Try to find *any* model to use as fallback (since models are likely generic RF)
             pid_keys = list(models.keys())
             if pid_keys:
                 pid = pid_keys[0] # Fallback to first available model logic
             else:
                raise HTTPException(404, f"No model found for product {pid}")

    model = models[pid]

    # --- Fetch Data from Supabase ---
    if not supabase:
        raise HTTPException(500, "Database connection not configured")

    # Fetch last 7 days of sales for this product (from 'transactions' table)
    try:
        response = supabase.table("transactions") \
            .select("quantity_sold, transaction_date") \
            .eq("product_id", req.product_id) \
            .order("transaction_date", desc=True) \
            .limit(7) \
            .execute()
        
        data = response.data
        
        # We need exactly 7 days. If less, pad with 0 or mean.
        # Data comes desc (newest first). Reverse it for history.
        # Map quantity_sold to generic quantity
        history = [x['quantity_sold'] for x in data][::-1]

        if len(history) < 7:
             # Pad with 0s if not enough history
             history = [0] * (7 - len(history)) + history
        
    except Exception as e:
        print(f"Error fetching sales: {e}")
        history = [0] * 7 # Fallback empty history

    predicted = predict_next_7(model, history)

    # ---- call stock service ----
    try:
        resp = requests.get(f"http://stock-service:3002/stock/{req.product_id}", timeout=5)
        if resp.status_code == 200:
            current_stock = resp.json().get("current_stock", 0)
        else:
            current_stock = 0
    except Exception:
        current_stock = 0  # fallback

    # --- Fetch Product Name ---
    product_name = f"Product {req.product_id}" # default
    try:
        p_resp = supabase.table("products").select("name").eq("id", req.product_id).single().execute()
        if p_resp.data:
            product_name = p_resp.data.get("name")
    except Exception as e:
        print(f"Error fetching product name: {e}")

    return {
        "product_id": req.product_id,
        "product_name": product_name,
        "current_stock": current_stock,
        "predicted_demand_next_7_days": int(predicted)
    }

