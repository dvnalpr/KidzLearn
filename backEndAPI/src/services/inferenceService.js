const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const admin = require('../firebase/admin')

const ML_SERVICE_URL = 'https://kidzlearn-ml-365212599966.asia-southeast2.run.app/predict';

const getPrediction = async (filePath, isLetter) => {
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));
    form.append('is_letter', isLetter ? 'true' : 'false');

    try {
        const db = admin.firestore();
        const response = await axios.post(ML_SERVICE_URL, form, {
            headers: form.getHeaders(),
        });
        
        const result = response.data;

        await db.collection('predictions').add({
            predicted_char: result.predicted_char,
            probabilities: result.probabilities,
            is_letter: isLetter,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),  // Automatically set createdAt
        });

        console.log("Prediction saved to Firestore:", result);
        return result;

    } catch (error) {
        console.error('Error in ML service:', error.message);
        const backendMessage = error.response?.data?.error || 'Unknown error from backend';
        throw new Error(`Prediction service failed: ${backendMessage}`);
    }
};

module.exports = { getPrediction };
