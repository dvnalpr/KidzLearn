const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

// Inisialisasi Secret Manager Client
const client = new SecretManagerServiceClient();

// Fungsi untuk mengakses Secret Manager
async function getSecret(secretName) {
    const projectId = process.env.GCP_PROJECT_ID || "kidzlearn-project"; // Sesuaikan Project ID
    const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
    try {
      const [secret] = await client.accessSecretVersion({ name: secretPath });
      const payload = secret.payload.data.toString("utf8");
      return payload;
    } catch (error) {
      console.error(`Error accessing secret '${secretName}':`, error.message);
      throw error;
    }
}


// Fungsi untuk memanggil semua secrets yang dibutuhkan
const loadSecrets = async () => {
  try {
    const [jwtSecret, firebaseApiKey, firebaseServiceAccount] = await Promise.all([
      getSecret("jwt-secret"),
      getSecret("firebase-api-key"),
      getSecret("firebase-key"),
    ]);

    return {
      jwtSecret,
      firebaseApiKey,
      firebaseServiceAccount: JSON.parse(firebaseServiceAccount), // Parsing JSON untuk Service Account
    };
  } catch (error) {
    console.error("Error loading secrets:", error.message);
    throw error;
  }
};

module.exports = { getSecret, loadSecrets };
