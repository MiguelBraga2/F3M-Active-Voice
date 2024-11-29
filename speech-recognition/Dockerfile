FROM python:3.12-slim
WORKDIR /app
RUN mkdir temp
COPY whisper.py .
COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
RUN pip install -r requirements.txt

#ARG MODEL_NAME=openai/whisper-base
#ENV MODEL_NAME=${MODEL_NAME}

EXPOSE 5000

CMD ["python", "whisper.py"]
