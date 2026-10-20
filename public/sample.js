// Sample week an organizer can load to try LunchLine. Index 0 = Monday.
// Every sample dish has a photo in public/samples/; leave out any dish without one.
// The snacks (listed under Breakfast/Snacks) are real packaged items; their
// calories, ingredients, and allergens come from the product labels.
const SAMPLE_SNACKS = [
  { name: "Powdered Mini Donuts", photo: "/samples/powdered-mini-donuts.jpg", desc: "Goody Man whole-grain mini donuts dusted with powdered sugar. 3 oz pack.", cuisine: "american", diet: ["vegetarian"], calories: 270,
    ingredients: "Whole wheat flour, enriched wheat flour (wheat flour, malted barley flour, niacin, iron, thiamine mononitrate, riboflavin, folic acid), sugar, palm oil, water, dextrose, soybean oil, eggs, soy flour, nonfat dry milk, modified corn starch, modified wheat starch, dry honey solids, leavening (sodium bicarbonate, sodium acid pyrophosphate, sodium aluminum phosphate, glucono delta-lactone), mono- and diglycerides, soy lecithin, salt, cinnamon, natural and artificial flavor, titanium dioxide (color), calcium propionate (preservative)",
    allergens: ["gluten", "eggs", "dairy", "soy"] },
  { name: "Cheesy Pull-Aparts", photo: "/samples/cheesy-pull-aparts.jpg", desc: "Pillsbury oven-baked whole-grain bread filled with real cheese. Italian Cheeses & Garlic.", cuisine: "italian", diet: ["vegetarian"], calories: 300,
    ingredients: "Reduced fat mozzarella cheese (part skim milk, nonfat milk, modified food starch, cultures, salt, vitamin A palmitate, enzymes), whole wheat flour, enriched wheat flour (wheat flour, malted barley flour, wheat starch, niacin, iron, thiamin mononitrate, riboflavin, folic acid), water, soybean oil, sugar. 2% or less of: yeast, parmesan cheese (milk, cultures, salt, enzymes), salt, natural flavor",
    allergens: ["gluten", "dairy"] },
  { name: "Banana Bread", photo: "/samples/banana-bread.jpg", desc: "Super Bakery whole-grain banana bread slice with a hint of cinnamon and honey.", cuisine: "american", diet: ["vegetarian"], calories: 260,
    ingredients: "Water, whole wheat flour, enriched wheat flour (wheat flour, malted barley flour, niacin, iron, thiamine mononitrate, riboflavin, folic acid), sugar, soybean oil, bananas, egg whites, defatted soy flour, sodium acid pyrophosphate, wheat gluten, sodium bicarbonate, modified corn starch, modified wheat starch, dextrose, mono- and diglycerides, dry honey solids, corn starch, natural flavor, salt, guar gum, xanthan gum, cinnamon, monocalcium phosphate, soy lecithin, whey",
    allergens: ["gluten", "eggs", "soy", "dairy"] },
  { name: "Oatmeal Chocolate Chip Bar", photo: "/samples/oatmeal-chocolate-chip-bar.jpg", desc: "BeneFIT soft-baked oatmeal bar with chocolate chips. 3 g fiber.", cuisine: "american", diet: ["vegetarian"], calories: 280,
    ingredients: "Wheat flour (whole wheat flour, enriched wheat flour [wheat flour, niacin, reduced iron, thiamine mononitrate, riboflavin, folic acid]), sugar, oats, chocolate chips (sugar, chocolate liquor, cocoa butter, dextrose, soy lecithin, vanilla flavor), eggs, soybean oil, invert sugar, canola oil, sugarcane molasses. 2% or less of: whey, natural flavor, baking soda, inulin, baking powder (sodium acid pyrophosphate, sodium bicarbonate, corn starch, monocalcium phosphate), xanthan gum, salt, soy lecithin",
    allergens: ["gluten", "eggs", "dairy", "soy"] },
];

// Typical school pizza slices; ingredients and allergens are illustrative.
// Photo credits are in public/samples/CREDITS.md.
const SAMPLE_LUNCH = [
  { name: "Cheese Pizza", photo: "/samples/cheese-pizza.jpg", desc: "Slice of cheese pizza with tomato sauce and mozzarella.", cuisine: "italian", diet: ["vegetarian"], calories: 290,
    ingredients: "Crust (enriched wheat flour, whole wheat flour, water, soybean oil, yeast, sugar, salt), tomato sauce (tomato paste, water, garlic, oregano, basil), low-moisture part-skim mozzarella cheese (milk, cultures, salt, enzymes)",
    allergens: ["gluten", "dairy"], may: ["soy"] },
  { name: "Pepperoni Pizza", photo: "/samples/pepperoni-pizza.jpg", desc: "Slice of cheese pizza topped with pepperoni. Contains pork.", cuisine: "italian", calories: 330,
    ingredients: "Crust (enriched wheat flour, whole wheat flour, water, soybean oil, yeast, sugar, salt), tomato sauce (tomato paste, water, garlic, oregano, basil), low-moisture part-skim mozzarella cheese (milk, cultures, salt, enzymes), pepperoni (pork, beef, salt, spices, dextrose, paprika, garlic, sodium nitrite)",
    allergens: ["gluten", "dairy"], may: ["soy"] },
];

window.SAMPLE_WEEK = Array.from({ length: 5 }, () => ({
  breakfast: [...SAMPLE_SNACKS],
  lunch: [...SAMPLE_LUNCH],
}));
