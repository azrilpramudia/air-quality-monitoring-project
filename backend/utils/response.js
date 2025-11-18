export const success = (res, message, data = null) => {
  return res.status(200).json({
    status: "success",
    message,
    data,
  });
};

export const error = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    status: "error",
    message,
  });
};
