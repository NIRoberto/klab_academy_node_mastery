import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Dynamic server configuration based on environment
const PORT = process.env.PORT || "3000";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Log Swagger configuration
console.log("📚 Swagger Configuration:");
console.log(`   - API URL: ${API_URL}`);
console.log(`   - Environment: ${IS_PRODUCTION ? "Production" : "Development"}`);
console.log(`   - Docs available at: ${API_URL}/api-docs`);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product API Documentation",
      version: "1.0.0",
      description:
        "A complete REST API for product management with authentication",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: API_URL,
        description: IS_PRODUCTION ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in format: Bearer <token>",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
