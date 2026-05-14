import subprocess
import os

try:
    import pandas as pd
    import openpyxl
except ImportError:
    subprocess.run(['pip', 'install', 'openpyxl', 'pandas'], capture_output=True)
    import pandas as pd

file_path = r'c:\xampp\htdocs\Proyectos_React\bufala-bella\docs\Promedio Kilos Semanal Mes 2024 - 2025.xlsx'

if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
else:
    # Read sheet names first
    xl = pd.ExcelFile(file_path)
    print("Hojas disponibles:", xl.sheet_names)

    # Read the 'Detalle' sheet
    df = pd.read_excel(file_path, sheet_name='Detalle', header=None)
    print("\nTotal filas:", len(df))
    print("Total columnas:", len(df.columns))
    print("\nPrimeras 15 filas completas:")
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 300)
    pd.set_option('display.max_colwidth', 50)
    print(df.head(15).to_string())
    print("\nColumnas (índices 0-10):")
    print(df.iloc[:5, :15].to_string())
    print("\nData Types:")
    print(df.dtypes.head(15))
