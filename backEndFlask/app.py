import os

import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from werkzeug.utils import secure_filename

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
MODEL_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Load mapping file
def load_mapping_file(mapping_file):
    with open(mapping_file, "r") as f:
        return {int(line.split()[0]): chr(int(line.split()[1])) for line in f}


# Load models
def load_resources():
    letter_model = tf.keras.models.load_model(
        os.path.join(MODEL_DIR, "emnist_letter_recognition_model.h5")
    )
    digit_model = tf.keras.models.load_model(
        os.path.join(MODEL_DIR, "digit_recognition_model.h5")
    )

    letter_mapping = load_mapping_file(os.path.join(MODEL_DIR, "letter_mapping.txt"))
    digit_mapping = load_mapping_file(os.path.join(MODEL_DIR, "digit_mapping.txt"))

    app.logger.info("Models and mappings loaded successfully!")
    return letter_model, digit_model, letter_mapping, digit_mapping


# Preprocess image
def preprocess_image(image_path):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    if image is None:
        raise ValueError("Invalid image file or unsupported format.")

    if np.mean(image) > 128:
        image = 255 - image

    image = cv2.resize(image, (28, 28))
    image = image.astype("float32") / 255.0

    return np.expand_dims(image, axis=(0, -1))


# Prediction
def predict_without_true_label(image_path, is_letter):
    image_input = preprocess_image(image_path)

    model = letter_model if is_letter else digit_model
    mapping_dict = letter_mapping if is_letter else digit_mapping

    prediction = model.predict(image_input)
    predicted_label = int(np.argmax(prediction))

    predicted_char = mapping_dict[predicted_label]

    return predicted_char, prediction[0]


# API endpoint
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image = request.files["image"]

        if not image or image.filename is None:
            return jsonify({"error": "Invalid file"}), 400

        filename = secure_filename(image.filename)
        image_path = os.path.join(UPLOAD_FOLDER, filename)

        image.save(image_path)

        is_letter_param = request.form.get("is_letter")
        if is_letter_param is None:
            return jsonify({"error": "`is_letter` is required"}), 400

        is_letter = is_letter_param.lower() == "true"

        predicted_char, probabilities = predict_without_true_label(
            image_path, is_letter
        )

        return jsonify(
            {
                "predicted_char": predicted_char,
                "probabilities": probabilities.tolist(),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Load resources
letter_model, digit_model, letter_mapping, digit_mapping = load_resources()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
