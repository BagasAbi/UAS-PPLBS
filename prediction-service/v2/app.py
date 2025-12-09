from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import requests
import os

class ForecastRequest(BaseModel):
    product_id: int

app = FastAPI()

models = {}
sales_df = None

# startup
@app.on_event("startup")
def init():
    global sales_df, models

    # load CSV
    sales_df = pd.read_csv("./sales.csv")

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
        raise HTTPException(404, f"No model found for product {pid}")

    model = models[pid]

    past = (
        sales_df[sales_df.product_id == pid]
        .sort_values("date")
        .tail(7)
    )

    if len(past) < 7:
        raise HTTPException(400, "Not enough history (needs 7 days)")

    history = past.sales.tolist()
    predicted = predict_next_7(model, history)

    # ---- call stock service ----
    try:
        resp = requests.get(f"http://localhost:3002/stock/{pid}", timeout=5)
        if resp.status_code == 200:
            current_stock = resp.json().get("current_stock", 0)
        else:
            current_stock = 0
    except Exception:
        current_stock = 0  # fallback

    return {
        "product_id": pid,
        "current_stock": current_stock,
        "predicted_demand_next_7_days": int(predicted)
    }

