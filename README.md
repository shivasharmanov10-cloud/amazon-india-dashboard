
# Amazon India Sales Analytics Dashboard

An independent, Amazon-inspired sales analytics portfolio project built with React, FastAPI, Python, and Pandas.

The dashboard transforms order-level sales data into interactive visualizations and business insights for sales performance, product profitability, order status, payment methods, fulfilment methods, and geographic performance.

> **Disclaimer:** This is an independent portfolio project. It is not an official Amazon product and is not affiliated with Amazon.

## Features

### Sales Overview
- Total sales, profit, orders, and units sold
- Average order value and profit margin
- Monthly sales and profit trends

### Product Analytics
- Category-level sales and profit
- Top products by sales
- Product profitability analysis
- Rule-based product risk classification

### Order Analytics
- Delivered, shipped, returned, and cancelled orders
- Return and cancellation rates
- Category-level order issues

### Operations and Geography
- Payment method performance
- Fulfilment method performance
- State-level sales, profit, and orders

### Profit Intelligence
- Loss-making and low-margin product identification
- Searchable and sortable product risk register
- CSV export
- Recorded sales and profit amounts associated with returned and cancelled orders

**Important:** Profitability risk thresholds are configurable heuristics, not validated business standards. Amounts associated with returned or cancelled orders are recorded transaction values, not confirmed refunds or realized losses.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Recharts, Lucide |
| Backend | Python, FastAPI |
| Data analysis | Pandas, NumPy |
| Testing | Pytest |
| Data source | Excel sales dataset |

## Project Structure

```text
amazon-india-dashboard/
├── data/
│   └── Amazon Sales Data India.xlsx
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── analytics.py
├── inspect_data.py
├── main.py
├── test_analytics.py
├── .gitignore
└── README.md
```

## Requirements

- Python 3.11 or a compatible Python version
- Node.js and npm
- The Excel dataset supplied for the project

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/shivasharmanov10-cloud/amazon-india-dashboard.git
cd amazon-india-dashboard
```

### 2. Add the dataset

The original Excel dataset is intentionally excluded from GitHub.

Place your authorized copy at:

```text
data/Amazon Sales Data India.xlsx
```

Create the `data` directory if it does not exist.

### 3. Set up the Python backend

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install fastapi uvicorn pandas openpyxl pytest
```

### 4. Start the backend

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

- Dashboard API: `http://127.0.0.1:8000/api/dashboard`
- Health check: `http://127.0.0.1:8000/api/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### 5. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

### 6. Run tests

From the project root:

```powershell
python -m pytest -q
```

## Data and Interpretation Notes

- Results depend on the supplied dataset and selected filters.
- Product risk categories use configurable rules rather than validated industry standards.
- Returned and cancelled order amounts represent recorded transaction values, not verified refunds or financial losses.
- The dataset does not establish customer retention, customer lifetime value, or inventory stock-out rates.

## Future Improvements

- Statistical sales anomaly detection
- Improved data validation and reporting
- Deployment of the frontend and backend
- Expanded automated tests

## Author

Developed as an independent analytics portfolio project.