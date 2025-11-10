import pandas as pd


def autofit_columns(
        writer, df, sheet_name, index: bool = False, max_width: int = 50):
    worksheet = writer.sheets[sheet_name]

    def get_max_length(series, header_name=""):
        if series.empty:
            return len(header_name)
        max_val = series.astype(str).map(len).max()
        return max(int(max_val) if pd.notna(max_val) else 0, len(header_name))

    start_col = 0
    if index:
        idx_name = df.index.name or ""
        max_len = get_max_length(df.index, idx_name) + 2
        worksheet.set_column(0, 0, min(max_len, max_width))
        start_col = 1

    for i, col in enumerate(df.columns):
        max_len = get_max_length(df[col], str(col)) + 2
        worksheet.set_column(
            start_col + i, start_col + i, min(max_len, max_width))
