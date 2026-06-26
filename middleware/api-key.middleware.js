const apiKeyMiddleware = (req, res, next) => {
  const configuredApiKey = process.env.API_KEY;

  if (!configuredApiKey) {
    return next();
  }

  const receivedApiKey = req.get("x-api-key");

  if (receivedApiKey !== configuredApiKey) {
    return res.status(401).json({
      message: "Invalid or missing API key",
    });
  }

  next();
};

module.exports = apiKeyMiddleware;
