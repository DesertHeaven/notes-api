const { z } = require("zod");

const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title must be a non-empty string"),
  content: z.string().trim().min(1, "Content must be a non-empty string"),
});

const updateNoteSchema = createNoteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least title or content is required",
  },
);

const formatValidationErrors = (issues) => {
  return issues.map((issue) => {
    return {
      field: issue.path.join(".") || "body",
      message: issue.message,
    };
  });
};

module.exports = {
  createNoteSchema,
  updateNoteSchema,
  formatValidationErrors,
};
