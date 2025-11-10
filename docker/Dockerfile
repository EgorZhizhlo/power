FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    GUNICORN_CMD_ARGS="--access-logfile - --error-logfile -"

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app


COPY docker/requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
 && pip install -r requirements.txt \
 && pip install "uvicorn[standard]" gunicorn

COPY access_control/ ./access_control/
COPY apps/ ./apps/
COPY core/ ./core/
COPY infrastructure/ ./infrastructure/
COPY models/ ./models/
COPY main.py .
COPY alembic.ini .

EXPOSE 8000

CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "900"]