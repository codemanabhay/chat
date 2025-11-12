// Auto-healing utility for server health checks

const checkDatabaseConnection = async (mongoose) => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✓ Database connection healthy');
      return true;
    } else {
      console.log('✗ Database connection lost, attempting reconnect...');
      await mongoose.connect(process.env.MONGO_URI);
      return true;
    }
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
};

const healthCheckMiddleware = (io) => {
  return (req, res, next) => {
    const healthStatus = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      socketConnections: io.engine.clientsCount || 0,
      memory: process.memoryUsage(),
    };
    
    if (req.path === '/health') {
      return res.json({
        status: 'healthy',
        ...healthStatus
      });
    }
    next();
  };
};

module.exports = {
  checkDatabaseConnection,
  healthCheckMiddleware
};
