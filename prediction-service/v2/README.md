# UAS ML Forecasting Service

Machine Learning forecasting API using **FastAPI + RandomForest + Docker**.

##  Requirements
- Python 3.10+
- Docker Desktop (recommended)
- `/models/*.pkl` must exist
- `/sales.csv` must exist

## Run using Docker (recommended)

### 1) Build image

docker build -t uas_service .

2) Run container on port 8888

docker run -p 8888:8888 uas_service

### API Endpoint

## POST /ml/forecast

Request body:

json


{
  "product_id": 3
}

Example response:

json


{
  "product_id": 3,
  "current_stock": 30,
  "predicted_demand_next_7_days": 120
}

## Code Notes
# Forecast uses RandomForest models loaded from:

/models/model_<product_id>.pkl

# Sales history loaded from:

/sales.csv

# Current stock fetched dynamically from:

GET http://localhost:3002/stock/:product_id

## Local Development (without Docker)

# Install deps:

pip install -r requirements.txt

# Run service:

uvicorn app:app --reload --host 0.0.0.0 --port 8888
