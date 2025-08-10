export const validation = (schema) => {
  return (req, res, next) => {
    let validationError = [];
    for (const key of Object.keys(schema)) {
      const result = schema[key].validate(req[key], { abortEarly: false });
      if (result?.error) {
        validationError.push(result.error.details);
      }
    }
    if (validationError.length) {
      return res.status(400).json({ error: validationError });
    }
    return next();
  };
}