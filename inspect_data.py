
from pathlib import Path

import pandas as pd

# Project directory
BASE_DIR = Path(__file__).resolve().parent

# Keep the original Excel filename unchanged
DATA_FILE = BASE_DIR / "data" / "Amazon Sales Data India.xlsx"


def main():
    print("=" * 50)
    print("AMAZON INDIA DATASET INSPECTOR")
    print("=" * 50)

    if not DATA_FILE.exists():
        print(f"\nERROR: Dataset not found at:\n{DATA_FILE}")
        print("\nCheck that the Excel file is inside the data folder.")
        return

    try:
        df = pd.read_excel(DATA_FILE)

        print(f"\nFile: {DATA_FILE.name}")
        print(f"Total rows: {len(df):,}")
        print(f"Total columns: {len(df.columns)}")

        print("\n--- COLUMN NAMES ---")
        for column in df.columns:
            print(f"  {column}")

        print("\n--- DATA TYPES ---")
        print(df.dtypes.to_string())

        print("\n--- MISSING VALUES ---")
        print(df.isnull().sum().to_string())

        print("\n--- DUPLICATE ROWS ---")
        print(f"Duplicate rows: {df.duplicated().sum():,}")

        print("\n--- ORDER STATUS COUNTS ---")
        if "Order_Status" in df.columns:
            print(df["Order_Status"].value_counts(dropna=False).to_string())
        else:
            print("Order_Status column not found.")

        print("\n--- FIRST FIVE ROWS ---")
        print(df.head().to_string(index=False))

        print("\nDataset inspection completed successfully!")

    except Exception as exc:
        print(f"\nERROR while reading the dataset: {exc}")


if __name__ == "__main__":
    main()