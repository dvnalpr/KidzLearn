// const admin = require('../firebase/admin');
// require('dotenv').config();

// async function storeData(id, data) {
//   try{
//     const db = admin.firestore();

//     const predictCollection = db.collection('predictions');
//     const docRef = predictCollection.doc(id);

//     const docSnapshot = await docRef.get();
//     if (docSnapshot.exists) {
//       throw new InputError('Data dengan ID ini sudah ada di database.');
//     }
    
//     await docRef.set(data);
//     return docRef;
//   }catch(error){
//     console.error("Failed to save data:",error);
//     throw new Error("Failed to save prediction data to Firestore.");
//   }
// }
 
// module.exports = storeData;