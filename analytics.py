
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "Amazon Sales Data India.xlsx"


def load_data() -> pd.DataFrame:
    """Load and validate the Amazon India sales dataset."""

    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_FILE}"
        )

    df = pd.read_excel(DATA_FILE)

    required_columns = [
        "Order_ID",
        "Order_Date",
        "Category",
        "Product",
        "Quantity",
        "Unit_Price_INR",
        "Discount_Pct",
        "Total_Sales_INR",
        "Profit_INR",
        "Payment_Method",
        "Fulfillment",
        "Order_Status",
        "Ship_State",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    df["Order_Date"] = pd.to_datetime(
        df["Order_Date"],
        errors="raise",
    )

    for column in [
        "Quantity",
        "Unit_Price_INR",
        "Discount_Pct",
        "Total_Sales_INR",
        "Profit_INR",
    ]:
        df[column] = pd.to_numeric(
            df[column],
            errors="raise",
        )

    return df


def filter_data(
    df: pd.DataFrame,
    start_date: str | None = None,
    end_date: str | None = None,
    category: str | None = None,
    state: str | None = None,
    payment_method: str | None = None,
    fulfillment: str | None = None,
) -> pd.DataFrame:
    """Filter data using optional dashboard selections."""

    filtered = df.copy()

    if start_date:
        start = pd.to_datetime(start_date, errors="raise")
        filtered = filtered[filtered["Order_Date"] >= start]

    if end_date:
        end = pd.to_datetime(end_date, errors="raise")
        filtered = filtered[
            filtered["Order_Date"] < end + pd.Timedelta(days=1)
        ]

    if category:
        filtered = filtered[filtered["Category"] == category]

    if state:
        filtered = filtered[filtered["Ship_State"] == state]

    if payment_method:
        filtered = filtered[
            filtered["Payment_Method"] == payment_method
        ]

    if fulfillment:
        filtered = filtered[
            filtered["Fulfillment"] == fulfillment
        ]

    return filtered


def get_overview(df: pd.DataFrame) -> dict:
    """Calculate the executive overview KPIs."""

    total_sales = float(df["Total_Sales_INR"].sum())
    total_profit = float(df["Profit_INR"].sum())

    total_orders = int(df["Order_ID"].nunique())
    total_units = int(df["Quantity"].sum())

    average_order_value = (
        total_sales / total_orders
        if total_orders
        else 0.0
    )

    profit_margin = (
        total_profit / total_sales * 100
        if total_sales
        else 0.0
    )

    return {
        "total_sales": round(total_sales, 2),
        "total_profit": round(total_profit, 2),
        "total_orders": total_orders,
        "total_units_sold": total_units,
        "average_order_value": round(
            average_order_value, 2
        ),
        "profit_margin_pct": round(profit_margin, 2),
    }


def get_monthly_trend(df: pd.DataFrame) -> list[dict]:
    """Calculate monthly sales and profit."""

    if df.empty:
        return []

    monthly = (
        df.assign(
            Month=df["Order_Date"].dt.to_period("M")
        )
        .groupby("Month", as_index=False)
        .agg(
            sales=("Total_Sales_INR", "sum"),
            profit=("Profit_INR", "sum"),
        )
        .sort_values("Month")
    )

    monthly["month"] = monthly["Month"].astype(str)

    return [
        {
            "month": row["month"],
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
        }
        for _, row in monthly.iterrows()
    ]


def get_category_performance(
    df: pd.DataFrame,
) -> list[dict]:
    """Calculate sales, profit and units by category."""

    grouped = (
        df.groupby("Category", as_index=False)
        .agg(
            sales=("Total_Sales_INR", "sum"),
            profit=("Profit_INR", "sum"),
            units_sold=("Quantity", "sum"),
        )
        .sort_values("sales", ascending=False)
    )

    return [
        {
            "category": row["Category"],
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
            "units_sold": int(row["units_sold"]),
        }
        for _, row in grouped.iterrows()
    ]


def get_top_products(
    df: pd.DataFrame,
    limit: int = 10,
) -> list[dict]:
    """Return products ranked by total sales."""

    grouped = (
        df.groupby("Product", as_index=False)
        .agg(
            sales=("Total_Sales_INR", "sum"),
            profit=("Profit_INR", "sum"),
            units_sold=("Quantity", "sum"),
        )
        .sort_values("sales", ascending=False)
        .head(limit)
    )

    return [
        {
            "product": row["Product"],
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
            "units_sold": int(row["units_sold"]),
        }
        for _, row in grouped.iterrows()
    ]


def get_order_status(df: pd.DataFrame) -> dict:
    """Summarise order statuses and calculate rates."""

    counts = df["Order_Status"].value_counts()

    total_orders = int(df["Order_ID"].nunique())

    returned = int(counts.get("Returned", 0))
    cancelled = int(counts.get("Cancelled", 0))

    # Explicit denominator: all orders in the filtered dataset.
    return_rate = (
        returned / total_orders * 100
        if total_orders
        else 0.0
    )

    cancellation_rate = (
        cancelled / total_orders * 100
        if total_orders
        else 0.0
    )

    return {
        "delivered": int(counts.get("Delivered", 0)),
        "shipped": int(counts.get("Shipped", 0)),
        "returned": returned,
        "cancelled": cancelled,
        "total_orders": total_orders,
        "return_rate_pct": round(return_rate, 2),
        "cancellation_rate_pct": round(
            cancellation_rate, 2
        ),
    }


def get_category_order_issues(
    df: pd.DataFrame,
) -> list[dict]:
    """Count returned and cancelled orders by category."""

    issues = df[
        df["Order_Status"].isin(["Returned", "Cancelled"])
    ]

    grouped = (
        issues.pivot_table(
            index="Category",
            columns="Order_Status",
            values="Order_ID",
            aggfunc="nunique",
            fill_value=0,
        )
        .reset_index()
    )

    if "Returned" not in grouped.columns:
        grouped["Returned"] = 0

    if "Cancelled" not in grouped.columns:
        grouped["Cancelled"] = 0

    return [
        {
            "category": row["Category"],
            "returned": int(row["Returned"]),
            "cancelled": int(row["Cancelled"]),
        }
        for _, row in grouped.iterrows()
    ]


def get_group_performance(
    df: pd.DataFrame,
    column: str,
    output_key: str,
) -> list[dict]:
    """Calculate sales and profit for a grouping column."""

    grouped = (
        df.groupby(column, as_index=False)
        .agg(
            sales=("Total_Sales_INR", "sum"),
            profit=("Profit_INR", "sum"),
            orders=("Order_ID", "nunique"),
        )
        .sort_values("sales", ascending=False)
    )

    return [
        {
            output_key: row[column],
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
            "orders": int(row["orders"]),
        }
        for _, row in grouped.iterrows()
    ]


def get_payment_performance(
    df: pd.DataFrame,
) -> list[dict]:
    return get_group_performance(
        df,
        "Payment_Method",
        "payment_method",
    )


def get_fulfillment_performance(
    df: pd.DataFrame,
) -> list[dict]:
    return get_group_performance(
        df,
        "Fulfillment",
        "fulfillment",
    )


def get_geographic_performance(
    df: pd.DataFrame,
) -> list[dict]:
    return get_group_performance(
        df,
        "Ship_State",
        "state",
    )
def get_product_profitability(
    df: pd.DataFrame,
) -> list[dict]:
    """
    Analyze product-level sales, profitability,
    margins, and discount patterns.
    """

    if df.empty:
        return []

    grouped = (
        df.groupby("Product", as_index=False)
        .agg(
            sales=("Total_Sales_INR", "sum"),
            profit=("Profit_INR", "sum"),
            units_sold=("Quantity", "sum"),
            average_discount=("Discount_Pct", "mean"),
            orders=("Order_ID", "nunique"),
        )
    )

    grouped["margin_pct"] = (
        grouped["profit"]
        .div(grouped["sales"].where(grouped["sales"] != 0))
        .mul(100)
    )

    grouped["margin_pct"] = (
        grouped["margin_pct"]
        .fillna(0)
    )

    results = []

    for _, row in grouped.iterrows():
        sales = float(row["sales"])
        profit = float(row["profit"])
        margin = float(row["margin_pct"])
        discount = float(row["average_discount"])

        if profit < 0:
            risk_level = "critical"
            finding = "Negative recorded profit"

        elif margin < 5 and sales > 0:
            risk_level = "high"
            finding = "Low recorded profit margin"

        elif discount >= 0.25 and margin < 15:
            risk_level = "medium"
            finding = "High discount with relatively low margin"

        else:
            risk_level = "normal"
            finding = "No configured profitability rule triggered"

        results.append(
            {
                "product": str(row["Product"]),
                "sales": round(sales, 2),
                "profit": round(profit, 2),
                "margin_pct": round(margin, 2),
                "units_sold": int(row["units_sold"]),
                "orders": int(row["orders"]),
                "average_discount_pct": round(
                    discount * 100, 2
                ),
                "risk_level": risk_level,
                "finding": finding,
            }
        )

    return sorted(
        results,
        key=lambda item: (
            {"critical": 0, "high": 1,
             "medium": 2, "normal": 3}[
                item["risk_level"]
            ],
            item["profit"],
        ),
    )


def get_profitability_summary(
    df: pd.DataFrame,
) -> dict:
    """
    Summarize product profitability using recorded
    sales and profit values.
    """

    products = get_product_profitability(df)

    if not products:
        return {
            "products_analyzed": 0,
            "loss_making_products": 0,
            "low_margin_products": 0,
            "negative_profit_total": 0.0,
            "sales_total": 0.0,
            "profit_total": 0.0,
        }

    return {
        "products_analyzed": len(products),

        "loss_making_products": sum(
            product["profit"] < 0
            for product in products
        ),

        "low_margin_products": sum(
            0 <= product["margin_pct"] < 5
            and product["sales"] > 0
            for product in products
        ),

        "negative_profit_total": round(
            sum(
                product["profit"]
                for product in products
                if product["profit"] < 0
            ),
            2,
        ),

        "sales_total": round(
            sum(product["sales"] for product in products),
            2,
        ),

        "profit_total": round(
            sum(product["profit"] for product in products),
            2,
        ),
    }


def get_order_financial_exposure(
    df: pd.DataFrame,
) -> dict:
    """
    Summarize recorded sales and profit for returned
    and cancelled orders.

    These values are not confirmed refunds or realized
    financial losses.
    """

    if df.empty:
        return {
            "returned": {
                "orders": 0,
                "recorded_sales": 0.0,
                "recorded_profit": 0.0,
            },
            "cancelled": {
                "orders": 0,
                "recorded_sales": 0.0,
                "recorded_profit": 0.0,
            },
        }

    results = {}

    for status in ["Returned", "Cancelled"]:
        subset = df[df["Order_Status"] == status]

        results[status.lower()] = {
            "orders": int(
                subset["Order_ID"].nunique()
            ),
            "recorded_sales": round(
                float(subset["Total_Sales_INR"].sum()),
                2,
            ),
            "recorded_profit": round(
                float(subset["Profit_INR"].sum()),
                2,
            ),
        }

    return results