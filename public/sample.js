// Sample week an organizer can load to try LunchLine. Index 0 = Monday.
// Every sample dish has a photo in public/samples/ (credits in CREDITS.md);
// never add a dish without one.
// The packaged snacks are real products; their calories, ingredients, and
// allergens come from the labels. Everything else is a typical school-lunch
// version of the dish, so its ingredients and allergens are illustrative.
const CRUST = "Crust (enriched wheat flour, whole wheat flour, water, soybean oil, yeast, sugar, salt), tomato sauce (tomato paste, water, garlic, oregano, basil), low-moisture part-skim mozzarella cheese (milk, cultures, salt, enzymes)";
const DISH = {
  // ----- breakfast & snacks -----
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


window.SAMPLE_WEEK = [
  { breakfast: [DISH.pancakes, DISH.parfait, DISH.bananaBread], lunch: [DISH.tenders, DISH.cheesePizza, DISH.caesar] },
  { breakfast: [DISH.burrito, DISH.fruitCup, DISH.donuts], lunch: [DISH.tacos, DISH.quesadilla, DISH.pepperoniPizza] },
  { breakfast: [DISH.frenchToast, DISH.muffin, DISH.oatBar], lunch: [DISH.spaghetti, DISH.wrap, DISH.chefSalad] },
  { breakfast: [DISH.parfait, DISH.pullAparts, DISH.fruitCup], lunch: [DISH.teriyaki, DISH.orangeChicken, DISH.mac] },
  { breakfast: [DISH.pancakes, DISH.muffin, DISH.bananaBread], lunch: [DISH.burger, DISH.cheesePizza, DISH.pepperoniPizza] },
];

// For the welcome screen.
window.SAMPLE_DISHES = DISH;
