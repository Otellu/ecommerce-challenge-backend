import { config } from "@/config/environment";
import { connectDatabase } from "@/config/database";
import createApp from "@/app";

/**
 * Server startup and configuration
 * Handles database connection and graceful shutdown
 */

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    console.log("✅ Database connected successfully");

    // Create Express application
    const app = createApp();

    // Start server
    const server = app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📚 API Base URL: http://localhost:${config.PORT}/api`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📴 ${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        console.error("⚠️  Forcing server shutdown");
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("💥 Uncaught Exception:", error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default startServer;
