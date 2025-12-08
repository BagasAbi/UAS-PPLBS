"""
Simple Kaggle CSV importer for `supermarket_sales` table using Supabase REST (via client)
Usage:
  pip install -r requirements.txt
  cp .env.example .env && fill SUPABASE_URL and SUPABASE_KEY
  python scripts/import_kaggle.py path/to/supermarket_sales.csv
"""
import os
import sys
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('Please set SUPABASE_URL and SUPABASE_KEY in environment')
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

if len(sys.argv) < 2:
    print('Usage: python import_kaggle.py path/to/supermarket_sales.csv')
    sys.exit(1)

csv_path = sys.argv[1]
print('Reading', csv_path)

df = pd.read_csv(csv_path)
print('Rows:', len(df))

# Attempt to insert in batches
BATCH = 200
records = df.to_dict(orient='records')
for i in range(0, len(records), BATCH):
    batch = records[i:i+BATCH]
    res = supabase.table('supermarket_sales').insert(batch).execute()
    if res.error:
        print('Error inserting batch', i, res.error)
        sys.exit(1)
    print(f'Inserted batch {i // BATCH + 1} / {((len(records)-1)//BATCH)+1}')

print('Import finished')
