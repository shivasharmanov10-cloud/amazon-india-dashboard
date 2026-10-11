
import pandas as pd

from analytics import (
    get_category_performance,
    get_monthly_trend,
    get_order_status,
    get_overview,
    get_top_products,
)


def sample_data():
    return pd.DataFrame(
        {
            "Order_ID": ["A", "B", "C"],
            "Order_Date": pd.to_datetime(
                ["2026-01-10", "2026-01-15", "2026-02-10"]
            ),
            "Category": ["Electronics", "Fashion", "Electronics"],
            "Product": ["Headphones", "Jeans", "Mouse"],
            "Quantity": [2, 1, 3],
            "Total_Sales_INR": [1000.0, 500.0, 300.0],
            "Profit_INR": [200.0, 100.0, 60.0],
            "Order_Status": ["Delivered", "Returned", "Cancelled"],
            "Discount_Pct": [0.10, 0.05, 0.00],
            "Payment_Method": ["UPI", "Card", "UPI"],
            "Fulfillment": ["FBA", "Seller", "FBA"],
            "Ship_State": ["Madhya Pradesh", "Maharashtra", "Kerala"],
        }
    )


def test_overview():
    result = get_overview(sample_data())

    assert result["total_sales"] == 1800.0
    assert result["total_profit"] == 360.0
    assert result["total_orders"] == 3
    assert result["total_units_sold"] == 6
    assert result["average_order_value"] == 600.0
    assert result["profit_margin_pct"] == 20.0


def test_order_status():
    result = get_order_status(sample_data())

    assert result["delivered"] == 1
    assert result["returned"] == 1
    assert result["cancelled"] == 1
    assert result["return_rate_pct"] == 33.33
    assert result["cancellation_rate_pct"] == 33.33


def test_monthly_trend():
    result = get_monthly_trend(sample_data())

    assert len(result) == 2
    assert result[0]["month"] == "2026-01"
    assert result[0]["sales"] == 1500.0


def test_category_performance():
    result = get_category_performance(sample_data())

    assert result[0]["category"] == "Electronics"
    assert result[0]["sales"] == 1300.0


def test_top_products():
    result = get_top_products(sample_data(), limit=2)

    assert len(result) == 2
    assert result[0]["product"] == "Headphones"
from analytics import (
    get_product_profitability,
    get_profitability_summary,
    get_order_financial_exposure,
)


def test_product_profitability():
    df = sample_data()

    results = get_product_profitability(df)

    assert len(results) == 3

    headphones = next(
        item for item in results
        if item["product"] == "Headphones"
    )

    assert headphones["sales"] == 1000.0
    assert headphones["profit"] == 200.0
    assert headphones["margin_pct"] == 20.0


def test_profitability_summary():
    df = sample_data()

    result = get_profitability_summary(df)

    assert result["products_analyzed"] == 3
    assert result["loss_making_products"] == 0
    assert result["sales_total"] == 1800.0
    assert result["profit_total"] == 360.0


def test_order_financial_exposure():
    df = sample_data()

    result = get_order_financial_exposure(df)

    assert result["returned"]["orders"] == 1
    assert result["returned"]["recorded_sales"] == 500.0

    assert result["cancelled"]["orders"] == 1
    assert result["cancelled"]["recorded_sales"] == 300.0


def test_empty_profitability():
    df = sample_data().iloc[0:0]

    assert get_product_profitability(df) == []

    result = get_profitability_summary(df)

    assert result["products_analyzed"] == 0
    assert result["loss_making_products"] == 0


def test_empty_financial_exposure():
    df = sample_data().iloc[0:0]

    result = get_order_financial_exposure(df)

    assert result["returned"]["orders"] == 0
    assert result["cancelled"]["orders"] == 0