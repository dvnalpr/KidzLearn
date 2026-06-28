FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade-pip --quiet && \
    pip install --no-cache-dir -r requirements.txt --quiet
COPY . .
EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "app:app"]
