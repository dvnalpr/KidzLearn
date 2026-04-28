const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModels = require('../services/loadModels');
const InputError = require('../exceptions/InputError');

require('dotenv').config(); // Load environment variables

(async () => {
  try {
      const server = Hapi.server({
          port: process.env.PORT || 3000,
          host: '0.0.0.0',
          routes: {
              cors: {
                  origin: ['*'], // Batasi jika di production
              },
          },
      });

      // Load TensorFlow Model
    //   let model;
    //   try {
    //       model = await loadModels();
    //       server.app.model = model;
    //   } catch (error) {
    //       console.error("Error loading model:", error);
    //       process.exit(1); // Keluar jika model gagal dimuat
    //   }

      // Tambahkan routes
      server.route(routes);

      // Middleware global untuk penanganan error
      server.ext('onPreResponse', (request, h) => {
          const response = request.response;

          // Penanganan payload terlalu besar
          // if (response.isBoom && response.output.statusCode === 413) {
          //     return h.response({
          //         status: 'fail',
          //         message: 'Payload content length greater than maximum allowed: 1000000',
          //     }).code(413).takeover();
          // }

          // Penanganan error 500
          // if (response.isBoom && response.output.statusCode === 500) {
          //     console.error("Internal Server Error:", response.message);
          //     return h.response({
          //         status: 'error',
          //         message: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
          //     }).code(500).takeover();
          // }

          // Penanganan InputError khusus
          if (response instanceof InputError) {
              return h.response({
                  status: 'fail',
                  message: 'Terjadi kesalahan dalam melakukan prediksi',
              }).code(400);
          }

          // Penanganan error lain
          if (response.isBoom) {
              return h.response({
                  status: 'fail',
                  message: response.message,
              }).code(response.output.statusCode);
          }

          // Lanjutkan jika tidak ada error
          return h.continue;
      });

      // Start server
      await server.start();
      console.log(`Server started at: ${server.info.uri}`);
  } catch (error) {
      console.error("Error starting server:", error);
      process.exit(1); // Keluar jika terjadi error fatal
  }
})();