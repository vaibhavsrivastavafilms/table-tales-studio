export type MenuCatalogItem = {
  name: string;
  menuCategory: string;
  menuSubcategory: string | null;
  description: string;
  sellingPricePaise: number;
  servingSize: string;
  isSignature: boolean;
  isSpicy: boolean;
  isJainAvailable: boolean;
  isActive: boolean;
  foodCostTargetPct: number;
};

function item(
  name: string,
  menuCategory: string,
  menuSubcategory: string | null,
  description: string,
  sellingPricePaise: number,
  servingSize: string,
  isSignature: boolean,
  isSpicy: boolean,
  isJainAvailable: boolean,
  foodCostTargetPct: number
): MenuCatalogItem {
  return {
    name,
    menuCategory,
    menuSubcategory,
    description,
    sellingPricePaise,
    servingSize,
    isSignature,
    isSpicy,
    isJainAvailable,
    isActive: true,
    foodCostTargetPct,
  };
}

const coldPressed = [
  item("ABC", "Cold Pressed Juices", null, "Apple, Beetroot, Carrot & Celery.", 25500, "250 ml", false, false, true, 22),
  item("Green Goddess", "Cold Pressed Juices", null, "Cucumber, Celery, Parsley, Spinach & Apple.", 24500, "250 ml", false, false, true, 22),
  item("Immune Booster", "Cold Pressed Juices", null, "Orange, Lemon, Ginger with a hint of Pineapple.", 24500, "250 ml", false, false, true, 22),
  item("Ginger Zinger", "Cold Pressed Juices", null, "Carrot, Lemon, Ginger with a hint of Apple.", 24500, "250 ml", false, false, true, 22),
  item("Berry Blast", "Cold Pressed Juices", null, "Beetroot, Strawberry & Blueberry.", 26000, "250 ml", false, false, true, 22),
  item("Tangy Tropical", "Cold Pressed Juices", null, "Orange, Apple, Pineapple & Mint.", 25500, "250 ml", true, false, true, 22),
  item("Orange", "Cold Pressed Juices", null, "Fresh orange juice.", 20000, "250 ml", false, false, true, 22),
  item("Nimbu Pani (Sweet/Salted)", "Cold Pressed Juices", null, "Classic Indian lemonade, sweet or salted.", 11000, "250 ml", false, false, true, 22),
  item("Watermelon", "Cold Pressed Juices", null, "Fresh watermelon juice.", 15500, "250 ml", false, false, true, 22),
  item("Pineapple", "Cold Pressed Juices", null, "Fresh pineapple juice.", 18000, "250 ml", false, false, true, 22),
  item("Apple", "Cold Pressed Juices", null, "Fresh apple juice.", 22000, "250 ml", false, false, true, 22),
  item("Kiwi", "Cold Pressed Juices", null, "Fresh kiwi juice.", 24000, "250 ml", false, false, true, 22),
];

const milkshakes = [
  item("Nutella Shake", "Milkshakes", null, "Rich Nutella blended milkshake.", 26000, "250 ml", true, false, true, 28),
  item("Chocolate Shake", "Milkshakes", null, "Classic chocolate milkshake.", 24000, "250 ml", false, false, true, 28),
  item("Mix Berry Cheesecake Shake", "Milkshakes", null, "Mix berry cheesecake flavoured shake.", 29000, "250 ml", false, false, true, 28),
  item("Choco Brownie Shake", "Milkshakes", null, "Chocolate brownie blended shake.", 26000, "250 ml", false, false, true, 28),
  item("Kitkat Shake", "Milkshakes", null, "Kitkat blended milkshake.", 24500, "250 ml", true, false, true, 28),
  item("Oreo Cookie Shake", "Milkshakes", null, "Oreo cookie blended milkshake.", 24500, "250 ml", false, false, true, 28),
  item("Cold Coffee", "Milkshakes", null, "Chilled blended cold coffee.", 23000, "250 ml", false, false, true, 28),
  item("Caramel Cold Coffee", "Milkshakes", null, "Cold coffee with caramel.", 24000, "250 ml", false, false, true, 28),
  item("Mango Shake", "Milkshakes", null, "Fresh mango milkshake.", 24000, "250 ml", false, false, true, 28),
  item("Dry Fruit Shake", "Milkshakes", null, "Rich dry fruit blended milkshake.", 26000, "250 ml", false, false, true, 28),
  item("Peanut Butter & Oats Protein Shake", "Milkshakes", null, "Protein-rich peanut butter and oats shake.", 29000, "250 ml", false, false, true, 28),
  item("Fat Burner Shake", "Milkshakes", null, "Fat burner health shake.", 27000, "250 ml", false, false, true, 28),
];

const sodas = [
  item("Passion Fizz", "Sodas", null, "Passion fruit fizz soda.", 26000, "250 ml", false, false, true, 20),
  item("Watermelon Mint Mojito", "Sodas", null, "Watermelon & mint mojito.", 25000, "250 ml", false, false, true, 20),
  item("Mix Berry Mojito", "Sodas", null, "Mix berry mojito.", 27000, "250 ml", true, false, true, 20),
  item("Lime & Mint Mojito", "Sodas", null, "Classic lime and mint mojito.", 25000, "250 ml", true, false, true, 20),
  item("Kiwi Mint Mojito", "Sodas", null, "Kiwi and mint mojito.", 26000, "250 ml", false, false, true, 20),
  item("Crazy Banta Soda", "Sodas", null, "Crazy banta style soda.", 22000, "250 ml", false, false, true, 20),
  item("Fresh Lime Soda", "Sodas", null, "Fresh lime soda.", 14000, "250 ml", false, false, true, 20),
  item("Masala Cola", "Sodas", null, "Masala spiced cola.", 19000, "250 ml", false, false, true, 20),
];

const icedTeas = [
  item("Peach Ice Tea", "Iced Teas", null, "Chilled peach flavoured ice tea.", 17000, "250 ml", true, false, true, 20),
  item("Lemon Ice Tea", "Iced Teas", null, "Classic lemon ice tea.", 16000, "250 ml", false, false, true, 20),
  item("Passion Fruit Ice Tea", "Iced Teas", null, "Passion fruit flavoured ice tea.", 17000, "250 ml", false, false, true, 20),
  item("Mango Ice Tea", "Iced Teas", null, "Mango flavoured ice tea.", 17000, "250 ml", false, false, true, 20),
];

const fantasyFizz = [
  item("Passion Bull", "Fantasy Fizz", null, "Passion fruit fizz.", 29000, "200 ml", true, false, true, 22),
  item("Guava Orange Togarashi", "Fantasy Fizz", null, "Guava, orange with togarashi spice.", 28000, "200 ml", false, false, true, 22),
  item("Berry Tonic", "Fantasy Fizz", null, "Berry tonic drink.", 26000, "200 ml", false, false, true, 22),
  item("Kiwi Kiss Slush", "Fantasy Fizz", null, "Kiwi slush drink.", 26000, "200 ml", false, false, true, 22),
  item("Tropical Sunset", "Fantasy Fizz", null, "Tropical sunset fizz.", 29000, "200 ml", true, false, true, 22),
  item("Strawberry Orange Daiquiri", "Fantasy Fizz", null, "Strawberry orange daiquiri mocktail.", 28000, "200 ml", false, false, true, 22),
  item("Pina Berry Chill", "Fantasy Fizz", null, "Pineapple berry chill drink.", 28000, "200 ml", false, false, true, 22),
  item("Apple Cinnamon Fizz", "Fantasy Fizz", null, "Apple cinnamon fizz.", 29000, "200 ml", true, false, true, 22),
  item("Pineapple Ale", "Fantasy Fizz", null, "Pineapple ale mocktail.", 26000, "200 ml", false, false, true, 22),
  item("Elder Mile", "Fantasy Fizz", null, "Elderflower mile drink.", 26000, "200 ml", false, false, true, 22),
  item("Kiwi Sour", "Fantasy Fizz", null, "Kiwi sour mocktail.", 28000, "200 ml", false, false, true, 22),
  item("Ginger Melon Tonic", "Fantasy Fizz", null, "Ginger melon tonic.", 28000, "200 ml", false, false, true, 22),
];

const soups = [
  item("Tomato Soup", "Soups", null, "Classic comfort soup with freshest tomatoes & cream, served with croutons.", 22500, "210 gms", false, false, true, 25),
  item("Tom Yum", "Soups", null, "Thai aromatic spices with carrot, zucchini & bokchoy.", 24500, "210 gms", false, true, true, 25),
  item("Cheesy Veg", "Soups", null, "Creamy cheesy soup with zucchini, mushrooms, carrots, green beans & broccoli.", 24500, "210 gms", true, false, true, 25),
  item("Hot & Sour", "Soups", null, "Indo-Chinese tangy & spicy soup with fresh cut veggies.", 23000, "210 gms", false, true, false, 25),
  item("Minestrone", "Soups", null, "Hearty Italian vegetable soup with tomato base, beans & pasta.", 23000, "210 gms", false, false, true, 25),
  item("Burmese Khao Suey", "Soups", null, "Creamy coconut soup with curry spices, boiled noodles, zucchini, broccoli, carrots, mushrooms & water chestnuts.", 32000, "210 gms", true, false, true, 25),
  item("Cream of Mushroom", "Soups", null, "Creamy classic soup with freshly sautéed mushrooms.", 24500, "210 gms", false, false, true, 25),
  item("Miso", "Soups", null, "Japanese miso umami soup with tofu, carrots & scallions.", 25000, "210 gms", false, false, false, 25),
  item("Mexican Bean", "Soups", null, "Tomato based soup with corn, capsicum, jalapenos, kidney beans & tortilla chips.", 24500, "210 gms", true, true, true, 25),
  item("Clear Green", "Soups", null, "Chinese green fragrant broth with cabbage, carrots, spring onions, green beans & celery.", 23000, "210 gms", false, false, true, 25),
  item("Chinese Noodle", "Soups", null, "Classic chinese soup with sliced veggies & boiled noodles, drizzled with crispy noodles.", 24500, "210 gms", true, false, true, 25),
  item("Sweet Corn", "Soups", null, "Sweet corn & diced veggies in a Chinese twist.", 22500, "210 gms", false, false, true, 25),
  item("Spinach Corn", "Soups", null, "Fresh spinach, corn & a hint of green chilli.", 23000, "210 gms", false, false, true, 25),
];

const salads = [
  item("Fruit Bowl", "Salads", null, "A bowl of freshly cut seasonal fruits.", 32000, "300 gms", false, false, true, 28),
  item("Caesar Salad", "Salads", null, "Creamy romaine base with lettuce & olives topped with crunchy croutons & parmesan cheese.", 33000, "300 gms", false, false, true, 28),
  item("Greek Salad", "Salads", null, "Bell peppers, olives, crumbled paneer dressed in greek dressing.", 33000, "300 gms", false, false, true, 28),
];

const appetizersIndian = [
  item("Dahi ke Kebab", "Appetizers", "Indian", "Creamy cutlet patties with hung curd, crumbled paneer & aromatic spices. (8 pcs)", 39000, "300 gms", true, false, true, 30),
  item("Hara Bhara Kebab", "Appetizers", "Indian", "Savoury pan-fried patties loaded with green vegetables & cottage cheese. (8 pcs)", 35000, "300 gms", false, false, true, 30),
  item("Bhutte Ke Kebab", "Appetizers", "Indian", "Crispy golden potato corn tikki filled with Indian masalas & cheese. (8 pcs)", 37000, "300 gms", false, false, true, 30),
  item("Paneer Tikka", "Appetizers", "Indian", "Classic tandoori paneer cubes marinated in signature spice mix, grilled with onions, capsicum & tomatoes. (8 pcs)", 41000, "300 gms", false, true, true, 30),
  item("Hariyali Paneer Tikka", "Appetizers", "Indian", "Tandoori paneer with hariyali spice marinade, grilled with onions, capsicum & tomatoes. (8 pcs)", 41000, "300 gms", false, true, true, 30),
  item("Corn Tikki Chaat", "Appetizers", "Indian", "Crispy corn potato tikkis on sweet curd with chutneys, papdi sticks & pico de gallo.", 38000, "300 gms", false, false, true, 30),
  item("Assorted Tandoor Platter", "Appetizers", "Indian", "Tandoori paneer, hariyali paneer, hariyali broccoli, tandoori momos & hara bhara kebab. (10 pcs)", 52000, "300 gms", false, false, true, 30),
  item("Tandoori Potato Cannelloni", "Appetizers", "Indian", "Grilled potatoes stuffed with paneer & cheese, with marinated grilled bell peppers, tomatoes & onions. (8 pcs)", 41000, "300 gms", true, false, true, 30),
  item("Tandoori Momos", "Appetizers", "Indian", "Steamed veg cheese momos marinated in tandoori spice mix, baked in tandoor & finished with cream & spices. (8 pcs)", 41000, "300 gms", false, true, true, 30),
  item("Paneer Kathi Roll", "Appetizers", "Indian", "Sauteed paneer wrapped in a tortilla with mint chutney, mayo, salad & cheese.", 31000, "300 gms", true, false, true, 30),
  item("Tandoori Paneer Wrap", "Appetizers", "Indian", "Marinated tandoori paneer, flavored mayo, cheese & salad wrapped in a tortilla.", 32000, "300 gms", false, true, true, 30),
];

const appetizersGlobal = [
  item("Cheese Fondue", "Appetizers", "Global", "Cheese fondue with peri peri fries, sautéed broccoli, baby corn, carrots, nachos, veg cheese balls & garlic croutons.", 54000, "300 gms", false, false, true, 32),
  item("Golden Tuscan Swirls", "Appetizers", "Global", "Crispy cheese spinach rolls on tomato basil sauce, topped with cheese & baked till golden, with lettuce salad & roasted walnuts.", 42000, "300 gms", true, false, true, 32),
  item("Avocado Toast", "Appetizers", "Global", "Crispy toast with mashed avocado, pico de gallo, roasted tomato slices & micro greens. (4 pcs)", 39000, "300 gms", false, false, true, 32),
  item("Bruschetta", "Appetizers", "Global", "French loaf baked with cheese, fresh basil, olives, corn & tomatoes. (6 pcs)", 37000, "300 gms", false, false, true, 32),
  item("Loaded French Fries", "Appetizers", "Global", "Peri Peri fries topped with masala cheese sauce, pico de gallo, tomato sauce, jalapenos, black olives & creamy sauce.", 29500, "300 gms", false, false, true, 32),
  item("Fajita Taco in Chili Sauce", "Appetizers", "Global", "Soft taco with sautéed fajita vegetables, bean & corn masala, mexican chili sauce, sour cream & fire-roasted salsa. (4 pcs)", 39000, "300 gms", true, true, true, 32),
  item("Cheese Pop Taco", "Appetizers", "Global", "Tortilla with kidney beans, cheese popper, masala cheese sauce, lettuce & fire roasted salsa. (4 pcs)", 43000, "300 gms", false, false, true, 32),
  item("Mexican Grill Quesadillas", "Appetizers", "Global", "Tortilla stuffed with bell peppers, onions, jalapenos & special masala beans topped with cheese.", 41000, "300 gms", true, true, true, 32),
  item("Crispy Falafel Crostini", "Appetizers", "Global", "Crispy bread toast with hummus, olives, lettuce & falafel pieces with Lebanese sauce. (6 pcs)", 36000, "300 gms", false, false, true, 32),
  item("Lebanese Loaded French Fries", "Appetizers", "Global", "Fries with Lebanese masala, queso, muhammara & hummus, topped with harissa mayo, pico de gallo & pickled veggies.", 33000, "300 gms", false, false, true, 32),
  item("Loaded Nachos", "Appetizers", "Global", "Nachos with masala cheese sauce, bell peppers, onions, jalapenos, fire roasted salsa, bean masala & sour cream.", 33000, "300 gms", false, false, true, 32),
  item("Mexican Bean Wrap", "Appetizers", "Global", "Mexican veggies with kidney beans, creamy mexican sauce & cheese in a tortilla.", 31000, "300 gms", false, false, true, 32),
  item("Lebanese Platter", "Appetizers", "Global", "Falafel, pita bread, lavash, carrot & cucumber with hummus, harissa, muhammara, pesto hummus & beetroot hummus.", 33000, "300 gms", false, false, true, 32),
];

const appetizersAsian = [
  item("Sriracha Paneer Crisp", "Appetizers", "Asian", "Sriracha glazed paneer with onions & bell peppers, topped with crispy spinach.", 42000, "300 gms", false, true, true, 32),
  item("Korean Cream Cheese Pull Apart Bun", "Appetizers", "Asian", "Cream cheese & mozzarella pull apart buns with Korean sauce & fried garlic.", 32000, "300 gms", false, false, true, 32),
  item("Chili Corn & Water Chestnut Tempura", "Appetizers", "Asian", "Stir fried tempura corn & water chestnut in spicy sauces.", 35000, "300 gms", false, true, true, 32),
  item("Paneer Chilly", "Appetizers", "Asian", "Indo-Chinese crisp paneer cubes with onions & capsicum in hot & tangy semi-dry sauce.", 43000, "300 gms", false, true, true, 32),
];

const sushi = [
  item("Avocado Cream Cheese Cucumber Sushi", "Sushi", null, "Avocado, cream cheese, spring onion, cucumber. Served with pickled ginger, soya sauce & wasabi. (8 pcs)", 42000, "8 pcs", false, false, true, 35),
  item("Jalapeno Tempura Sour Cream Sushi", "Sushi", null, "Jalapeno tempura, salsa, carrot, spring onion. (8 pcs)", 45000, "8 pcs", false, true, true, 35),
  item("Togarashi Katsu Tofu Sushi", "Sushi", null, "Spicy creamy sauce, bread crumbed tofu, chili sauce, togarashi. (8 pcs)", 47000, "8 pcs", false, true, true, 35),
  item("Tandoori Paneer Avocado Sushi", "Sushi", null, "Tandoori paneer, avocado, spicy creamy sauce, cucumber. (8 pcs)", 45000, "8 pcs", false, false, true, 35),
];

const dimSum = [
  item("Forest Dumpling with Chili Garlic Sauce", "Dim Sum", null, "Green dumpling with scallion, spinach, cabbage, basil on chili garlic sauce. (5 pcs)", 42000, "5 pcs", false, true, true, 32),
  item("Spicy Tofu with Water Chestnut Dumpling", "Dim Sum", null, "Dumpling with tofu, water chestnut & chili paste. (5 pcs)", 38000, "5 pcs", false, true, true, 32),
  item("Crystal Veggie & Cheese Dumpling", "Dim Sum", null, "Veg dumpling with cheese, carrot, cabbage, mushroom & spinach. (5 pcs)", 38000, "5 pcs", false, false, true, 32),
];

const smallPlates = [
  item("Garlic Bread", "Small Plates", null, "Sliced French loaf buttered with garlic & herbs. (4 pcs)", 16000, "4 pcs", false, false, true, 28),
  item("Garlic Bread with Cheese", "Small Plates", null, "Sliced French loaf topped & baked with cheese, garlic & herbs. (4 pcs)", 22000, "4 pcs", false, false, true, 28),
  item("Cheese Chilli Garlic Bread", "Small Plates", null, "French loaf topped & baked with chilli, cheese, garlic & herbs. (4 pcs)", 23000, "4 pcs", false, true, true, 28),
  item("French Fries", "Small Plates", null, "Classic salted potato fries.", 17000, "250 gms", false, false, true, 28),
  item("Peri Peri French Fries", "Small Plates", null, "Crispy golden fries tossed in a fiery blend of Peri Peri spices.", 19000, "250 gms", false, true, true, 28),
  item("French Fries with Cheese", "Small Plates", null, "Classic fries topped with cheesy sauce.", 23000, "250 gms", false, false, true, 28),
  item("Cheese Nachos", "Small Plates", null, "Nachos topped with cheese sauce.", 27000, "250 gms", false, false, true, 28),
];

const sandwiches = [
  item("Pesto Veggie Sandwich", "Sandwiches", null, "Fresh veggies — onions, tomatoes, capsicum, olives & zucchini sauteed in pesto, layered with cheese.", 32000, "250 gms", true, false, true, 30),
  item("Nacho Nacho Sandwich", "Sandwiches", null, "Jalapenos, onions, corn, tomatoes & capsicum with nachos, beans, cheese & mexican sauce toasted between breads.", 31000, "250 gms", true, false, true, 30),
  item("Hariyali Tikka Paneer Grill Sandwich", "Sandwiches", null, "Marinated & grilled tandoori paneer in hariyali spice mix, flavoured mayo & mint chutney with onions & tomatoes.", 32000, "250 gms", false, true, true, 30),
  item("Italian Sandwich", "Sandwiches", null, "Olives, onions, tomatoes & capsicum in cocktail sauce topped with cheese & basil.", 31000, "250 gms", false, false, true, 30),
  item("Cheese Chutney Pesto Sandwich", "Sandwiches", null, "Signature sandwich with pesto & green chutney topped with cheese.", 31000, "250 gms", false, false, true, 30),
  item("Bombay Masala Sandwich", "Sandwiches", null, "Street style sandwich with spicy mashed potatoes, onions, tomatoes & capsicum with cheese & chutney.", 30000, "250 gms", true, true, true, 30),
  item("Classic Club Sandwich", "Sandwiches", null, "Classic 3-tier grilled sandwich with fresh tomatoes, cucumber, onions & cheese.", 30000, "250 gms", false, false, true, 30),
];

const pizzas = [
  item("Margherita Pizza", "Pizzas", null, "Traditional pizza with cherry tomatoes, fresh mozzarella & basil.", 38000, "10 inches", false, false, true, 30),
  item("Tangy & Spicy Pizza", "Pizzas", null, "Tomatoes, onions, bell peppers, jalapenos, pickled peppers & green chillies.", 45000, "10 inches", false, true, true, 30),
  item("Basil Pesto Pizza", "Pizzas", null, "Pesto base with tomatoes, onions, olives, jalapenos & capsicum.", 47000, "10 inches", false, false, true, 30),
  item("Tandoori Paneer Pizza", "Pizzas", null, "Tandoori marinated paneer cubes, onions, tomatoes, coriander, spinach & corn.", 46000, "10 inches", true, false, true, 30),
  item("Hariyali Paneer Pizza", "Pizzas", null, "Hariyali marinated paneer, capsicum, coriander, onions & green chillies.", 46000, "10 inches", false, false, true, 30),
  item("Veggie Blast Pizza", "Pizzas", null, "Onions, tomatoes, capsicum, baby corn, jalapenos, mushrooms, olives, pickled red chillies & basil.", 46000, "10 inches", true, false, true, 30),
  item("Classic Hawaiian Pizza", "Pizzas", null, "Hawaiian classic with pineapple, jalapenos, onions & red chillies.", 44000, "10 inches", false, false, true, 30),
  item("Classic Italian Pizza", "Pizzas", null, "Italian classic with capsicum, olives, jalapenos, basil & baby corn.", 45000, "10 inches", false, false, true, 30),
];

const mainsMexican = [
  item("Enchilada in Mexican Chili Sauce", "Mains", "Mexican", "Tortilla with beans, fajita vegetables, corn, paneer & Mexican masalas in authentic chili sauce, topped with queso, served with Mexican rice, pico de gallo, sour cream & lettuce.", 53000, "400 gms", true, true, true, 32),
  item("Burrito Bowl", "Mains", "Mexican", "Rice, pinto beans, corn, pico de gallo, salsa, sour cream, fajita vegetables, cheese, lettuce & paneer in Mexican chili sauce, topped with nachos.", 44000, "400 gms", false, false, true, 32),
  item("Mexican Rice Pot", "Mains", "Mexican", "Rice with sweet corn, bell peppers & kidney beans in tomato gravy with broccoli, zucchini, carrot & baby corn, topped with nachos & cheese.", 55000, "400 gms", false, false, true, 32),
  item("Lebanese Rice Bowl", "Mains", "Lebanese", "Shawarma spiced rice with paneer, crispy sticks, falafel, corn, red paprika, cucumber, tomatoes, lettuce & pickled veggies, topped with hummus, pesto hummus, harissa & toum.", 52000, "400 gms", true, false, true, 32),
];

const mainsPasta = [
  item("Pasta Arrabiata", "Mains", "Pasta", "Penne in classic spicy Italian tomato sauce with capsicum, olives, zucchini & red paprika. Served with two garlic breads.", 39000, "400 gms", false, true, true, 32),
  item("Penne Roseo", "Mains", "Pasta", "Penne in tomato & cheese sauce with broccoli, zucchini, mushrooms & capsicum, finished with basil & parsley. Served with two garlic breads.", 42000, "400 gms", false, false, true, 32),
  item("Penne Pesto", "Mains", "Pasta", "Penne in fresh basil pesto sauce with bell peppers, olives, zucchini & mushrooms. Served with two garlic breads.", 44000, "400 gms", false, false, true, 32),
  item("Spaghetti Alfredo", "Mains", "Pasta", "Spaghetti in creamy cheese sauce with capsicum, zucchini, mushrooms, cherry tomatoes & olives. Served with two garlic breads.", 39000, "400 gms", false, false, true, 32),
];

const mainsAsianNoodles = [
  item("Bangkok Hawker Style Noodles", "Mains", "Asian Noodles", "Thai coconut spicy fragrant noodles with chinese cabbage, carrot, mushroom & trio of bell peppers.", 45000, "400 gms", false, true, true, 32),
  item("Pad Thai Noodles", "Mains", "Asian Noodles", "Flat rice noodles with asian sauces, Bok Choi, chinese cabbage, zucchini, trio of bell peppers, carrots, garnished with crushed peanuts.", 42000, "400 gms", false, false, true, 32),
  item("Chili Soba Noodles", "Mains", "Asian Noodles", "Japanese soba noodles with zucchini, broccoli & red yellow capsicum in chili garlic flavour.", 43000, "400 gms", false, true, true, 32),
  item("Ramen Noodles Bowl", "Mains", "Asian Noodles", "Japanese miso ramen with fragrant broth, noodles, tofu, bok choi, mushrooms & sweet corn, garnished with spring onions.", 45000, "400 gms", false, false, false, 32),
  item("Kimchi Noodles Stir Fry", "Mains", "Asian Noodles", "Korean stir fry with kimchi sauce, noodles, sesame, chinese cabbage, bok choi, carrots & capsicum.", 42000, "400 gms", false, true, true, 32),
];

const mainsAsianCurry = [
  item("Red Thai Curry with Jasmine Rice", "Mains", "Asian Curry", "Coconut Thai red curry with bell peppers, mushroom, zucchini, carrot, bok choi & water chestnut, served with jasmine rice.", 49000, "400 gms", false, true, true, 32),
  item("Tofu Rendang Curry with Jasmine Rice", "Mains", "Asian Curry", "Spicy tofu & broccoli curry in Malaysian Korean fusion style, served with jasmine rice.", 49000, "400 gms", false, true, false, 32),
  item("Steamed Jasmine Rice", "Mains", "Asian Curry", "Perfectly steamed aromatic jasmine rice.", 25000, "400 gms", false, false, true, 32),
  item("Burnt Garlic Corn Fried Rice with Baby Corn Curry", "Mains", "Asian Curry", "Crisp burnt garlic & baby corn fried rice with Chinese curry, sautéed baby corn & bell peppers.", 45000, "400 gms", false, false, true, 32),
  item("Asian Veggies in Satay Curry with Jasmine Rice", "Mains", "Asian Curry", "Stir fried trio capsicum & zucchini in sweet & spicy Thai peanut sauce, served with jasmine rice.", 49000, "400 gms", false, false, true, 32),
];

const platters = [
  item("Ghughra Naan Platter", "Platters", null, "Naan stuffed with cheese, capsicum & onions, inspired by Amdavadi gughra sandwich, served with dal makhni, mint chutney, onions & pickle.", 55000, "250 gms", true, false, true, 30),
  item("Cheese Naan Platter", "Platters", null, "Cheese stuffed naan served with dal makhni, mint chutney, pickle & onions.", 52000, "250 gms", false, false, true, 30),
  item("Cheese Chilli Garlic Naan Platter", "Platters", null, "Cheese & chili stuffed naan with minced garlic, served with dal makhni, mint chutney, pickle & onions.", 52000, "250 gms", false, true, true, 30),
  item("Paneer Paratha", "Platters", null, "Indian flatbread stuffed with spiced cottage cheese. Served with raita & pickle.", 25000, "250 gms", false, false, true, 30),
  item("Mixed Vegetable Paratha", "Platters", null, "Whole wheat flatbread with carrots, green beans, cauliflower, potato, peas & paneer. Served with raita & pickle.", 24000, "250 gms", true, false, true, 30),
  item("Aloo Onion Paratha", "Platters", null, "Whole wheat flatbread stuffed with onions & mashed potatoes with Indian spices. Served with raita & pickle.", 23000, "250 gms", false, false, true, 30),
  item("Cheese Chilli Paratha", "Platters", null, "Melted cheese and spicy chilies in a crispy golden flatbread. Served with raita & pickle.", 23000, "250 gms", false, true, true, 30),
];

const punjabiPaneer = [
  item("Makkhanwala Paneer", "Punjabi Mains", "Paneer", "Paneer cubes cooked in creamy signature makhni gravy.", 49000, "460 gms", true, false, true, 32),
  item("Kadhai Paneer", "Punjabi Mains", "Paneer", "Paneer & veggies in rich red and brown gravy with homemade Kadhai masala.", 48000, "460 gms", false, false, true, 32),
  item("Desi Paneer Gotalo with Patti Pav", "Punjabi Mains", "Paneer", "Table Tales speciality — desi tawa crumbled paneer with tangy & spicy gravy, served with 4 pieces of Patti Pav.", 52000, "460 gms", true, true, true, 32),
  item("Paneer Tikka Masala", "Punjabi Mains", "Paneer", "Tandoori paneer in rich red & brown gravy with special tandoori spice mix.", 49000, "460 gms", false, true, true, 32),
  item("Paneer Chatpata", "Punjabi Mains", "Paneer", "Unique paneer & veggie preparation resembling chaat flavors in tomato gravy with salad on top.", 45000, "460 gms", true, false, true, 32),
  item("Lasooni Paneer", "Punjabi Mains", "Paneer", "Paneer cubes tossed with minced garlic in rich brown gravy.", 47000, "460 gms", false, false, true, 32),
  item("Paneer Do Pyaza", "Punjabi Mains", "Paneer", "Paneer cubes & two types of onions simmered in rich onion gravy with special masalas.", 47000, "460 gms", false, false, true, 32),
  item("Pahadi Paneer Tikka Masala", "Punjabi Mains", "Paneer", "Tandoori paneer marinated in hariyali spice mix served with spiced spinach gravy.", 49000, "460 gms", false, false, true, 32),
];

const punjabiVegetable = [
  item("Veg Shahi Korma", "Punjabi Mains", "Vegetable", "Carrots, green beans, peas & cauliflower in rich brown gravy, handi style.", 47000, "460 gms", false, false, true, 30),
  item("Hariyali Broccoli", "Punjabi Mains", "Vegetable", "Marinated & tandoori broccoli on creamy tomato & spice-infused brown gravy.", 41000, "460 gms", false, false, true, 30),
  item("Desi Videsi", "Punjabi Mains", "Vegetable", "Local veggies — peas, carrots, green beans, bell peppers — with zucchini, mushroom, corn & broccoli in a fragrant gravy.", 48000, "460 gms", false, false, true, 30),
  item("Veg Hyderabadi", "Punjabi Mains", "Vegetable", "Green beans, carrots, cauliflower, american corn, peas, capsicum & onions in special spiced green gravy.", 46000, "460 gms", false, false, true, 30),
  item("Subz Tirangi", "Punjabi Mains", "Vegetable", "Vegetables in three distinct gravies: red, green & white cashew gravy.", 57000, "460 gms", false, false, true, 30),
  item("Methi Matar Malai", "Punjabi Mains", "Vegetable", "Creamy white gravy with peas & methi.", 45000, "460 gms", false, false, true, 30),
  item("Soya Kheema with Patti Pav", "Punjabi Mains", "Kofta", "Soft soya granules in fragrant gravy with masalas, served with four patti pav.", 49500, "460 gms", false, false, true, 30),
  item("Paneer Tirangi", "Punjabi Mains", "Paneer", "Paneer in three distinct gravies: red, green & white cashew gravy.", 59000, "460 gms", false, false, true, 32),
];

const indianRice = [
  item("Veg Dum Biryani", "Indian Rice", null, "Traditional slow-cooked biryani with rice, paneer, vegetables, aromatic spices & makhmali gravy.", 46000, "450 gms", false, false, true, 28),
  item("The OG Hyderabadi Biryani", "Indian Rice", null, "Authentic biryani layered with rice, potatoes, carrots & cauliflower, baked with housemade biryani masala, phudina & crispy onions.", 46000, "450 gms", true, false, true, 28),
  item("Madras Rice", "Indian Rice", null, "Aromatic rice with mushrooms, bell peppers, zucchini & carrots, with curry leaves tadka & a hint of coconut.", 46000, "450 gms", false, false, true, 28),
  item("Masala Khichdi", "Indian Rice", null, "Aromatic rice & lentils slow cooked with carrots, peas & tomatoes finished with mild spices & ghee.", 41000, "450 gms", false, false, true, 28),
  item("Palak Khichdi", "Indian Rice", null, "Spinach khichdi cooked with veggies, finished with mild spices, garlic & ghee.", 43000, "450 gms", false, false, true, 28),
  item("Veg Pulao", "Indian Rice", null, "Mixed vegetables cooked with fragrant basmati rice & special spices.", 35000, "450 gms", false, false, true, 28),
  item("Jeera Rice", "Indian Rice", null, "Aromatic basmati rice with ghee & cumin seeds, coriander drizzled on top.", 27000, "450 gms", false, false, true, 28),
  item("Steamed Rice", "Indian Rice", null, "Basmati rice boiled to perfection.", 23000, "450 gms", false, false, true, 28),
];

const breads = [
  item("Plain Roti", "Breads", null, "Classic plain roti.", 6000, "50 gms", false, false, true, 20),
  item("Butter Roti", "Breads", null, "Classic roti with butter.", 7500, "50 gms", false, false, true, 20),
  item("Garlic Coriander Roti", "Breads", null, "Roti with garlic and coriander.", 13000, "50 gms", false, false, true, 20),
  item("Plain Naan", "Breads", null, "Classic plain naan.", 9500, "50 gms", false, false, true, 20),
  item("Butter Naan", "Breads", null, "Classic naan with butter.", 11500, "50 gms", false, false, true, 20),
  item("Garlic Naan", "Breads", null, "Naan with garlic.", 12000, "50 gms", false, false, true, 20),
  item("Hariyali Garlic Naan", "Breads", null, "Hariyali spiced garlic naan.", 16000, "50 gms", true, false, true, 20),
  item("Chatpata Naan", "Breads", null, "Chatpata spiced naan.", 13000, "50 gms", true, false, true, 20),
  item("Pesto Olive Cheese Naan", "Breads", null, "Naan with pesto, olive & cheese.", 19500, "50 gms", false, false, true, 20),
  item("Jalapeno Cream Cheese Naan", "Breads", null, "Naan with jalapeno & cream cheese.", 21000, "50 gms", true, true, true, 20),
  item("Mint Makhni Cheese Naan", "Breads", null, "Naan with mint, makhni butter & cheese.", 21000, "50 gms", false, false, true, 20),
  item("Cheese Naan", "Breads", null, "Cheese stuffed naan.", 19000, "50 gms", false, false, true, 20),
  item("Cheese Garlic Naan", "Breads", null, "Cheese & garlic naan.", 19500, "50 gms", false, false, true, 20),
  item("Mughlai Roti", "Breads", null, "Classic mughlai style roti.", 19000, "50 gms", false, false, true, 20),
  item("Lachha Paratha", "Breads", null, "Layered crispy paratha.", 14000, "50 gms", false, false, true, 20),
  item("Kulcha", "Breads", null, "Classic kulcha bread.", 14000, "50 gms", false, false, true, 20),
  item("Patti Pav (4 pcs)", "Breads", null, "Four pieces of patti pav.", 7000, "4 pcs", false, false, true, 20),
];

const sides = [
  item("Chaas", "Sides", null, "Classic Indian buttermilk.", 10000, "250 ml", false, false, true, 18),
  item("Masala Chaas", "Sides", null, "Spiced Indian buttermilk.", 11000, "250 ml", false, false, true, 18),
  item("Masala Papad", "Sides", null, "Masala topped papad.", 9000, "1 pc", false, false, true, 18),
  item("Roasted Papad", "Sides", null, "Roasted papad.", 4500, "1 pc", false, false, true, 18),
  item("Fried Papad", "Sides", null, "Fried papad.", 5000, "1 pc", false, false, true, 18),
  item("Raita", "Sides", null, "Tomato Onion / Cucumber / Pineapple Raita.", 12000, "120 gms", false, false, true, 18),
  item("Plain Curd", "Sides", null, "Plain fresh curd.", 7000, "120 gms", false, false, true, 18),
  item("Sweet Lassi", "Sides", null, "Classic sweet lassi.", 20000, "250 ml", false, false, true, 18),
  item("Sour Cream", "Sides", null, "Housemade sour cream.", 8000, "50 gms", false, false, true, 18),
  item("Green Salad", "Sides", null, "Fresh green salad.", 14000, "100 gms", false, false, true, 18),
  item("Kachumber", "Sides", null, "Classic Indian kachumber salad.", 13000, "100 gms", false, false, true, 18),
];

const desserts = [
  item("Berry Cheesecake", "Desserts", null, "Housemade berry cheesecake.", 33000, "100 gms", true, false, true, 25),
  item("Brownie with Ice Cream", "Desserts", null, "Warm brownie served with ice cream.", 29000, "100 gms", false, false, true, 25),
  item("Rabdi Gulab Jamun", "Desserts", null, "Classic gulab jamun with rabdi.", 37000, "100 gms", true, false, true, 25),
  item("Tiramisu", "Desserts", null, "Classic Italian tiramisu.", 33000, "100 gms", true, false, true, 25),
  item("Chocolate Truffle Ball and Mousse", "Desserts", null, "Chocolate truffle ball with mousse.", 32000, "100 gms", false, false, true, 25),
  item("Chocolate Fondue", "Desserts", null, "Chocolate fondue served with seasonal fruit, cookies & sponge cake pieces.", 33000, "100 gms", false, false, true, 25),
  item("Hot Chocolate", "Desserts", null, "Classic hot chocolate with whipped cream & biscoff on top.", 24000, "200 ml", false, false, true, 25),
  item("Ice Cream Sundae", "Desserts", null, "Ice cream sundae — Mango / Chocolate / Vanilla.", 35000, "100 gms", false, false, true, 25),
  item("Ice Cream Scoop", "Desserts", null, "Single scoop — Chocolate / Vanilla / Mango / Kesar Pista / Coffee.", 10000, "1 scoop", false, false, true, 25),
];

export const MENU_CATALOG: MenuCatalogItem[] = [
  ...coldPressed,
  ...milkshakes,
  ...sodas,
  ...icedTeas,
  ...fantasyFizz,
  ...soups,
  ...salads,
  ...appetizersIndian,
  ...appetizersGlobal,
  ...appetizersAsian,
  ...sushi,
  ...dimSum,
  ...smallPlates,
  ...sandwiches,
  ...pizzas,
  ...mainsMexican,
  ...mainsPasta,
  ...mainsAsianNoodles,
  ...mainsAsianCurry,
  ...platters,
  ...punjabiPaneer,
  ...punjabiVegetable,
  ...indianRice,
  ...breads,
  ...sides,
  ...desserts,
];

export function menuRecipeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

export function menuRecipeId(name: string, index: number): string {
  const base = menuRecipeSlug(name);
  return index > 0 ? `rec_${base}_${index}` : `rec_${base}`;
}
