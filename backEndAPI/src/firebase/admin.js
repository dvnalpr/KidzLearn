const admin = require('firebase-admin');
const { loadSecrets } = require('../utils/secretManager');

const initializeFirebase = async () => {
  try{
    const secrets = await loadSecrets();
    
    if(!admin.apps.length){
      admin.initializeApp({
        credential: admin.credential.cert(secrets.firebaseServiceAccount),
      });
    }

    console.log("Firebase admin initialize successfully")
  }catch(error){
    console.log("Failed to initialize Firebase Admin:", error.message);
  }
}

initializeFirebase();

module.exports = admin;