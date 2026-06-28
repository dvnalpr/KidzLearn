const handlers = require("../server/handler");
const Formidable = require("formidable");
const { getPrediction } = require("../services/inferenceService");
const validateToken = require("../server/validateToken");

const routes = [
  {
    method: "POST",
    path: "/register",
    handler: handlers.registerUser,
  },
  {
    method: "POST",
    path: "/login",
    handler: handlers.loginUser,
  },
  {
    method: "GET",
    path: "/animals",
    options: {
      pre: [validateToken],
    },
    handler: (request, h) =>
      handlers.getCategoryMaterials(request, h, "animals"),
  },
  {
    method: "GET",
    path: "/colors",
    options: {
      pre: [validateToken],
    },
    handler: (request, h) =>
      handlers.getCategoryMaterials(request, h, "colors"),
  },
  {
    method: "GET",
    path: "/colorAnimation",
    options: {
      pre: [validateToken],
    },
    handler: (request, h) =>
      handlers.getCategoryMaterials(request, h, "colorAnimation"),
  },
  {
    method: "GET",
    path: "/questionWritting",
    options: {
      pre: [validateToken],
    },
    handler: handlers.getQuestionWritting,
  },
  {
    method: "GET",
    path: "/bankSoal",
    options: {
      pre: [validateToken],
    },
    handler: handlers.getBankSoal,
  },
  {
    method: "GET",
    path: "/user/{uid}",
    options: {
      pre: [validateToken],
    },
    handler: handlers.getUserProfile,
  },
  {
    method: "POST",
    path: "/update-progress",
    options: {
      pre: [validateToken],
    },
    handler: handlers.updateExp,
  },
  {
    method: "POST",
    path: "/predict",
    options: {
      pre: [validateToken],
      payload: {
        allow: "multipart/form-data",
        multipart: true,
        output: "stream",
        parse: false,
      },
    },
    handler: async (request, h) => {
      const form = new Formidable.IncomingForm();

      return new Promise((resolve) => {
        form.parse(request.raw.req, async (err, fields, files) => {
          if (err) {
            console.error("Form parsing error:", err);
            return resolve(
              h
                .response({ status: "fail", message: "File upload failed" })
                .code(400),
            );
          }

          console.log("Files:", files);
          console.log("Fields:", fields);

          try {
            const fileObject = files.image[0];
            if (!fileObject || !fileObject.filepath) {
              throw new Error("Uploaded file is missing or invalid.");
            }

            const filePath = fileObject.filepath;
            const isLetter = fields.is_letter[0] === "true";
            const result = await getPrediction(filePath, isLetter);
            resolve(h.response(result).code(200));
          } catch (error) {
            console.error("Error:", error);
            resolve(
              h.response({ status: "fail", message: error.message }).code(500),
            );
          }
        });
      });
    },
  },
];

module.exports = routes;
