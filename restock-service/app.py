from fastapi import FastAPI
from pydantic import BaseModel

class RestockRequest(BaseModel):
    product_id: int
    current_stock: int
    predicted_demand: int

app = FastAPI()

@app.post("/restock")
def check_restock(req: RestockRequest):
    # Simple logic: If demand > stock, order the difference
    shortage = req.predicted_demand - req.current_stock
    
    if shortage > 0:
        return {
            "product_id": req.product_id,
            "decision": "ORDER",
            "amount": shortage
        }
    else:
        return {
            "product_id": req.product_id,
            "decision": "OK",
            "amount": 0
        }

@app.get("/")
def home():
    return {"message": "Restock Decision Service Running"}
