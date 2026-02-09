/**
 * Standardized API Response class
 */
class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static created(res, message, data = null) {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  static paginated(res, message, data, pagination) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination
    });
  }
}

module.exports = ApiResponse;
