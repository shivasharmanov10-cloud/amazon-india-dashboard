
import os
from datetime import date
from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from analytics import (
    filter_data,
    get_category_order_issues,
    get_category_performance,
    get_fulfillment_performance,
    get_geographic_performance,
    get_monthly_trend,
    get_order_financial_exposure,
    get_order_status,
    get_overview,
    get_payment_performance,
    get_product_profitability,
    get_profitability_summary,
    get_top_products,
    load_data,
)



app = FastAPI(
    title="Amazon India Analytics API",
    description="Analytics API for the Amazon India Dashboard",
    version="1.1.0",
)

frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,https://amazon-india-dashboard.vercel.app,https://amazon-india-dashboard-git-main-shiva-sharma-s-projects.vercel.app",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

df = load_data()


def apply_filters(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    state: str | None = None,
    payment_method: str | None = None,
    fulfillment: str | None = None,
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must not be after end_date",
        )

    try:
        return filter_data(
            df,
            start_date=start_date.isoformat() if start_date else None,
            end_date=end_date.isoformat() if end_date else None,
            category=category,
            state=state,
            payment_method=payment_method,
            fulfillment=fulfillment,
        )
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid filter: {exc}",
        ) from exc


def filter_parameters(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    category: str | None = Query(default=None),
    state: str | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    fulfillment: str | None = Query(default=None),
):
    return {
        "start_date": start_date,
        "end_date": end_date,
        "category": category,
        "state": state,
        "payment_method": payment_method,
        "fulfillment": fulfillment,
    }


Filters = Annotated[dict, Depends(filter_parameters)]


@app.get("/")
def root():
    return {
        "message": "Amazon India Analytics API is running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "dataset_rows": len(df),
    }


@app.get("/api/dashboard/overview")
def overview(filters: Filters):
    data = apply_filters(**filters)
    return get_overview(data)


@app.get("/api/dashboard/sales-trend")
def sales_trend(filters: Filters):
    data = apply_filters(**filters)
    return get_monthly_trend(data)


@app.get("/api/dashboard/categories")
def categories(filters: Filters):
    data = apply_filters(**filters)
    return get_category_performance(data)


@app.get("/api/dashboard/top-products")
def top_products(
    filters: Filters,
    limit: int = Query(default=10, ge=1, le=25),
):
    data = apply_filters(**filters)
    return get_top_products(data, limit=limit)


@app.get("/api/dashboard/order-status")
def order_status(filters: Filters):
    data = apply_filters(**filters)
    return get_order_status(data)


@app.get("/api/dashboard/order-issues")
def order_issues(filters: Filters):
    data = apply_filters(**filters)
    return get_category_order_issues(data)


@app.get("/api/dashboard/payments")
def payments(filters: Filters):
    data = apply_filters(**filters)
    return get_payment_performance(data)


@app.get("/api/dashboard/fulfillment")
def fulfillment(filters: Filters):
    data = apply_filters(**filters)
    return get_fulfillment_performance(data)


@app.get("/api/dashboard/geography")
def geography(filters: Filters):
    data = apply_filters(**filters)
    return get_geographic_performance(data)
@app.get("/api/dashboard/profitability")
def profitability(
    filters: Filters,
    limit: int = Query(default=25, ge=1, le=100),
):
    """Return product-level profitability and configurable risk indicators."""
    data = apply_filters(**filters)
    products = get_product_profitability(data)

    return {
        "products_analyzed": len(products),
        "products": products[:limit],
    }


@app.get("/api/dashboard/profitability-summary")
def profitability_summary(filters: Filters):
    """Return a summary of product profitability indicators."""
    data = apply_filters(**filters)
    return get_profitability_summary(data)


@app.get("/api/dashboard/financial-exposure")
def financial_exposure(filters: Filters):
    """Return recorded financial amounts associated with returned/cancelled orders."""
    data = apply_filters(**filters)
    return get_order_financial_exposure(data)