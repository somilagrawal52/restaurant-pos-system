const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AuraPOS API",
      version: "2.4.0",
      description: "AuraPOS Point of Sale, KDS, Orders, Tables & Inventory Management APIs",
    },
    servers: [
      {
        url: "http://localhost:8080/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Floor: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            capacity: { type: "number" },
          },
        },
        Section: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            tableCount: { type: "number" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsDoc(options);
