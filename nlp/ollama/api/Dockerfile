FROM python:3.12-slim
WORKDIR /app
COPY api.py .
RUN pip install flask requests
EXPOSE 3000

CMD ["python", "api.py"]
