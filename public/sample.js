// Sample week an organizer can load to try LunchLine. Index 0 = Monday.
// Each day is { breakfast, snack, lunch }.
// Every sample dish has a photo in public/samples/ (credits in CREDITS.md);
// never add a dish without one.
// The packaged snacks are real products; their calories, ingredients, and
// allergens come from the labels. Everything else is a typical school-lunch
// version of the dish, so its ingredients and allergens are illustrative.
const CRUST = "Crust (enriched wheat flour, whole wheat flour, water, soybean oil, yeast, sugar, salt), tomato sauce (tomato paste, water, garlic, oregano, basil), low-moisture part-skim mozzarella cheese (milk, cultures, salt, enzymes)";
const DISH = {
  // ----- breakfast (pancakes ... muffin) and snacks (fruitCup ... oatBar) -----
  pancakes: { name: "Pancakes", photo: "/samples/pancakes.jpg", desc: "Stack of whole-grain pancakes with syrup and a pat of butter.", cuisine: "american", diet: ["vegetarian"], calories: 350,
    ingredients: "Whole wheat flour, enriched wheat flour, milk, eggs, sugar, soybean oil, baking powder, salt, vanilla. Served with pancake syrup and butter.",
    allergens: ["gluten", "dairy", "eggs"], may: ["soy"] },
  parfait: { name: "Yogurt Parfait", photo: "/samples/yogurt-parfait.jpg", desc: "Vanilla yogurt layered with granola and blueberries.", cuisine: "healthy", diet: ["vegetarian"], calories: 220,
    ingredients: "Low-fat vanilla yogurt (cultured milk, sugar, vanilla, pectin), granola (rolled oats, honey, canola oil, rice crisps), blueberries",
    allergens: ["dairy"], may: ["gluten", "tree_nuts"] },
  burrito: { name: "Breakfast Burrito", photo: "/samples/breakfast-burrito.jpg", desc: "Scrambled eggs, cheese, and spinach in a warm flour tortilla.", cuisine: "mexican", diet: ["vegetarian"], calories: 330,
    ingredients: "Flour tortilla (enriched wheat flour, water, soybean oil, baking powder, salt), scrambled eggs, cheddar cheese, spinach, salsa",
    allergens: ["gluten", "eggs", "dairy", "soy"] },
  frenchToast: { name: "French Toast", photo: "/samples/french-toast.jpg", desc: "Two slices of cinnamon French toast with syrup.", cuisine: "american", diet: ["vegetarian"], calories: 310,
    ingredients: "Whole-grain bread (whole wheat flour, water, sugar, yeast, soybean oil, salt), eggs, milk, cinnamon, vanilla. Served with pancake syrup.",
    allergens: ["gluten", "eggs", "dairy", "soy"] },
  muffin: { name: "Blueberry Muffin", photo: "/samples/blueberry-muffin.jpg", desc: "Soft-baked whole-grain muffin packed with blueberries.", cuisine: "american", diet: ["vegetarian"], calories: 260,
    ingredients: "Whole wheat flour, enriched wheat flour, sugar, blueberries, soybean oil, eggs, nonfat milk, baking powder, salt, natural flavor",
    allergens: ["gluten", "eggs", "dairy", "soy"] },
  fruitCup: { name: "Fresh Fruit Cup", photo: "/samples/fruit-cup.jpg", desc: "Strawberries, cantaloupe, and honeydew, cut fresh this morning.", cuisine: "healthy", diet: ["vegan", "vegetarian"], calories: 60,
    ingredients: "Strawberries, cantaloupe, honeydew melon",
    allergens: [] },
  donuts: { name: "Powdered Mini Donuts", photo: "/samples/powdered-mini-donuts.jpg", desc: "Goody Man whole-grain mini donuts dusted with powdered sugar. 3 oz pack.", cuisine: "american", diet: ["vegetarian"], calories: 270,
    ingredients: "Whole wheat flour, enriched wheat flour (wheat flour, malted barley flour, niacin, iron, thiamine mononitrate, riboflavin, folic acid), sugar, palm oil, water, dextrose, soybean oil, eggs, soy flour, nonfat dry milk, modified corn starch, modified wheat starch, dry honey solids, leavening (sodium bicarbonate, sodium acid pyrophosphate, sodium aluminum phosphate, glucono delta-lactone), mono- and diglycerides, soy lecithin, salt, cinnamon, natural and artificial flavor, titanium dioxide (color), calcium propionate (preservative)",
    allergens: ["gluten", "eggs", "dairy", "soy"] },
  pullAparts: { name: "Cheesy Pull-Aparts", photo: "/samples/cheesy-pull-aparts.jpg", desc: "Pillsbury oven-baked whole-grain bread filled with real cheese. Italian Cheeses & Garlic.", cuisine: "italian", diet: ["vegetarian"], calories: 300,
    ingredients: "Reduced fat mozzarella cheese (part skim milk, nonfat milk, modified food starch, cultures, salt, vitamin A palmitate, enzymes), whole wheat flour, enriched wheat flour (wheat flour, malted barley flour, wheat starch, niacin, iron, thiamin mononitrate, riboflavin, folic acid), water, soybean oil, sugar. 2% or less of: yeast, parmesan cheese (milk, cultures, salt, enzymes), salt, natural flavor",
    allergens: ["gluten", "dairy"] },
  bananaBread: { name: "Banana Bread", photo: "/samples/banana-bread.jpg", desc: "Super Bakery whole-grain banana bread slice with a hint of cinnamon and honey.", cuisine: "american", diet: ["vegetarian"], calories: 260,
    ingredients: "Water, whole wheat flour, enriched wheat flour (wheat flour, malted barley flour, niacin, iron, thiamine mononitrate, riboflavin, folic acid), sugar, soybean oil, bananas, egg whites, defatted soy flour, sodium acid pyrophosphate, wheat gluten, sodium bicarbonate, modified corn starch, modified wheat starch, dextrose, mono- and diglycerides, dry honey solids, corn starch, natural flavor, salt, guar gum, xanthan gum, cinnamon, monocalcium phosphate, soy lecithin, whey",
    allergens: ["gluten", "eggs", "soy", "dairy"] },
  oatBar: { name: "Oatmeal Chocolate Chip Bar", photo: "/samples/oatmeal-chocolate-chip-bar.jpg", desc: "BeneFIT soft-baked oatmeal bar with chocolate chips. 3 g fiber.", cuisine: "american", diet: ["vegetarian"], calories: 280,
    ingredients: "Wheat flour (whole wheat flour, enriched wheat flour [wheat flour, niacin, reduced iron, thiamine mononitrate, riboflavin, folic acid]), sugar, oats, chocolate chips (sugar, chocolate liquor, cocoa butter, dextrose, soy lecithin, vanilla flavor), eggs, soybean oil, invert sugar, canola oil, sugarcane molasses. 2% or less of: whey, natural flavor, baking soda, inulin, baking powder (sodium acid pyrophosphate, sodium bicarbonate, corn starch, monocalcium phosphate), xanthan gum, salt, soy lecithin",
    allergens: ["gluten", "eggs", "dairy", "soy"] },

  // ----- lunch -----
  tenders: { name: "Chicken Tenders & Fries", photo: "/samples/chicken-tenders.jpg", desc: "Crispy breaded chicken tenders with seasoned fries and ranch.", cuisine: "american", calories: 620,
    ingredients: "Chicken breast, breading (enriched wheat flour, whole wheat flour, salt, spices, paprika), soybean oil, potatoes, ranch dressing (soybean oil, buttermilk, egg yolk, vinegar, garlic, onion, herbs)",
    allergens: ["gluten", "soy", "dairy", "eggs"], may_other: "Fries are cooked in a shared fryer" },
  cheesePizza: { name: "Cheese Pizza", photo: "/samples/cheese-pizza.jpg", desc: "Slice of cheese pizza with tomato sauce and mozzarella.", cuisine: "italian", diet: ["vegetarian"], calories: 290,
    ingredients: CRUST,
    allergens: ["gluten", "dairy"], may: ["soy"] },
  pepperoniPizza: { name: "Pepperoni Pizza", photo: "/samples/pepperoni-pizza.jpg", desc: "Slice of cheese pizza topped with pepperoni. Contains pork.", cuisine: "italian", calories: 330,
    ingredients: CRUST + ", pepperoni (pork, beef, salt, spices, dextrose, paprika, garlic, sodium nitrite)",
    allergens: ["gluten", "dairy"], may: ["soy"] },
  caesar: { name: "Caesar Salad", photo: "/samples/caesar-salad.jpg", desc: "Romaine, parmesan, and crunchy croutons with Caesar dressing.", cuisine: "healthy", diet: ["vegetarian"], calories: 280,
    ingredients: "Romaine lettuce, croutons (wheat flour, soybean oil, garlic, salt), parmesan cheese, Caesar dressing (soybean oil, water, parmesan cheese, egg yolk, vinegar, lemon juice, garlic, anchovy)",
    allergens: ["gluten", "dairy", "eggs", "fish", "soy"] },
  tacos: { name: "Beef Street Tacos", photo: "/samples/beef-tacos.jpg", desc: "Three corn tortillas with seasoned beef, onion, cilantro, and lime.", cuisine: "mexican", calories: 480,
    ingredients: "Corn tortillas (corn masa, water, lime), ground beef, taco seasoning (chili pepper, cumin, garlic, onion, salt, paprika), onion, cilantro, lime, salsa",
    allergens: [] },
  quesadilla: { name: "Cheese Quesadilla", photo: "/samples/quesadilla.jpg", desc: "Grilled flour tortilla filled with melted Monterey Jack, with salsa.", cuisine: "mexican", diet: ["vegetarian"], calories: 420,
    ingredients: "Flour tortilla (enriched wheat flour, water, soybean oil, baking powder, salt), Monterey Jack cheese (milk, cultures, salt, enzymes), salsa (tomatoes, onion, jalapeño, cilantro, lime)",
    allergens: ["gluten", "dairy", "soy"] },
  spaghetti: { name: "Spaghetti & Meatballs", photo: "/samples/spaghetti-meatballs.jpg", desc: "Whole-grain spaghetti with marinara and three beef meatballs.", cuisine: "italian", calories: 560,
    ingredients: "Whole-grain spaghetti (whole durum wheat flour, durum semolina), marinara (tomatoes, onion, garlic, olive oil, basil, oregano), beef meatballs (beef, breadcrumbs [wheat flour, yeast, salt], eggs, parmesan cheese, garlic, parsley)",
    allergens: ["gluten", "eggs", "dairy"] },
  wrap: { name: "Chicken Caesar Wrap", photo: "/samples/chicken-caesar-wrap.jpg", desc: "Crispy chicken, romaine, and parmesan rolled in a flour tortilla.", cuisine: "american", calories: 510,
    ingredients: "Flour tortilla (enriched wheat flour, water, soybean oil, baking powder, salt), breaded chicken (chicken, wheat flour, spices), romaine lettuce, parmesan cheese, Caesar dressing (soybean oil, water, parmesan cheese, egg yolk, vinegar, anchovy)",
    allergens: ["gluten", "dairy", "eggs", "fish", "soy"] },
  chefSalad: { name: "Chef Salad", photo: "/samples/chef-salad.jpg", desc: "Turkey, ham, cheese, egg, and veggies on crisp greens.", cuisine: "healthy", calories: 380,
    ingredients: "Romaine and leaf lettuce, turkey, ham, cheddar cheese, Swiss cheese, hard-boiled egg, cherry tomatoes, carrots. Choice of ranch or Italian dressing.",
    allergens: ["dairy", "eggs"], may: ["soy"] },
  teriyaki: { name: "Teriyaki Chicken Bowl", photo: "/samples/teriyaki-chicken-bowl.jpg", desc: "Grilled teriyaki chicken over steamed rice with a side salad.", cuisine: "japanese", calories: 540,
    ingredients: "Chicken thigh, teriyaki sauce (soy sauce [water, wheat, soybeans, salt], sugar, mirin, garlic, ginger), white rice, lettuce, cucumber, tomato",
    allergens: ["soy", "gluten"], may: ["sesame"] },
  orangeChicken: { name: "Orange Chicken & Fried Rice", photo: "/samples/chicken-fried-rice.jpg", desc: "Sweet and tangy orange chicken with veggie fried rice.", cuisine: "chinese", calories: 590,
    ingredients: "Battered chicken (chicken, wheat flour, corn starch, eggs), orange sauce (sugar, orange juice, soy sauce, vinegar, garlic, ginger), fried rice (rice, eggs, peas, carrots, green onion, soybean oil, soy sauce)",
    allergens: ["gluten", "eggs", "soy"], may: ["sesame"] },
  mac: { name: "Mac & Cheese", photo: "/samples/mac-and-cheese.jpg", desc: "Creamy baked macaroni and cheddar cheese.", cuisine: "american", diet: ["vegetarian"], calories: 430,
    ingredients: "Whole-grain macaroni (whole wheat flour, durum semolina), cheddar cheese sauce (milk, cheddar cheese, butter, wheat flour, salt, paprika)",
    allergens: ["gluten", "dairy"] },
  burger: { name: "Cheeseburger & Fries", photo: "/samples/cheeseburger.jpg", desc: "Beef patty with melted cheese, pickles, and fries on the side.", cuisine: "american", calories: 650,
    ingredients: "Whole-grain bun (whole wheat flour, water, sugar, yeast, soybean oil, salt, sesame seeds), beef patty, American cheese (milk, cultures, salt), pickles, ketchup, mustard, potatoes, soybean oil",
    allergens: ["gluten", "dairy", "soy", "sesame"], may_other: "Fries are cooked in a shared fryer" },
};


// ---------- the school cafeteria's real menu ----------
// Source: a school district's "Nutritional Information, High School, 2026-2027" sheet. Calories,
// nutrients and allergens below are copied from it, one row per dish (the row used is noted where the
// menu name and the sheet's name differ). The sheet itself says it "may not be accurate" and that
// cross-contact can't be guaranteed, which LunchLine repeats wherever allergens are shown.
// Ingredient lists aren't on the sheet, so dishes say to ask nutrition services.

// "Wheat, milk, soy may contain egg" -> { contains: [gluten, dairy, soy], may: [eggs] }
const ALG = [[/wheat|gluten/i, "gluten"], [/milk|cheese/i, "dairy"], [/soy/i, "soy"], [/egg/i, "eggs"], [/peanut/i, "peanuts"], [/fish/i, "fish"], [/sesame/i, "sesame"], [/pine ?nut|tree nut/i, "tree_nuts"]];
function allergens(text) {
  const [has, maybe = ""] = String(text || "").split(/may contain/i);
  const keys = t => [...new Set(ALG.filter(([re]) => re.test(t)).map(([, k]) => k))];
  const contains = keys(has);
  return { contains, may: keys(maybe).filter(k => !contains.includes(k)) };
}
const NO_INGREDIENTS = "The full ingredient list isn't on the nutrition sheet. Ask nutrition services.";

// n = [calories, protein g, fat g, saturated fat g, carbs g, fiber g, sodium mg]; null where the sheet is blank.
function m(name, o) {
  const [cal, protein, fat, sat, carbs, fiber, sodium] = o.n || [];
  const a = allergens(o.a);
  const v = x => (x === undefined ? null : x);
  return {
    name, photo: o.photo || "", desc: o.desc || "", ingredients: o.ing || NO_INGREDIENTS, cuisine: o.cuisine || "american", diet: o.diet || [],
    calories: v(cal), protein: v(protein), fat: v(fat), sat_fat: v(sat), carbs: v(carbs), fiber: v(fiber), sodium: v(sodium),
    allergens: a.contains, may: a.may, may_other: o.cross || "",
  };
}

// The nutrition sheet, used only to look up the numbers for dishes on the menu. Every row, in order: [section, name, calories, protein g, fat g, sat fat g, carbs g, fiber g, sodium mg, allergens].
// A blank on the sheet is null. Two entries with typos on the sheet are corrected here ("What" for Wheat, "fires" for fries),
// and one protein figure that was printed as 464.958 g is left blank.
const SHEET = [
  ["Entree", "Alfredo Chicken and Pasta", 388.5, 25.727, 11.0, 5.0, 46.0, 6.0, 510.0, "Wheat, milk"],
  ["Entree", "Alfredo Pasta - spicy pink alfredo", 443.9, 22.89, 14.0, 7.5, 57.0, 5.8, 1049.0, "Wheat, milk"],
  ["Entree", "Alfredo Vegetarian", 519.0, 28.836, 18.5, 9.7, 46.6, 8.0, 1048.0, "Wheat, milk"],
  ["Entree", "Baked Potato Bacon & Jalapeno Cheese", 535.0, 21.753, 17.0, 8.8, 73.0, 5.0, 824.0, "Milk, soy"],
  ["Entree", "Baked Potato and Chili Turkey", 432.0, 22.311, 7.0, 3.0, 74.0, 6.0, 700.0, "Milk"],
  ["Entree", "Baked Potato Cheese", 451.0, 21.897, 9.0, 5.0, 75.0, 5.0, 1318.0, "Milk"],
  ["Entree", "BBQ Beef Sandwich", 458.0, 21.2, 13.65, 4.7, 64.0, 3.0, 1070.0, "Wheat, soy"],
  ["Entree", "BBQ Chicken Sandwich, swiss", 325.0, 29.0, 7.0, 5.7, 37.0, 3.0, 677.0, "Wheat, soy, milk"],
  ["Entree", "BBQ Chicken Club Sandwich", 359.0, 29.308, 10.0, 6.5, 38.0, 3.0, 919.0, "Wheat, milk, soy"],
  ["Entree", "BBQ Shredded Chicken Sandwich", 377.0, 19.4, 6.0, 1.35, 60.0, 3.0, 868.0, "Wheat"],
  ["Entree", "Beefaroni", 354.0, 17.702, 13.0, 5.0, 42.0, 7.0, 252.0, "Wheat, milk"],
  ["Entree", "Beef and Broccoli Bowl", 492.0, 21.58, 15.5, 5.0, 71.0, 3.7, 991.0, "Wheat, soy"],
  ["Entree", "Beef Rib Honey BBQ & Mac n Cheese & Roll", 642.0, 31.763, 31.0, 15.0, 64.0, 7.5, 1600.0, "Wheat, milk, soy, eggs"],
  ["Entree", "Beef Rib Honey BBQ Sandwich", 368.0, 19.239, 14.0, 5.0, 42.0, 1.9, 946.0, "Wheat, soy, milk"],
  ["Entree", "Beef Rib Honey BBQ with Cheese Sandwich", 402.0, 21.739, 16.0, 6.5, 43.5, 5.0, 1174.0, "Wheat, soy, milk"],
  ["Entree", "Beef Teriyaki Dunkers Rice Bowl 1 C Rice 5 pc", 489.0, 21.38, 20.0, 6.6, 57.0, 4.0, 798.0, "Wheat, soy, sesame oil"],
  ["Entree", "Bosco Sticks 6 inch 2 each cheese", 300.0, 20.0, 10.0, 5.0, 34.0, 4.0, 440.0, "Wheat, milk"],
  ["Entree", "Buffalo Mac & Cheese with chicken", 354.0, 22.388, 9.0, 3.7, 45.0, 7.0, 993.0, "Wheat, milk, soy"],
  ["Entree", "Buffalo Bacon Chicken Mac & Cheese Bowl & Chips", 751.0, 33.066, 26.0, 18.0, 65.0, 6.0, 2300.0, "Wheat, milk, soy"],
  ["Entree", "Burrito, Bean & Cheesy 12\" tortilla, 1/2C Bean 1/2 C Rice", 680.0, 27.336, 18.7, 9.7, 98.5, 16.0, 1795.0, "Wheat, milk, soy"],
  ["Entree", "Burrito, Beef & Rice", 364.0, 15.842, 15.0, 6.0, 42.6, 3.0, 598.0, "Wheat, milk, soy"],
  ["Entree", "Burrito Chicken Handmade", 495.0, 33.978, 18.0, 8.0, 47.0, 5.0, 1036.0, "Wheat, milk"],
  ["Entree", "Burrito, Bean, Beef, Cheese and Salsa Los Cabo", 339.0, 17.0, 11.0, 4.0, 42.0, 7.0, 522.0, "Wheat, soy, milk"],
  ["Entree", "Burrito, Chicken, Cheese and Rice Michael Bs", 305.0, 21.0, 9.5, 3.0, 42.0, 6.8, 423.0, "Wheat, soy, milk"],
  ["Entree", "Burrito, South West", 298.0, 15.0, 9.5, 3.0, 41.0, 9.0, 470.0, "Wheat milk, soy"],
  ["Entree", "Burrito, Ultra Bean and Cheese", 330.0, 16.0, 11.0, 4.5, 43.0, 7.0, 440.0, "Wheat, milk, soy"],
  ["Entree", "Burrito, Wet", 465.0, 20.178, 13.0, 5.0, 66.0, 9.0, 873.0, "Wheat, milk, soy"],
  ["Entree", "Burrito Verde Carintas", 524.0, 22.096, 20.0, 9.0, 67.0, 7.0, 1245.0, "Wheat, soy, milk"],
  ["Entree", "Burrito, Xtreme Bean and Cheddar", 320.0, 17.0, 9.0, 3.5, 44.0, 8.0, 475.0, "Wheat, milk, soy"],
  ["Entree", "Calzone three cheese", 350.0, 17.0, 13.0, 6.0, 45.0, 4.0, 570.0, "Wheat, milk, soy may contain egg"],
  ["Entree", "Charcuterie Box Grab and Go", 578.0, 18.117, 27.0, 5.0, 64.0, 8.0, 864.0, "Milk, soy, wheat"],
  ["Entree", "Cheeseburger - Bacon", 456.0, 25.308, 25.0, 10.0, 30.0, 3.0, 987.0, "Wheat, milk"],
  ["Entree", "Cheeseburger - Jalapeno Cheddar", 430.0, 23.517, 22.5, 9.0, 33.0, 3.0, 860.0, "Wheat, milk"],
  ["Entree", "Cheeseburger - Western Bacon", 618.0, 28.316, 29.0, 11.0, 57.0, 4.0, 1427.0, "Wheat, milk, soy"],
  ["Entree", "Cheeseburger Don Lee Packaged", 270.0, 17.0, 9.0, 3.5, 30.0, 3.0, 410.0, "Wheat, soy, milk"],
  ["Entree", "Cheeseburger Sliders, Integrated Packaged", 272.0, 18.89, 9.0, 3.0, 30.0, 2.3, 475.0, "Wheat, milk, soy"],
  ["Entree", "Chicken Alfredo Pasta", 388.5, 25.727, 11.0, 5.0, 46.0, 6.0, 510.0, "Wheat, milk"],
  ["Entree", "Chicken Bacon Melt Sandwich", 388.0, 27.616, 17.0, 5.0, 30.0, 3.0, 771.0, "Wheat, milk, soy"],
  ["Entree", "Chicken Malibu Sandwich", 510.0, 27.566, 22.0, 5.0, 50.0, 6.0, 909.0, "Wheat, milk, soy"],
  ["Entree", "Chicken Nuggets 6 pieces Tyson", 320.0, 16.8, 18.0, 3.0, 20.0, 3.0, 488.0, "Wheat, soy"],
  ["Entree", "Chicken Nuggets and Macaroni and Cheese", 431.0, 23.963, 20.5, 6.5, 36.5, 3.5, 1060.0, "Wheat, soy, milk, egg"],
  ["Entree", "Chicken Parmesan Pasta", 640.0, 38.117, 26.0, 6.0, 70.0, 9.0, 1182.0, "Wheat, soy, milk"],
  ["Entree", "Chicken Parmesan Sandwich", 479.0, 23.239, 20.0, 4.0, 48.0, 6.0, 896.0, "Wheat, soy, milk"],
  ["Entree", "Chicken Patty on bun", 443.0, 37.0, 27.0, 3.0, 50.0, 6.5, 809.0, "Wheat, milk, soy"],
  ["Entree", "Chicken Pesto Cream Pasta", 550.0, 33.0, 26.0, 8.6, 49.0, 6.0, 1055.0, "Wheat, pine nuts, milk"],
  ["Entree", "Chicken Pesto Pasta Bake", 578.0, 36.628, 27.0, 11.5, 47.0, 6.0, 657.0, "Wheat, pine nuts, milk"],
  ["Entree", "Chicken Pesto Sandwich", 403.0, 25.003, 20.0, 5.0, 30.0, 3.0, 836.0, "Wheat, pine nuts, milk"],
  ["Entree", "Chicken Popcorn 15 pieces Tyson", 312.0, 19.383, 17.5, 3.125, 18.75, 3.75, 475.0, "Wheat, soy"],
  ["Entree", "Chicken Popcorn and Macaroni and Cheese", 467.0, 28.269, 22.0, 7.0, 38.0, 4.5, 1115.0, "Wheat, soy, milk, egg"],
  ["Entree", "Chicken Rosa Pasta with Roll", 461.0, 30.6, 16.4, 7.0, 51.4, 7.6, 1084.0, "Wheat, milk"],
  ["Entree", "Chicken Salad Croissant Sandwich", 364.0, 18.598, 18.0, 4.5, 34.0, 3.0, 409.0, "Wheat, soy, milk, egg"],
  ["Entree", "Chicken Salad Wrap", 458.0, 26.432, 20.7, 6.0, 42.6, 4.0, 775.0, "Wheat, soy, milk, egg"],
  ["Entree", "Chicken Tenders Hot & Spicy & Fries 4 pieces Tyson", 457.0, 21.0, 25.0, 4.5, 37.0, 5.0, 800.0, "Wheat, soy"],
  ["Entree", "Chicken Teriyaki (Yangs) and Rice", 370.0, 20.071, 9.0, 1.6, 51.0, 4.0, 765.0, "Soy, wheat"],
  ["Entree", "Chicken Teriyaki Dunkers 1 C rice 5 pc", 489.0, 21.38, 9.0, 1.6, 55.0, 5.6, 1052.0, "Soy, wheat"],
  ["Entree", "Chicken Teriyaki Rice Bowl Minh Sauce", 365.0, 22.991, 9.0, 2.0, 47.0, 2.0, 616.0, "Wheat, soy"],
  ["Entree", "Chicken Wings 3 each Tyson", 240.0, 22.5, 16.5, 3.75, 1.5, 0.0, 615.0, "Wheat"],
  ["Entree", "Chicken Wings 3 each with fries", 360.0, 24.5, 20.0, 4.0, 21.0, 2.0, 754.0, "Wheat"],
  ["Entree", "Chickpea Pesto Pasta Salad", 489.0, 21.434, 15.0, 3.0, 72.0, 10.5, 782.0, "Wheat, Cheese, pinenut"],
  ["Entree", "Chili three bean chili rice burrito vegetarian", 468.0, null, 4.0, 4.0, 76.0, 7.0, 1411.0, "Milk, Soy"],
  ["Entree", "Chili Fries crinkle", 430.0, 23.802, 19.0, 8.0, 36.0, 0.0, 935.0, "Milk, soy"],
  ["Entree", "Chili Fries wedges", 477.0, 25.802, 21.0, 8.5, 46.0, 4.0, 911.0, "Milk, soy"],
  ["Entree", "Chili Mac", 340.0, 20.673, 5.0, 1.6, 53.0, 8.5, 410.0, "Wheat, milk, soy"],
  ["Entree", "Chili - turkey 1 cup with cheese", 261.0, 20.903, 13.0, 7.0, 12.0, 2.7, 635.0, "Milk"],
  ["Entree", "Chili - vegetarian", 221.0, 11.059, 3.0, 0.0, 40.0, 10.0, 615.0, "Milk"],
  ["Entree", "Corn Dog, Chicken Don Lee", 240.0, 12.0, 9.0, 2.5, 28.0, 2.3, 690.0, "Wheat, soy, eggs, gluten"],
  ["Entree", "Enchilada (1 Cheese) Fajita Chicken, Rice and Beans", 679.0, 23.755, 23.0, 11.0, 78.0, 13.0, 16.0, "Milk, soy"],
  ["Entree", "Fajita Chicken Bowl", 607.0, 34.027, 17.0, 3.0, 80.0, 17.0, 1200.0, "Milk, soy, wheat"],
  ["Entree", "Fiesta Chicken Bowl Rice and Beans", 603.0, 34.766, 16.0, 6.0, 57.0, 10.0, 1243.0, "Wheat, milk, soy"],
  ["Entree", "Fiesta Vegetarian Bowl Rice and Beans", 589.0, 24.307, 19.0, 8.0, 78.0, 18.0, 1351.0, "Wheat, milk soy"],
  ["Entree", "Fish Sandwich with cheese", 370.0, 23.556, 9.0, 3.0, 46.0, 5.0, 684.0, "Fish, wheat, milk"],
  ["Entree", "Fish Sticks 4 each", 200.0, 18.0, 5.0, 0.05, 21.0, 3.0, 380.0, "Fish, wheat, milk"],
  ["Entree", "Fish Tacos", 541.0, 25.016, 13.5, 0.7, 80.0, 10.6, 543.0, "Fish, milk, wheat"],
  ["Entree", "Flatbread, chicken fajita", 418.0, 23.622, 21.0, 7.0, 34.0, 4.0, 840.0, "Wheat, milk, soy, sesame"],
  ["Entree", "Flatbread, pesto chicken", 578.0, 41.054, 30.0, 9.0, 32.0, 3.75, 770.0, "Wheat, milk, soy, sesame"],
  ["Entree", "Flatbread, bbq chicken", 602.0, 33.839, 33.0, 15.0, 40.0, 3.0, 1058.0, "Wheat, milk, soy, sesame"],
  ["Entree", "Flatbread, vegetarian", 525.0, 26.572, 31.0, 15.0, 34.0, 4.0, 887.0, "Wheat, milk, soy, sesame"],
  ["Entree", "Flauquito Chili and Cheese Michael B's", 334.0, 20.0, 15.0, 8.0, 30.0, 3.0, 573.0, "Wheat, milk, soy"],
  ["Entree", "Grilled Cheese Integrated", 316.0, 18.3, 9.68, 5.0, 31.0, 3.0, 599.0, "Wheat, milk, soy"],
  ["Entree", "Hamburger Don Lee Package", 276.0, 17.0, 10.0, 3.7, 29.0, 3.0, 260.0, "Wheat, soy"],
  ["Entree", "Hot Dog", 320.0, 15.0, 17.0, 7.0, 32.0, 3.0, 540.0, "Wheat"],
  ["Entree", "Impossible Burger on bun", 399.0, 24.313, 15.6, 8.0, 40.0, 6.0, 667.0, "Wheat, Soy"],
  ["Entree", "Italian Beef Stacker Sandwich", 471.0, 24.753, 23.0, 11.6, 42.0, 4.5, 884.0, "Wheat, milk, soy"],
  ["Entree", "Korean Beef Rice Bowl", 383.0, 22.366, 7.0, 2.0, 57.0, 3.0, 727.0, "Wheat, soy"],
  ["Entree", "Lasagna cheesy Pesto", 544.0, 28.464, 23.0, 9.0, 58.0, 4.0, 1157.0, "Wheat, egg, milk, pine nuts"],
  ["Entree", "Lasagna Roll Up with Roll", 495.0, 25.5, 14.0, 5.0, 75.0, 7.0, 1341.0, "Wheat, milk, egg"],
  ["Entree", "Macaroni and Cheese Land O Lakes 1- 1/3 Cup", 700.0, 34.033, 22.0, 12.0, 62.0, 4.0, 1960.0, "Wheat, milk, egg"],
  ["Entree", "Macaroni and cheese with dinner roll", 510.0, 22.01, 13.0, 13.0, 57.0, 7.0, 1180.0, "Wheat, milk, egg"],
  ["Entree", "Masala - Chicken Curry Vegetable Rice Bowl", 430.0, 20.235, 18.0, 1.6, 46.0, 4.7, 465.0, "Soybean oil"],
  ["Entree", "Masala - Garbanzo & Curry Vegetable Rice", 517.0, 14.492, 19.0, 0.4, 78.0, 11.0, 563.0, ""],
  ["Entree", "Meatball Sandwich", 494.0, 34.0, 22.5, 6.8, 40.0, 2.0, 875.0, "Wheat, milk, soy"],
  ["Entree", "Meatballs - Sweet & Sour Rice Bowl", 492.0, 26.98, 19.0, 4.0, 57.0, 4.0, 698.0, "Soy, wheat"],
  ["Entree", "Meatloaf recipe", 236.0, 20.028, 16.0, 6.0, 2.0, 0.0, 111.0, "Eggs, soy"],
  ["Entree", "Meatloaf Cheesy Sandwich", 350.0, 17.003, 15.5, 6.5, 38.0, 4.0, 560.0, "Wheat, milk, soy"],
  ["Entree", "Mexican Cold Pasta Salad", 574.0, 18.523, 27.0, 6.7, 73.0, 13.0, 762.0, "Wheat, egg, milk, soy"],
  ["Entree", "Orange Chicken and Rice 1 cup", 356.0, 16.222, 7.0, 1.0, 57.0, 2.0, 608.0, "Wheat, egg, soy"],
  ["Entree", "Pasta Chicken & Peppers", 335.0, 25.92, 12.0, 4.0, 37.0, 5.7, 814.0, "Wheat, milk"],
  ["Entree", "Pasta Spicy Marinara Bowl", 366.0, 16.287, 9.0, 5.0, 59.0, 6.0, 281.0, "Wheat, milk"],
  ["Entree", "Pasta spicy pink alfredo", 434.0, 22.89, 14.0, 7.5, 55.0, 6.0, 963.0, "Wheat, milk"],
  ["Entree", "Peanut butter and Jelly Sandwich 5.6 oz Uncrustable", 600.0, 18.0, 34.0, 6.0, 64.0, 7.0, 540.0, "Peanut, wheat, soy"],
  ["Entree", "Philly Cheese Steak Sandwich", 344.0, 20.679, 13.0, 4.7, 35.0, 4.0, 726.0, "Wheat, soy, milk"],
  ["Entree", "Pick Up Stix Firecracker Chicken and Rice", 390.0, 14.0, 10.0, 2.0, 60.0, 4.0, 310.0, "Wheat, egg, soy"],
  ["Entree", "Pick Up Stix Firecracker Tofu and Rice", 410.0, 13.0, 5.0, 0.0, 77.0, 4.0, 300.0, "Wheat, soy"],
  ["Entree", "Pick Up Stix House Chicken and Rice", 400.0, 14.0, 11.0, 2.0, 58.0, 3.0, 370.0, "Wheat, soy, egg, gluten"],
  ["Entree", "Pick Up Stix House Tofu and Brown Rice", 420.0, 13.0, 6.0, 1.0, 56.0, 5.0, 390.0, "Wheat, soy, gluten"],
  ["Entree", "Pick Up Stix Orange Chicken and Rice", 390.0, 14.0, 11.0, 2.5, 54.0, 3.0, 250.0, "Egg, soy, wheat"],
  ["Entree", "Pick Up Stix Teriyaki Chicken and rice", 320.0, 17.0, 4.0, 1.0, 55.0, 3.0, 350.0, "Soy, wheat"],
  ["Entree", "Pizza Bagel", 420.0, 23.8, 14.0, 7.0, 49.0, 4.3, 741.0, "Wheat, milk"],
  ["Entree", "Pizza Papa John Cheese WW", 380.0, 22.0, 11.0, 4.0, 49.0, 4.0, 780.0, "Wheat, milk"],
  ["Entree", "Pizza Papa John Pepperoni pork WW", 410.0, 22.0, 16.0, 4.0, 46.0, 4.0, 920.0, "Wheat, milk"],
  ["Entree", "Pizza Papa John Veggie WW", 380.0, 22.0, 12.0, 4.0, 48.0, 5.0, 780.0, "Wheat, milk"],
  ["Entree", "Pot Stickers with chicken and rice", 488.0, 24.416, 10.0, 1.5, 76.0, 14.0, 952.0, "Wheat, soy, sesame"],
  ["Entree", "Pretzel Dog Jumbo Beef", 300.0, 20.0, 6.5, 2.0, 41.0, 5.0, 790.0, "Wheat, Soy"],
  ["Entree", "Pork Stew over rice", 423.0, 27.401, 13.5, 4.0, 48.0, 5.0, 900.0, "Soy"],
  ["Entree", "Pork, spicy pulled pork sandwich", 408.0, 27.0, 11.6, 4.0, 48.0, 3.0, 1200.0, "Wheat"],
  ["Entree", "Quesadilla, Cheese 12\" Tortilla", 550.0, 25.15, 31.0, 18.5, 42.0, 4.0, 1018.0, "Wheat, milk, soy"],
  ["Entree", "Quesadilla, Cheese RosenShore", 330.0, 18.0, 18.0, 11.0, 25.0, 2.0, 530.0, "Wheat, milk, soy"],
  ["Entree", "Quesadilla, Cheese and Chicken", 483.0, 24.475, 24.0, 13.0, 42.0, 4.0, 1000.0, "Wheat, milk"],
  ["Entree", "Ramen Beef Bowl", 388.0, 18.708, 13.0, 4.0, 45.0, 6.0, 838.0, "Wheat, soy, egg"],
  ["Entree", "Ramen Chicken Bowl", 345.0, 23.923, 7.0, 1.5, 48.0, 5.5, 756.0, "Wheat, soy, egg"],
  ["Entree", "Raviolis, Beef Chef Boyardee 10 pies", 297.0, 18.333, 9.0, 4.0, 34.0, 4.5, 687.0, "Wheat, milk, soy"],
  ["Entree", "Raviolis, Cheese 4 with sauce", 353.0, null, 11.0, 5.0, 40.0, 3.0, 1050.0, "Wheat, Milk, Eggs"],
  ["Entree", "Salad, BBQ Chicken with Tortilla chips /Dressing", 778.0, 34.842, 45.0, 11.0, 64.0, 5.0, 1511.0, "Milk, soy, (ranch-egg)"],
  ["Entree", "Salad, BBQ without Chips or Dressing", 387.0, 30.276, 18.0, 8.0, 30.0, 5.0, 801.0, "Milk, soy"],
  ["Entree", "Tortilla Chips", 210.0, 4.0, 10.0, 0.0, 27.0, 0.0, 184.0, ""],
  ["Entree", "Dressing Ranch 2 oz", 189.0, 1.89, 21.0, 3.0, 2.0, 0.0, 510.0, "Milk, egg"],
  ["Entree", "Dressing BBQ Ranch 2 oz", 207.0, 1.6, 22.0, 3.0, 4.0, 0.0, 532.0, "Milk, egg"],
  ["Entree", "Salad, BBQ vegan w/ Tortilla chips and BBQ sauce", 425.0, 11.133, 10.5, 1.0, 79.0, 7.5, 718.0, ""],
  ["Entree", "Salad, BBQ vegan without chips", 118.0, 8.0, 0.5, 0.0, 29.0, 7.5, 148.0, ""],
  ["Entree", "Salad, Buffalo w/ ranch packet croutons", 654.78, 29.249, 42.872, 7.655, 48.8, 10.629, 1757.833, "Wheat, milk"],
  ["Entree", "Salad, Buffalo NO Ranch or Courtons", 246.0, 21.729, 12.0, 5.0, 16.0, 3.0, 912.0, "Milk"],
  ["Entree", "Salad, Caesar Chicken w/ Dressing & Croutons", 629.0, 31.935, 41.0, 6.5, 33.0, 7.0, 1220.0, "Wheat, milk, soy, egg, fish"],
  ["Entree", "Croutons .75 cup 2 grains", 255.0, 6.0, 15.0, 0.0, 30.0, 4.0, 473.0, "Wheat"],
  ["Entree", "Salad, Caesar No Chicken w/ croutons", 635.0, 27.348, 46.0, 11.0, 33.0, 7.0, 1780.0, "Wheat, milk, soy(Dressing: egg, fish)"],
  ["Entree", "Salad, Chinese chicken with Dressing", 514.0, 19.497, 28.0, 6.0, 45.0, 6.0, 1056.0, "Wheat, soy"],
  ["Entree", "Crispy Noodles 1 package 1 grain", 100.0, 4.0, 4.0, 1.0, 14.0, 2.0, 180.0, "Wheat"],
  ["Entree", "Salad, Cobb w/ croutons", 581.0, 38.544, 33.0, 8.0, 33.0, 8.0, 1395.0, "Wheat, milk, egg, soy"],
  ["Entree", "Salad, Taco with Beef and Guacamole", 655.0, 26.377, 38.0, 12.0, 55.0, 10.0, 975.0, "Milk"],
  ["Entree", "Salad, Tuna with Ranch Dressing", 595.0, 31.411, 37.625, 3.486, 44.299, 10.8, 1364.229, "Wheat, milk, soy, egg, fish"],
  ["Entree", "Sandwich BBQ Chicken", 335.0, 19.4, 7.5, 5.75, 39.0, 3.0, 677.0, "Milk, wheat"],
  ["Entree", "Sandwich, croissant chicken salad", 365.0, 18.598, 18.0, 4.5, 34.0, 3.0, 409.0, "Egg, milk, soy, wheat"],
  ["Entree", "Sandwich, Sub Ham and Cheese", 280.0, 18.0, 9.0, 4.0, 32.0, 1.6, 574.0, "Wheat, milk"],
  ["Entree", "Sandwich, Sub Tuna", 292.0, 27.669, 7.0, 1.0, 34.0, 4.0, 733.0, "Wheat, egg, fish, soy"],
  ["Entree", "Sandwich, Sub Turkey and Cheese", 325.0, 30.937, 9.0, 4.0, 31.0, 4.0, 794.0, "Wheat, milk"],
  ["Entree", "Sandwich, Sub Vegetarian", 365.0, 16.082, 17.0, 10.0, 36.0, 2.0, 1204.0, "Wheat, milk"],
  ["Entree", "Soup - spicy cheddar broccoli soup", 210.0, 10.993, 12.0, 7.0, 13.0, 1.6, 853.0, "Milk"],
  ["Entree", "Shepherd's Pie Pork", 369.0, 29.741, 18.0, 8.5, 22.5, 4.0, 1076.0, "Milk, Soy, Wheat"],
  ["Entree", "Spaghetti and Marinara", 483.6, 24.636, 16.277, 7.463, 59.935, 8.18, 525.425, "Wheat, milk"],
  ["Entree", "Spaghetti and Meat Sauce", 412.0, 25.33, 12.0, 4.5, 53.0, 7.0, 952.0, "Wheat, milk, soy"],
  ["Entree", "Spaghetti and Meatballs Chicken", 457.659, 27.589, 16.0, 4.25, 54.0, 7.0, 386.0, "Wheat, milk, soy"],
  ["Entree", "Sriracha Chicken Chunk Bowl", 474.0, 26.5, 17.0, 2.5, 57.0, 3.5, 673.0, "Wheat"],
  ["Entree", "Sriracha Orange Chicken", 410.0, 18.768, 8.0, 1.0, 66.0, 2.0, 786.0, "Soy, wheat, egg"],
  ["Entree", "Street Corn Mac & Cheese", 424.0, 19.729, 10.0, 5.5, 65.0, 9.0, 821.0, "Wheat, Milk, Soy"],
  ["Entree", "Sunbutter Box Grab and Go", 490.0, 17.999, 27.0, 5.5, 43.0, 5.0, 652.0, "Soy, wheat, milk"],
  ["Entree", "Taco Beef (2) Michael B's", 540.0, 35.0, 20.0, 7.0, 57.0, 10.0, 460.0, "Wheat, soy"],
  ["Entree", "Taco Salad with Beef and Guacamole", 655.0, 26.377, 38.0, 12.0, 55.0, 10.0, 975.0, "Milk"],
  ["Entree", "Taco Stick Beef Integrated", 327.6, 18.52, 15.0, 7.69, 28.97, 3.0, 752.0, "Wheat, milk, soy"],
  ["Entree", "Teriyaki Chicken and Chow Mein Yang", 328.0, 23.573, 5.0, 1.0, 44.0, 5.5, 926.0, "Wheat, soy, egg"],
  ["Entree", "Teriyaki Chicken and Rice (Yang recipe) Recipe", 333.0, null, 8.0, 1.5, 44.0, 2.0, 710.0, "Wheat, soy"],
  ["Entree", "Teriyaki Chicken and Rice Bowl Minh recipe", 365.0, 22.991, 9.0, 2.0, 47.0, 2.0, 617.0, "Wheat, soy"],
  ["Entree", "Tuna Melt Sandwich", 320.0, 31.706, 10.0, 2.7, 30.0, 2.0, 28.0, "Wheat, fish, milk, egg, soy"],
  ["Entree", "Turkey Gravy Mashed Potato Bowl", 281.0, 24.763, 9.0, 3.0, 25.0, 3.0, 999.0, "Wheat, soy, milk"],
  ["Entree", "Turkey Pot Pie Soup", 311.0, 18.715, 4.0, 4.0, 36.0, 3.0, 773.0, "Wheat, soy, milk"],
  ["Entree", "Uncrustables 5.3 oz WW", 600.0, 18.0, 34.0, 6.0, 64.0, 7.0, 540.0, "Wheat, soy, peanuts"],
  ["Entree", "Vegan Black bean and edamame Pasta", 471.0, 17.344, 22.0, 3.0, 60.0, 10.0, 609.0, "Wheat, soy"],
  ["Entree", "Vegan Southwestern Protein Bowl", 476.0, 14.667, 7.0, 0.7, 93.0, 11.0, 1377.0, "Wheat"],
  ["Entree", "Vegetarian Burger Dr. Praeger", 300.0, 17.0, 6.5, 0.5, 41.0, 6.0, 710.0, "Wheat, soy"],
  ["Entree", "Vegetarian Teriyaki Patty on Bun Pierre", 310.0, 15.0, 9.0, 0.5, 44.0, 6.0, 760.0, "Wheat, soy"],
  ["Entree", "Veggie Gardenburger on Bun Morning Star", 240.0, 16.0, 5.0, 0.0, 28.0, 6.0, 700.0, "Wheat, soy milk"],
  ["Entree", "Western Bacon Cheeseburger", 628.0, 28.316, 30.0, 11.0, 60.0, 4.0, 1427.0, "Wheat, milk, soy"],
  ["Entree", "Wrap BBQ Chicken Wrap with dressing", 702.0, 26.743, 42.0, 13.0, 53.0, 5.0, 1441.0, "Wheat, milk (dressing egg & milk)"],
  ["Entree", "Wrap - BLT Bacon Lettuce Turkey", 400.0, 28.28, 13.0, 4.5, 44.0, 5.0, 1235.0, "Wheat, soy"],
  ["Entree", "Wrap Buffalo Chicken Wrap", 465.0, 26.743, 20.0, 10.0, 44.0, 4.5, 1200.0, "Wheat, milk"],
  ["Entree", "Wrap - Caesar", 629.0, 31.584, 34.0, 9.229, 46.957, 4.786, 1126.0, "Wheat, milk, soy (dressing: fish egg)"],
  ["Entree", "Wrap - Caesar vegetarian", 609.0, 24.451, 36.487, 11.073, 47.31, 4.987, 1400.15, "Wheat, milk, soy (dressing: fish egg)"],
  ["Entree", "Wrap - Chicken Salad", 458.0, 26.432, 20.0, 6.0, 42.0, 4.0, 774.0, "Eggs, milk, soy, wheat"],
  ["Entree", "Wrap - Chicken Fajita", 521.0, 27.92, 26.0, 7.234, 47.755, 5.572, 1095.0, "Wheat, milk"],
  ["Entree", "Wrap - Vegan", 368.0, 14.106, 7.8, 3.0, 64.0, 13.7, 806.0, "Wheat"],
  ["Entree", "Ziti - cheese", 468.0, 24.189, 18.6, 9.068, 53.115, 6.0, 785.791, "Wheat, milk, egg"],
  ["Fruit", "Apple Sauce 4.5 oz unsweetened cup", 51.0, null, 0.0, 0.0, 14.0, 1.0, 2.0, ""],
  ["Fruit", "Apple Slices 2 oz 1/2 cup", 30.0, null, 0.0, 0.0, 8.0, 1.0, 1.0, ""],
  ["Fruit", "Apple small", 50.0, null, 0.1, 0.0, 14.0, 2.5, 1.0, ""],
  ["Fruit", "Banana Petite about 6 inches", 90.0, null, 0.3, 0.1, 23.0, 2.6, 1.0, ""],
  ["Fruit", "Canned Fruit", 64.0, null, 0.0, 0.0, 16.0, 1.0, 6.0, ""],
  ["Fruit", "Canned Pineapple 1/2 Cup", 108.0, null, 0.1, 0.0, 28.0, 1.0, 2.0, ""],
  ["Fruit", "Fresh Fruit general rule of thumb for small fruit", 60.0, null, 0.0, 0.0, 15.0, 3.0, 1.0, ""],
  ["Fruit", "Frozen Fruit Cup Peaches", 80.0, null, 0.0, 0.0, 19.0, 1.0, 0.0, ""],
  ["Fruit", "Frozen Fruit Cup Strawberry", 80.0, null, 0.0, 0.0, 19.0, 2.0, 0.0, ""],
  ["Fruit", "Juice 6.75 oz SunCup", 100.0, null, 0.0, 0.0, 25.0, 0.0, 15.0, ""],
  ["Fruit", "Lunch Bunch Grapes 2.25 oz", 45.0, null, 0.0, 0.0, 11.0, 1.0, 8.0, ""],
  ["Fruit", "Mixed Fruit 1/2 Cup", 65.0, null, 0.0, 0.0, 16.0, 1.0, 6.0, ""],
  ["Fruit", "Orange slices 160 gm", 100.0, null, 0.5, 0.0, 25.0, 7.0, 3.0, ""],
  ["Fruit", "Peaches, canned diced or sliced 1/2 cup 124g", 76.0, null, 0.2, 0.0, 19.0, 1.0, 5.0, ""],
  ["Fruit", "Pears, canned diced 1/2 cup", 60.0, null, 0.0, 0.0, 15.0, 2.0, 2.0, ""],
  ["Fruit", "Pears, small", 60.0, null, 0.1, 0.0, 17.0, 3.5, 1.0, ""],
  ["Fruit", "Pineapple Spear 2.7 oz", 40.0, null, 0.0, 0.0, 10.0, 1.0, 0.0, ""],
  ["Fruit", "Raisins 1 box 37.7 grams", 110.0, null, 0.0, 0.0, 30.0, 1.0, 4.0, ""],
  ["Fruit", "SideKicks 100% Fruit Juice 4.4 oz", 80.0, null, 0.0, 0.0, 22.0, 0.0, 45.0, ""],
  ["Fruit", "Tangerine small", 40.0, null, 0.2, 0.0, 10.0, 1.0, 1.5, ""],
  ["Fruit", "Watermelon 1/2 Cup", 23.0, null, 0.0, 0.0, 6.0, 0.0, 0.0, ""],
  ["Vegetables", "Baby Carrots 3 oz", 23.0, null, 0.0, 0.0, 5.4, 1.33, null, ""],
  ["Vegetables", "French Fries Crinkle Cut 1/2 Cup 2.1oz", 100.0, null, 3.0, 0.0, 15.0, 2.0, 210.0, ""],
  ["Vegetables", "French Fries Spirals 1/2 cup 2.12 oz", 110.0, null, 6.0, 1.0, 14.0, 1.0, 250.0, "Wheat"],
  ["Vegetables", "French Fries 1/2 cup Wedges 2.9 oz", 133.0, null, 4.4, 0.6, 22.0, 2.0, 155.0, ""],
  ["Vegetables", "French Fries Tater Tots 8 each 2.52 oz", 110.0, null, 6.0, 1.0, 14.0, 1.0, 310.0, ""],
  ["Vegetables", "French Fries Seasoned 3/8 Straight Cut 1/2 cup", 110.0, null, 5.0, 1.0, 16.0, 1.0, 270.0, "Wheat"],
  ["Vegetables", "Green Beans", 16.0, null, 0.1, 0.0, 3.5, 1.0, 3.0, ""],
  ["Vegetables", "Mashed Potatoes 1 cup", 147.0, null, 2.2, 0.2, 29.0, 2.0, 680.0, "Milk"],
  ["Vegetables", "Side Salad 1 cup", 8.0, null, 0.0, 0.0, 1.0, 0.4, null, ""],
  ["Vegetables", "Corn Cup 1/2 Cup", 67.0, null, 0.55, 0.0, 16.0, 2.0, 7.6, ""],
  ["Vegetables", "Cucumber 1/2 cup", 9.0, null, 0.0, 0.001, 2.0, 0.52, null, ""],
  ["Vegetables", "Edamame 1/2 cup", 110.0, 10.0, 4.0, 0.5, 9.0, 4.0, 5.0, "Soy"],
  ["Vegetables", "Side Salad", 8.0, null, 0.0, 0.0, 1.0, 0.4, null, ""],
  ["Vegetables", "Sugar Snap Peas 1/2 Cup", 15.0, null, 0.0, 0.0, 2.0, 1.0, null, ""],
  ["Vegetables", "Tomatoes 1/2 Cup", 13.0, null, 0.1, 0.0, 3.0, 0.9, 3.8, ""],
  ["Milk", "Non-Fat White", 90.0, 8.0, 0.0, 0.0, 12.0, 0.0, 130.0, "Milk"],
  ["Milk", "Non-Fat Chocolate", 120.0, 8.0, 0.0, 0.0, 22.0, 0.0, 100.0, "Milk"],
  ["Bread/Grains", "Cheese Stuffed Bread Stick 1 each Schwan's", 145.0, 9.5, 5.5, 3.0, 14.0, 1.0, 250.0, "Wheat, milk, soy"],
  ["Bread/Grains", "Crackers 2 grain Back to Basics", 170.0, null, 5.0, 5.0, 28.0, 3.0, 350.0, "Wheat, Soy, Milk"],
  ["Bread/Grains", "Croutons 1.8 oz .75 cup", 255.0, null, 15.0, 0.0, 30.0, 7.0, 510.0, "Wheat, Milk"],
  ["Bread/Grains", "Dinner Roll 2 oz Sky Blue packaged", 150.0, null, 2.5, 0.5, 28.0, 1.0, 135.0, "Wheat, milk, soy, Eggs"],
  ["Bread/Grains", "Dinner Roll Artisan Roll 2 oz", 160.0, 5.0, 2.0, 0.0, 34.0, 5.0, 270.0, "Wheat"],
  ["Bread/Grains", "Noodle, Crispy Asian Food Solutions", 100.0, null, 4.0, 0.0, 14.0, 2.0, 180.0, "wheat"],
  ["Bread/Grains", "Rice 1 cup", 194.0, null, 0.6, 0.0, 41.0, 1.0, 122.0, ""],
  ["Bread/Grains", "Tortilla Chips La Tapatia", 270.0, 4.0, 10.0, 2.0, 38.0, 4.0, 110.0, ""],
  ["Protein", "Cheese, String", 80.0, 6.0, 6.0, 3.5, 1.0, 0.0, 200.0, "Milk"],
  ["Protein", "Sunflower Seeds Sun Rich Naturals NonGMO (Honey Roasted)", 190.0, 6.0, 15.0, 1.5, 11.0, 5.0, 65.0, ""],
  ["Protein", "Sunflower Seeds Sun Rich Naturals NonGMO (Salted)", 170.0, 6.0, 16.0, 1.5, 5.0, 2.0, 110.0, ""],
  ["Breakfast", "Apple-Bites", 260.0, 6.0, 10.0, 4.5, 38.0, 3.0, 140.0, "Wheat, milk, egg, soy"],
  ["Breakfast", "Bagel 3 oz", 217.0, 9.3, 1.0, 1.0, 45.0, 4.0, 230.0, "Wheat"],
  ["Breakfast", "Banana Bread", 260.0, 5.0, 8.0, 1.5, 45.0, 2.0, 240.0, "Wheat, egg, soy, milk"],
  ["Breakfast", "Benefit Bar Large", 285.0, 5.0, 8.5, 3.0, 47.5, 3.0, 230.0, "Wheat, egg, soy, milk"],
  ["Breakfast", "Bosco Pizza (Beef and Pork)", 240.0, 11.0, 9.0, 4.5, 29.0, 3.0, 500.0, "Wheat, milk"],
  ["Breakfast", "Breakfast bun", 220.0, 6.0, 6.0, 2.5, 37.0, 3.0, 260.0, "Wheat, milk, soy"],
  ["Breakfast", "Breakfast Bowl egg cheese potato", 317.0, 13.775, 19.0, 8.5, 24.0, 2.0, 909.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Bowl egg cheese potato sausage, 3M .5V", 361.0, 18.737, 21.0, 7.0, 24.0, 2.0, 1063.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Bowl egg cheese potato ham", 290.0, null, 16.0, 6.0, 20.0, 2.0, 948.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Bowl egg cheese potato bacon", 305.0, 14.353, 17.6, 6.0, 24.0, 2.0, 1037.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Bowl egg cheese potato pancakes Bacon", 300.0, 13.11, 15.0, 5.0, 32.0, 3.0, 738.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Bowl Pancake Potato Chicken Sausage", 320.0, 12.0, 13.5, 2.5, 39.5, 4.0, 825.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Burrito 10\" egg and cheese", 388.0, 21.0, 18.0, 6.5, 36.0, 3.0, 1032.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Burrito 10\" egg, cheese & bacon", 370.0, 17.653, 18.45, 6.761, 33.868, 3.0, 748.379, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Burrito 10\" egg, cheese & taco turkey", 359.0, 21.748, 15.0, 4.975, 35.0, 3.0, 808.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Burrito 10\" chorizo", 473.0, 34.265, 20.8, 6.531, 37.0, 3.0, 1331.971, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Burrito 10\" Salsa Taco eggstravaganza", 356.0, 15.88, 16.0, 7.0, 37.5, 3.5, 645.0, "Wheat, milk, soy, eggs"],
  ["Breakfast", "Breakfast Fiesta Pizza", 341.0, 11.76, 18.0, 7.0, 33.0, 2.0, 942.0, "Wheat, milk egg"],
  ["Breakfast", "Chilaquiles", 393.0, 9.447, 23.0, 4.0, 39.0, 3.0, 1192.0, "Milk, eggs"],
  ["Breakfast", "Cinnamon Crumble 4 oz Buena Vista", 340.0, 6.0, 13.0, 1.5, 44.0, 2.0, 350.0, "Wheat, Egg, Soy, milk"],
  ["Breakfast", "Cinnamon Crumble 2.9 oz Buena Vista", 250.0, 4.0, 9.0, 1.0, 32.0, 2.0, 250.0, "Wheat, Egg, Soy, milk"],
  ["Breakfast", "Cinnamon Roll Daves", 224.0, 2.5, 7.5, 1.5, 36.5, 2.6, 142.0, "Wheat, Egg, Soy, milk"],
  ["Breakfast", "Cinnamon Roll Super Bakery", 240.0, 5.0, 8.0, 2.0, 38.0, 3.0, 300.0, "Wheat, milk, eggs, soy"],
  ["Breakfast", "Cinnamon Roll Central Kitchen", 380.0, 4.664, 8.0, 4.0, 71.0, 4.6, 193.0, "Wheat, Soy, milk"],
  ["Breakfast", "Cinnamon Toast Crunch Cup", 230.0, 3.0, 6.0, 1.0, 44.0, 3.0, 230.0, "Wheat, soy"],
  ["Breakfast", "Donut whole grain Low Fat powdered", 310.0, 4.0, 11.0, 5.0, 52.0, 2.0, 70.0, "Wheat, egg, milk, soy"],
  ["Breakfast", "Flatbread, breakfast supreme", 440.0, 22.625, 24.0, 8.0, 31.0, 3.0, 963.0, "Wheat, egg, milk, soy, sesame"],
  ["Breakfast", "French Toast and Bacon", 243.0, null, 9.0, 2.0, 27.0, 2.0, 500.0, "Wheat, soy, eggs, milk"],
  ["Breakfast", "Frudel", 210.0, 4.0, 6.0, 1.0, 36.0, 2.0, 250.0, "Wheat, milk, soy"],
  ["Breakfast", "Muffin Blueberry", 223.0, 3.9, 6.0, 0.9, 38.5, 3.3, 115.0, "Wheat, egg, soy, milk"],
  ["Breakfast", "Muffin Chocolate", 280.0, 5.0, 10.0, 2.0, 44.0, 0.0, 250.0, "Wheat, egg, milk, soy"],
  ["Breakfast", "Mini Cinnis", 240.0, 4.0, 7.0, 2.0, 39.0, 2.0, 270.0, "Wheat, milk"],
  ["Breakfast", "Mini Pancakes", 200.0, 4.0, 6.0, 1.0, 36.0, 2.0, 150.0, "Wheat, milk, egg"],
  ["Breakfast", "Pizza Bagel Breakfast", 192.0, 11.65, 6.0, 3.0, 23.0, 2.0, 363.0, "Wheat, milk"],
  ["Breakfast", "Pop tart, Whole Grain Brown Sugar Cinnamon", 170.0, 2.0, 3.0, 1.0, 36.0, 3.0, 190.0, "Wheat, soy"],
  ["Breakfast", "Pop tart, Whole Grain Strawberry", 170.0, 2.0, 2.5, 1.0, 36.0, 3.0, 180.0, "Wheat, soy"],
  ["Breakfast", "Uncrustables 2.6 oz", 300.0, 9.0, 16.0, 3.5, 32.0, 3.0, 280.0, "Wheat, peanuts"],
  ["Breakfast", "Whole Grain French Toast Bakecrafters", 240.0, 6.0, 7.0, 2.0, 38.0, 2.0, 260.0, "Wheat, soy, gluten, eggs, milk"],
  ["Breakfast", "Yogurt Parfait - berries", 293.0, 10.341, 6.5, 1.0, 52.0, 4.0, 180.0, "Wheat, milk, soy"],
  ["Breakfast", "Yogurt Parfait - Peach canned", 328.0, 8.065, 6.5, 1.0, 62.0, 3.5, 792.0, "Wheat, milk, soy"],
  ["Other", "Barbecue Sauce, 1 oz", 50.0, null, 0.0, 0.0, 12.0, 0.0, 240.0, ""],
  ["Other", "Cream Cheese", 70.0, 2.0, 6.0, 3.5, 1.0, 0.0, 115.0, "Milk"],
  ["Other", "Dinner Roll Artisan Roll 2 oz", 160.0, null, 2.0, 0.0, 34.0, 5.0, 270.0, "Wheat"],
  ["Other", "Goldfish Whole Grain snack crackers", 100.0, null, 4.0, 0.5, 14.0, 1.0, 170.0, "Wheat, milk"],
  ["Other", "Ketchup, 7 g", 10.0, null, 0.0, 0.0, 3.0, 0.0, 95.0, ""],
  ["Other", "Marinara Sauce, 1 oz", 15.0, null, 0.0, 0.0, 4.0, 0.0, 130.0, ""],
  ["Other", "Mayonnaise, 9 g", 60.0, null, 6.0, 1.0, 1.0, 0.0, 60.0, "Egg"],
  ["Other", "Mustard, 5.6 oz", 0.0, null, 0.0, 0.0, 0.0, 0.0, 65.0, ""],
  ["Other", "Ranch Dressing, 12 g Kraft packet", 45.0, null, 4.5, 0.5, 1.0, 0.0, 120.0, "Milk, egg"],
  ["Other", "Ranch Dressing, 2 oz cup", 189.0, null, 21.0, 3.0, 2.0, 0.0, 510.0, "Milk, egg"],
  ["Other", "Salsa Cup, 2 oz", 18.0, null, 0.0, 0.0, 5.0, 1.75, 407.0, ""],
  ["Other", "Soy Sauce, 8 mL", 0.5, null, 0.0, 0.0, 0.0, 0.0, 29.4, "Wheat, soy"],
  ["Other", "Sunflower Seeds Sun Rich Naturals NonGMO Honey Roasted (Honey Roasted)", 170.0, null, 16.0, 1.5, 5.0, 2.0, 110.0, ""],
  ["Other", "Sunflower Seeds Sun Rich Naturals NonGMO Salted (Salted)", 170.0, null, 16.0, 1.5, 5.0, 2.0, 110.0, ""],
  ["Other", "Syrup 1.5 oz portions", 120.0, null, 0.0, 0.0, 34.0, 0.0, 0.0, ""],
];

// Photos we have for a handful of dishes. Everything else gets a food icon.
const PHOTOS = [
  [/pancake/i, "pancakes"], [/french toast/i, "frenchToast"], [/muffin blueberry/i, "muffin"], [/breakfast burrito 10" egg and cheese/i, "burrito"],
  [/yogurt parfait - berries/i, "parfait"], [/banana bread/i, "bananaBread"], [/benefit bar/i, "oatBar"], [/donut/i, "donuts"],
  [/chicken tenders|chicken nuggets 6/i, "tenders"], [/spaghetti and meatballs/i, "spaghetti"], [/macaroni and cheese with dinner roll/i, "mac"],
  [/pizza papa john cheese/i, "cheesePizza"], [/pizza papa john pepperoni/i, "pepperoniPizza"], [/quesadilla, cheese and chicken/i, "quesadilla"],
  [/salad, caesar chicken/i, "caesar"], [/teriyaki chicken and rice bowl/i, "teriyaki"], [/cheeseburger - bacon/i, "burger"],
  [/wrap - caesar$/i, "wrap"], [/^taco beef/i, "tacos"], [/pick up stix orange/i, "orangeChicken"], [/fresh fruit/i, "fruitCup"],
];
const CUISINE = [
  [/alfredo|pasta|pizza|lasagna|calzone|ziti|spaghetti|raviol|flatbread|bosco|meatball|parmesan|marinara|beefaroni|pesto/i, "italian"],
  [/burrito|taco|quesadilla|enchilada|chilaquiles|fajita|fiesta|salsa|nacho|flauquito|chili|tortilla chips/i, "mexican"],
  [/pick up stix|orange chicken|firecracker|pot sticker|chow mein|sriracha|beef and broccoli|ramen|house chicken/i, "chinese"],
  [/teriyaki|edamame|korean/i, "japanese"], [/masala|curry/i, "indian"],
  [/fruit|apple|banana|orange|pear|peach|grape|raisin|tangerine|watermelon|pineapple|carrot|cucumber|tomato|salad|green beans|peas|corn cup|yogurt|vegan/i, "healthy"],
];
const guess = (name, list, dflt) => { for (const [re, v] of list) if (re.test(name)) return v; return dflt; };
function dish([section, name, cal, protein, fat, sat, carbs, fiber, sodium, alg]) {
  const a = allergens(alg);
  const photoKey = (PHOTOS.find(([re]) => re.test(name)) || [])[1];
  const plant = /vegan|veggie|vegetarian|fruit|apple|banana|grapes|raisin|pear|peach|pineapple|watermelon|tangerine|orange slices|carrot|cucumber|tomato|green beans|peas|edamame|corn cup|side salad|juice/i.test(name) && !a.contains.includes("dairy") && !a.contains.includes("eggs");
  const diet = /vegan|fruit|apple|banana|grapes|raisin|pear|peach|pineapple|watermelon|tangerine|orange slices|carrot|cucumber|tomato|green beans|peas|edamame|corn cup|side salad|juice/i.test(name) && !a.contains.includes("dairy") && !a.contains.includes("eggs") ? ["vegan", "vegetarian"]
    : /vegetarian|veggie|cheese pizza|grilled cheese|cheese quesadilla|ziti - cheese|macaroni and cheese|mac & cheese|cheese$|cheese sandwich|parfait|bagel|muffin|banana bread|pancake|french toast|cinnamon|pop tart|donut|milk|frudel|yogurt/i.test(name) && !/chicken|beef|bacon|turkey|pork|ham|sausage|tuna|fish|chorizo|pepperoni|meat/i.test(name) ? ["vegetarian"] : [];
  void plant;
  return {
    name, photo: photoKey ? DISH[photoKey].photo : "", desc: "", ingredients: NO_INGREDIENTS, cuisine: guess(name, CUISINE, "american"), diet: /spicy|buffalo|firecracker|jalapeno/i.test(name) ? [...diet, "spicy"] : diet,
    calories: cal, protein, fat, sat_fat: sat, carbs, fiber, sodium, allergens: a.contains, may: a.may, may_other: /pick up stix/i.test(name) ? "The sheet warns of cross-contact with other items and seeds." : "",
  };
}
// ---------- Irvine High School: snack and lunch menu, week of October 19, 2026 ----------
// The menu below is the cafeteria's own flyer. Where a dish on the flyer matches a row of the nutrition
// sheet, it carries that row's numbers; where it doesn't (or the flyer says "a variety of"), the numbers
// are left blank and the card says to ask nutrition services. Nothing is guessed.
const row = re => SHEET.find(r => re.test(r[1]));
const blank = name => ({ name, photo: "", desc: "", ingredients: NO_INGREDIENTS, cuisine: guess(name, CUISINE, "american"), diet: [], calories: null, protein: null, fat: null, sat_fat: null, carbs: null, fiber: null, sodium: null, allergens: [], may: [], may_other: "Allergens and nutrition aren't on the sheet for this dish. Ask nutrition services." });
// item("Name on flyer", sheet row regex or null, { photo, desc, diet })
function item(name, re, o = {}) {
  const r = re && row(re);
  const d = r ? { ...dish(r), name } : blank(name);
  if (o.photo) d.photo = DISH[o.photo].photo;
  if (o.img) d.photo = `/samples/${o.img}.jpg`;
  if (o.desc) d.desc = o.desc;
  if (o.diet) d.diet = o.diet;
  if (o.cuisine) d.cuisine = o.cuisine;
  return d;
}
const bagel = (() => {
  const b = row(/^Bagel 3 oz/), c = row(/^Cream Cheese/), d = dish(b), x = dish(c);
  return { ...d, name: "Bagel with Cream Cheese", photo: "/samples/bagel-cream-cheese.jpg", calories: b[2] + c[2], protein: b[3] + c[3], fat: b[4] + c[4], sat_fat: b[5] + c[5], carbs: b[6] + c[6], fiber: b[7] + c[7], sodium: b[8] + c[8], allergens: [...new Set([...d.allergens, ...x.allergens])], diet: ["vegetarian"] };
})();

const HOT = [
  item("Breakfast Burritos", /^Breakfast Burrito 10" egg and cheese/, { photo: "burrito", desc: "10-inch egg and cheese burrito.", diet: ["vegetarian"] }),
  item("Breakfast Bowls", /^Breakfast Bowl egg cheese potato$/, { img:"breakfast-bowl", desc: "Egg, cheese and potato bowl.", diet: ["vegetarian"] }),
  item("Breakfast Sandwiches", null, { img:"breakfast-sandwich", cuisine: "american" }),
  item("Ham & Swiss Croissants", null, { img:"ham-swiss-croissant", cuisine: "american" }),
  item("Cheesy Pull-Aparts", null, { photo: "pullAparts", diet: ["vegetarian"] }),
  item("Pizza Bosco Sticks", /^Bosco Pizza/, { photo:"pullAparts", cuisine: "italian" }),
  item("Mini Pancakes", /^Mini Pancakes/, { photo: "pancakes", diet: ["vegetarian"] }),
  item("Mini Cinnis", /^Mini Cinnis/, { img:"mini-cinnis", diet: ["vegetarian"] }),
];
const QUICK = [
  item("Yogurt Parfaits", /^Yogurt Parfait - berries/, { photo: "parfait", cuisine: "healthy", diet: ["vegetarian"] }),
  item("Chobani Yogurt Cups", null, { img:"chobani-yogurt-cup", cuisine: "healthy", diet: ["vegetarian"] }),
  bagel,
  item("Fresh Banana Bread", /^Banana Bread/, { photo: "bananaBread", diet: ["vegetarian"] }),
  item("PB&J Uncrustables", /^Uncrustables 2\.6/, { img:"pb-and-j", diet: ["vegetarian"] }),
  item("Oatmeal or Banana Benefit Bars", /^Benefit Bar/, { photo: "oatBar", diet: ["vegetarian"] }),
];
const BAKERY = [
  item("Donut Holes", null, { img:"donut-holes", diet: ["vegetarian"] }),
  item("Mini Powdered Donuts", /^Donut whole grain/, { photo: "donuts", diet: ["vegetarian"] }),
  item("Double Chocolate Muffins", /^Muffin Chocolate/, { img:"chocolate-muffin", diet: ["vegetarian"] }),
  item("Blueberry Muffins", /^Muffin Blueberry/, { photo: "muffin", diet: ["vegetarian"] }),
  item("Cereals (variety)", /^Cinnamon Toast Crunch/, { img:"cereal-bowl", desc: "Cereal cup; the nutrition shown is Cinnamon Toast Crunch.", diet: ["vegetarian"] }),
  item("Pop-Tarts (variety)", /^Pop tart, Whole Grain Brown Sugar/, { img:"pop-tarts", desc: "Nutrition shown is Brown Sugar Cinnamon.", diet: ["vegetarian"] }),
  item("Snack Packs (variety)", null, { img: "snack-crackers" }),
];

const FEATURED = [
  [item("Pesto Alfredo Cheese Ravioli Bowl", null, { img:"ravioli-bowl", cuisine: "italian", diet: ["vegetarian"] })],
  [item("Teriyaki Chicken & Rice Bowl", /^Teriyaki Chicken and Rice Bowl Minh/, { photo: "teriyaki", cuisine: "japanese" })],
  [item("Creamy Buffalo Chicken w/ Rice Bowl", null, { img:"buffalo-chicken", diet: ["spicy"] })],
  [item("Beef Vindaloo Bowl", null, { img:"beef-vindaloo", cuisine: "indian", diet: ["spicy"] }), item("Masala Aloo Matar Bowl", null, { img:"aloo-matar", cuisine: "indian", diet: ["vegetarian"] })],
  [item("Turkey Taco Spaghetti Pasta Bowl", null, { img:"taco-spaghetti", cuisine: "mexican" })],
];
const FAVORITES = [
  item("Papa John's Pizza (Cheese)", /^Pizza Papa John Cheese/, { photo: "cheesePizza", cuisine: "italian", diet: ["vegetarian"] }),
  item("Papa John's Pizza (Pepperoni)", /^Pizza Papa John Pepperoni/, { photo: "pepperoniPizza", cuisine: "italian" }),
  item("Pick Up Stix (Chicken)", /^Pick Up Stix House Chicken/, { img:"orange-chicken-rice", cuisine: "chinese" }),
  item("Pick Up Stix (Tofu)", /^Pick Up Stix House Tofu/, { img:"tofu-fried-rice", cuisine: "chinese", diet: ["vegetarian"] }),
  item("Cheesy Bosco Sticks", /^Bosco Sticks/, { photo:"pullAparts", cuisine: "italian", diet: ["vegetarian"] }),
  item("Garlic Toast", null, { img:"garlic-toast", diet: ["vegetarian"] }),
  item("Chicken Items (variety)", null, { photo: "tenders" }),
  item("Spicy / Regular Chicken Sandwiches (variety)", null, { img: "chicken-sandwich" }),
  item("Salads (variety)", null, { photo: "caesar", cuisine: "healthy" }),
  item("Wraps (variety)", null, { photo: "wrap" }),
  item("PB&J Uncrustables (Grape/Strawberry)", /^Uncrustables 5\.3/, { img:"pb-and-j", diet: ["vegetarian"] }),
];

// One week, Monday to Friday. Breakfast offers all three morning categories; snack is the quick picks and
// bakery. Lunch is that day's featured entree or entrees plus the daily favorites. Later weeks repeat it.
export const SAMPLE_PLAN = FEATURED.map(featured => ({
  breakfast: [...HOT, ...QUICK, ...BAKERY],
  snack: [...QUICK, ...BAKERY],
  lunch: [...featured, ...FAVORITES],
}));

// This file is a module for both sides: the server imports SAMPLE_PLAN for the demo schools, and the page
// reads these globals (window.SAMPLE_DISHES is for the welcome screen).
if (typeof window !== "undefined") Object.assign(window, { SAMPLE_PLAN, SAMPLE_WEEK: SAMPLE_PLAN, SAMPLE_DISHES: DISH });
