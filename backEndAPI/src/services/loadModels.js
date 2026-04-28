// const tf = require('@tensorflow/tfjs-node');
// require('dotenv').config();

// async function loadModels() {
//   try {
//     console.log('Loading letter model from:', process.env.LETTER_MODEL_URL);
//     const letterModel = await tf.loadLayersModel(process.env.LETTER_MODEL_URL);
//     console.log('Letter model loaded successfully:', letterModel.summary());

//     // console.log('Loading number model from:', process.env.NUMBER_MODEL_URL);
//     // const numberModel = await tf.loadLayersModel(process.env.NUMBER_MODEL_URL);  
//     // console.log('Number model loaded successfully:', numberModel.summary());

//     return { numberModel };
//   } catch (error) {
//     console.error('Failed to load models:', error);
//     throw new Error('Failed to load models.');
//   }
// }

// module.exports = loadModels;
