# Emotion Predicter

A robust web application that predicts emotions using a Bidirectional GRU (BiGRU) deep learning model. The project features a high-performance backend powered by FastAPI and an intuitive frontend interface, fully configured for cloud deployment.

## 🚀 Key Features

* **Deep Learning Powered:** Utilizes a trained BiGRU model to accurately classify emotions from text.
* **FastAPI Backend:** Ensures rapid, asynchronous API request handling and model inference.
* **Interactive Web UI:** Features a clean, responsive frontend built entirely with HTML, CSS, and vanilla JavaScript.
* **Cloud-Ready:** Pre-configured for seamless deployment on Render (includes `runtime.txt` and `requirements.txt`).
* **Modular Architecture:** Clean separation of model artifacts, API routing, and static assets.

## 📂 Project Structure

```text
Emotion_Predicter/
├── Artifacts/           # Contains the trained BiGRU model weights and tokenizer files
├── static/              # HTML, CSS, and JS files for the frontend user interface
├── main.py              # FastAPI application entry point and model loading
├── requirements.txt     # Required Python dependencies for the environment
├── runtime.txt          # Python runtime specification for Render deployment
└── .gitignore           # Ignored files and directories

```

## Tech Stack

Backend: Python (12%), FastAPI

Machine Learning: BiGRU (Model Artifacts)

Frontend: CSS (42.5%), HTML (27.2%), JavaScript (18.3%)

Deployment Platform: Render
