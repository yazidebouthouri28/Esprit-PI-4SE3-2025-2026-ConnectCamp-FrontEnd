from flask import Flask, request, jsonify
from pathlib import Path
import warnings
from datetime import datetime
import re

warnings.filterwarnings('ignore')

app = Flask(__name__)

# Chemins relatifs au script : python_scripts/ -> INTEGRATION/
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
_DEFAULT_MODEL_DIR = _PROJECT_ROOT / "src" / "main" / "resources" / "ml_models"
MODEL_PATH = _DEFAULT_MODEL_DIR / "fraud_detection_model.pkl"
ENCODERS_PATH = _DEFAULT_MODEL_DIR / "encoders.pkl"

model = None
encoders = None

try:
    import joblib
    import numpy as np  # noqa: F401 — requis par certains modèles sklearn joblib

    if MODEL_PATH.is_file() and ENCODERS_PATH.is_file():
        print(f"Loading model from {MODEL_PATH} ...")
        model = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        print("Model loaded successfully!")
    else:
        print(
            f"WARNING: Fichiers ML introuvants ({MODEL_PATH.name}, {ENCODERS_PATH.name}). "
            "Mode MOCK activé (réponses heuristiques)."
        )
except Exception as load_err:
    print(f"WARNING: Impossible de charger le modèle ({load_err}). Mode MOCK activé.")
    model = None
    encoders = None

try:
    import pytz
except ImportError:
    pytz = None


def normalize_timezone(tz_str):
    """Accepte les fuseaux IANA ou des raccourcis type UTC+1 (Swagger / front)."""
    if not tz_str or not str(tz_str).strip():
        return "Africa/Tunis"
    s = str(tz_str).strip()
    aliases = {
        "UTC+1": "Africa/Tunis",
        "UTC+2": "Europe/Paris",
        "UTC+0": "UTC",
        "UTC": "UTC",
        "GMT+1": "Africa/Tunis",
        "GMT+2": "Europe/Paris",
    }
    key = s.upper().replace(" ", "")
    if key in aliases:
        return aliases[key]
    m = re.match(r"^UTC([+-]\d{1,2})$", s.upper())
    if m and pytz:
        offset = int(m.group(1))
        if offset == 1:
            return "Africa/Tunis"
        if offset == 0:
            return "UTC"
        if offset == 2:
            return "Europe/Athens"
    return s


def get_local_hour(timezone_str, fallback_hour):
    if fallback_hour is not None:
        return fallback_hour
    if pytz is None:
        return fallback_hour
    try:
        tz_name = normalize_timezone(timezone_str)
        tz = pytz.timezone(tz_name)
        return datetime.now(tz).hour
    except Exception:
        return fallback_hour


def mock_predict(amount, hour, transaction_type, user_profile, is_student):
    """Prédictions heuristiques si les fichiers .pkl sont absents."""
    is_night = 1 if hour < 6 or hour > 22 else 0
    is_large = 1 if amount > 200 else 0
    score = 0.08
    if is_large:
        score += 0.12
    if is_night:
        score += 0.1
    if is_student:
        score += 0.02
    if user_profile and user_profile.upper() == "PREMIUM" and amount > 400:
        score += 0.05
    jitter = (abs(hash(transaction_type or "")) % 7) * 0.01
    fraud_prob = min(0.92, max(0.02, score + jitter))
    is_fraud = 1 if fraud_prob > 0.55 else 0
    return {
        "is_fraud": int(is_fraud),
        "fraud_probability": round(float(fraud_prob), 4),
        "normal_probability": round(float(1.0 - fraud_prob), 4),
        "risk_level": (
            "HIGH" if fraud_prob > 0.7
            else "MEDIUM" if fraud_prob > 0.3
            else "LOW"
        ),
        "mock": True,
    }


def predict_transaction(amount, hour, transaction_type, user_profile, is_student, timezone):
    transaction_type = (transaction_type or "SHOPPING").upper()
    user_profile = (user_profile or "NORMAL").upper()
    hour_eff = get_local_hour(timezone, int(hour) if hour is not None else datetime.now().hour)

    if model is None or encoders is None:
        return mock_predict(amount, hour_eff, transaction_type, user_profile, is_student)

    is_night_risk = 1 if hour_eff < 6 or hour_eff > 22 else 0
    is_large = 1 if amount > 200 else 0

    print(f"Transaction type: {transaction_type}, User profile: {user_profile}, Hour: {hour_eff}")

    type_code = encoders["transaction_type"].transform([transaction_type])[0]
    profile_code = encoders["userProfile"].transform([user_profile])[0]

    features = [[
        amount,
        hour_eff,
        is_large,
        type_code,
        profile_code,
        is_night_risk,
        is_student,
    ]]

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]

    return {
        "is_fraud": int(prediction),
        "fraud_probability": round(float(probability[1]), 4),
        "normal_probability": round(float(probability[0]), 4),
        "risk_level": (
            "HIGH" if probability[1] > 0.7
            else "MEDIUM" if probability[1] > 0.3
            else "LOW"
        ),
    }


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        print(f"Received request: {data}")

        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        required = ["amount", "transaction_type", "user_profile", "is_student"]
        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        result = predict_transaction(
            amount=data["amount"],
            hour=data.get("hour", datetime.now().hour),
            transaction_type=data["transaction_type"],
            user_profile=data["user_profile"],
            is_student=data["is_student"],
            timezone=data.get("timezone", "Africa/Tunis"),
        )

        print(f"Result: {result}")
        return jsonify(result)

    except ValueError as e:
        print(f"ValueError: {e}")
        body = {"error": f"Invalid value: {str(e)}"}
        if encoders is not None:
            body["valid_types"] = list(encoders["transaction_type"].classes_)
            body["valid_profiles"] = list(encoders["userProfile"].classes_)
        return jsonify(body), 400

    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"ERROR: {err}")
        return jsonify({"error": str(e), "trace": err}), 500


@app.route("/health", methods=["GET"])
def health():
    body = {
        "status": "ok",
        "model_loaded": model is not None,
        "mock_mode": model is None,
    }
    if encoders is not None:
        body["valid_types"] = list(encoders["transaction_type"].classes_)
        body["valid_profiles"] = list(encoders["userProfile"].classes_)
    return jsonify(body)


if __name__ == "__main__":
    print("Starting Flask server on http://127.0.0.1:5001 ...")
    app.run(host="127.0.0.1", port=5001, debug=False)
