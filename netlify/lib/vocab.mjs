// Shared constants for the API, insights, and reports.

export const ALLERGENS = ["peanuts", "tree_nuts", "dairy", "eggs", "gluten", "soy", "fish", "shellfish", "sesame"];
export const CUISINES = ["american", "italian", "mexican", "korean", "chinese", "japanese", "indian", "mediterranean", "healthy", "other"];
export const DIETS = ["vegetarian", "vegan", "halal", "spicy"];
export const MEALS = ["breakfast", "snack", "lunch"];
export const RATINGS = ["good", "mid", "bad"];
export const ROLES = ["cook", "admin", "owner"]; // low to high
export const IDEA_STATUSES = ["new", "planned", "on_menu", "not_now"];

export const RATE_DAYS = 7; // rating stays open this many days, counting the serving day
export const COMMENT_MAX = 280;
export const IDEA_MAX = 120;
export const REPLY_MAX = 160;
export const PHOTO_MAX = 3 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ID = /^[a-z0-9]{6,24}$/;
export const VOTER = /^[A-Za-z0-9_-]{8,64}$/;
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
