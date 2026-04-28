const { Storage } = require("@google-cloud/storage");
const { Firestore } = require("@google-cloud/firestore");
const axios = require("axios");
const jwt = require("../utils/jwt");
const admin = require("../firebase/admin");
const { loadSecrets } = require('../utils/secretManager');
require("dotenv").config();

let firebaseApiKey;

const initializeSecrets = async () => {
  try{
    const secret = await loadSecrets();
    firebaseApiKey = secret.firebaseApiKey;
    console.log("Secrets load successfully");
  }catch(error){
    console.log("Failed to load secrets:",error.message);
  }
}

initializeSecrets();

const storage = new Storage();
const bucketName = "kidzlearn-bucket";

const registerUser = async (request, h) => {
  const { username, email, password } = request.payload;

  if (!username || username.trim() === "") {
    return h
      .response({
        error: "Username cannot be empty",
      })
      .code(400);
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email,
      username,
      exp: 0,       // Initialize exp
      level: 1,     // Initialize level
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const token = jwt.generateToken({ uid: userRecord.uid, email });

    return h
      .response({
        message: "User registered successfully",
        token,
      })
      .code(201);
  } catch (error) {
    return h.response({ error: error.message }).code(400);
  }
};

const loginUser = async (request, h) => {
  const { email, password } = request.payload;

  try {
    // Attempt to sign in using Firebase's signInWithPassword endpoint
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    // Retrieve the user's Firebase record to get additional information
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid; // Get the user's unique ID (uid)

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return h.response({ error: "User data not found" }).code(404);
    }

    const userData = userDoc.data();



    // Generate a custom JWT token
    const token = jwt.generateToken({ email });

    return h
      .response({
        message: "Login successful",
        userId,
        email,
        username: userRecord.displayName || "",
        token,
        exp: userData.exp, // Include exp
        level: userData.level, // Include level
      })
      .code(200);
  } catch (error) {
    console.error(
      "Error response from Firebase:",
      error.response?.data || error.message
    );

    // Always show a generic error message
    return h
      .response({
        error: "Email or password is invalid",
      })
      .code(401);
  }
};

const getCategoryMaterials = async (request, h, category) => {
  try {
    // Define the subfolder structure for each category
    const categoryConfig = {
      animals: {
        prefix: "animals/",
        subfolders: {
          images: "images/",
          sounds: "sounds/",
        },
      },
      colors: {
        prefix: "colors/",
        subfolders: {
          images: "images/",
          sounds: "sounds/",
        },
      },
      colorAnimation: {
        prefix: "colorAnimation/",
        subfolders: {
          images: "images/",
          sounds: "sounds/",
        },
      },
      letterAnimation: {
        prefix: "letterAnimation/",
        subfolders: {
          images: "images/",
          sounds: "sounds/",
        },
      },
      alphabet: {
        prefix: "alphabet/",
        subfolders: {
          images: "images/",
          sounds: "sounds/",
        },
      },
      alphabetAnimation: {
        prefix: "alphabetAnimation/",
        subfolders: {
          images: "images/",
          sounds: "sounds/",
        },
      },
    };

    // Get the configuration for the selected category
    const config = categoryConfig[category];
    if (!config) {
      return h.response({ error: "Invalid category" }).code(400);
    }

    const result = { urls: [] };

    // Iterate through subfolders and fetch files
    for (const [key, subfolderPath] of Object.entries(config.subfolders)) {
      const [files] = await storage.bucket(bucketName).getFiles({
        prefix: `${config.prefix}${subfolderPath}`,
      });

      files.forEach((file) => {
        if (file.name.endsWith("/")) {
          return;
        }
        
        const name = file.name.split("/").pop().split(".")[0]; // Extract name without extension

        // Find or create an entry for the file
        let entry = result.urls.find((item) => item.name === name);
        if (!entry) {
          entry = { name };
          result.urls.push(entry);
        }

        // Add the appropriate URL based on the subfolder
        const url = `https://storage.googleapis.com/${bucketName}/${file.name}`;
        if (key === "images") entry.urlImages = url;
        if (key === "sounds") entry.urlSuara = url;
      });
    }

    result.urls = result.urls.filter((item) => item.name && item.urlImages);
    result.urls.sort((a, b) => new Date(a.updated) - new Date(b.updated));

    return h.response(result).code(200);
  } catch (error) {
    console.error("Error fetching category materials:", error);
    return h.response({ error: error.message }).code(500);
  }
};

// const getBankSoal = async (_request, h) => {
//   try {
//     const db = admin.firestore();

//     console.log("Fetching data from Firestore collection: bankSoal");
//     const snapshot = await db.collection('banksoal').get();

//     console.log("Query snapshot size:", snapshot.size);
//     if (snapshot.empty) {
//       console.log("No documents found in 'banksoal' collection");
//       return h.response({
//         status: "success",
//         data: [],
//       }).code(200);
//     }

//     const data = snapshot.docs.map((doc) => {
//       console.log("Document data:", doc.data());
//       const docData = doc.data();
//       return {
//         id: doc.id,
//         bankSoal: {
//           answer: docData.answer || null,
//           urlGuide: docData.urlGuide || null,
//           urlImg: docData.urlImg || null,
//         },
//       };
//     });

//     console.log("Fetched data:", data);

//     return h.response({
//       status: "success",
//       data,
//     }).code(200);
//   } catch (error) {
//     console.error("Failed to retrieve bank soal:", error);
//     return h.response({
//       status: "fail",
//       message: error.message || "Internal Server Error",
//     }).code(500);
//   }
// };

const getCollectionData = async (collectionName, _request, h) => {
  try {
    const db = new Firestore();

    console.log(`Fetching data from Firestore collection: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`No documents found in collection: ${collectionName}`);
      return h.response({
        status: "success",
        data: [],
      }).code(200);
    }

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // console.log(`Fetched data from ${collectionName}:`, data);

    return h.response({
      status: "success",
      data,
    }).code(200);
  } catch (error) {
    console.error(`Failed to retrieve data from ${collectionName}:`, error);
    return h.response({
      status: "fail",
      message: error.message || "Internal Server Error",
    }).code(500);
  }
};

const getBankSoal = (request, h) => {
  return getCollectionData('banksoal', request, h);
};

const getQuestionWritting = (request, h) => {
  return getCollectionData('questionWriting', request, h);
};

const updateUserProgress = async (userId, expGained, levelGained) => {
  const db = admin.firestore();

  try {
    // Fetch the user's current data
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    let { exp, level } = userData;

    // Add the gained experience
    exp += expGained;
    level += levelGained;

    // Recalculate level (assuming level-up every 100 exp)
    // const newLevel = Math.floor(exp / 100) + 1;

    // Update Firestore with new exp and level
    await db.collection('users').doc(userId).update({
      exp,
      level,
    });

    console.log(`Updated user progress: exp=${exp}, level=${level}`);
    return { exp, level };
  } catch (error) {
    console.error("Error updating user progress:", error.message);
    throw new Error("Could not update user progress");
  }
};

const updateExp = async (request, h) => {
  const { userId, expGained, levelGained } = request.payload;

  // Validate input
  if (typeof expGained !== "number" || expGained < 0 || typeof levelGained !== "number" || levelGained < 0) {
    return h
      .response({ error: "Invalid expGained or levelGained value" })
      .code(400);
  }

  try {
    // Update user progress
    const progress = await updateUserProgress(userId, expGained, levelGained);

    return h
      .response({
        message: "Progress updated successfully",
        exp: progress.exp,
        level: progress.level,
      })
      .code(200);
  } catch (error) {
    console.error("Error completing question:", error.message);
    return h
      .response({ error: "Could not update progress" })
      .code(500);
  }
};



module.exports = { registerUser, loginUser, getCategoryMaterials, getBankSoal, getQuestionWritting, updateExp  };
