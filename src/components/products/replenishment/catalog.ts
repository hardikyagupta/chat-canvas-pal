// Catalog data model for the Replenishment first-time setup experience.
// Hierarchy: Catalog -> Category -> Sub-category -> Product group -> Product

export type Level = "catalog" | "category" | "sub" | "group" | "product";

export type Group = {
  id: string;
  name: string;
  subId: string;
  catId: string;
  productCount: number;
};

export type Sub = {
  id: string;
  name: string;
  catId: string;
  productCount: number;
  groupCount: number;
};

export type Category = {
  id: string;
  name: string;
  image: string;
  productCount: number;
  subCount: number;
  groupCount: number;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  image: string;
  units: number;
  groupId: string;
  groupName: string;
  subId: string;
  subName: string;
  catId: string;
  catName: string;
};

const img = (base: string, w = 96, h = 96) =>
  `${base}?w=${w}&h=${h}&fit=crop&auto=format`;

const IMAGES = {
  dairy: "https://images.unsplash.com/photo-1553301803-768cd4a59b9c",
  bakery: "https://images.unsplash.com/photo-1598373182133-52452f7691ef",
  snacks: "https://images.unsplash.com/photo-1613919113640-25732ec5e61f",
  beverages: "https://images.unsplash.com/photo-1640213505284-21352ee0d76b",
  frozen: "https://images.unsplash.com/photo-1629385701021-fcd568a743e8",
  personal: "https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0",
  fruits: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba",
  staples: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
  homecare: "https://images.unsplash.com/photo-1585771724684-38269d6639fd",
  babycare: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4",
};

type CatSpec = {
  name: string;
  image: string;
  brands: string[];
  subs: { name: string; count: number }[];
};

const SPEC: CatSpec[] = [
  {
    name: "Dairy",
    image: IMAGES.dairy,
    brands: ["Amul", "Mother Dairy", "Nestlé", "Britannia", "Gowardhan"],
    subs: [
      { name: "Milk", count: 32 },
      { name: "Curd", count: 17 },
      { name: "Cheese", count: 29 },
      { name: "Butter", count: 21 },
      { name: "Buttermilk", count: 17 },
      { name: "Paneer", count: 24 },
      { name: "Yogurt", count: 35 },
      { name: "Ghee", count: 30 },
    ],
  },
  {
    name: "Bakery",
    image: IMAGES.bakery,
    brands: ["Britannia", "Modern", "Harvest Gold", "English Oven"],
    subs: [
      { name: "Bread", count: 48 },
      { name: "Cookies", count: 41 },
      { name: "Cakes", count: 33 },
      { name: "Rusks", count: 22 },
      { name: "Muffins", count: 30 },
    ],
  },
  {
    name: "Snacks",
    image: IMAGES.snacks,
    brands: ["Lay's", "Haldiram's", "Bingo", "Act II", "Too Yumm"],
    subs: [
      { name: "Chips", count: 40 },
      { name: "Namkeen", count: 38 },
      { name: "Popcorn", count: 20 },
      { name: "Nuts & Seeds", count: 25 },
    ],
  },
  {
    name: "Beverages",
    image: IMAGES.beverages,
    brands: ["Real", "Tropicana", "Coca-Cola", "Tata Tea", "Bisleri"],
    subs: [
      { name: "Juices", count: 64 },
      { name: "Soft drinks", count: 58 },
      { name: "Tea", count: 52 },
      { name: "Coffee", count: 40 },
      { name: "Water", count: 40 },
    ],
  },
  {
    name: "Fruits & Vegetables",
    image: IMAGES.fruits,
    brands: ["D-Mart Fresh", "FreshKart", "BigBasket", "Safal"],
    subs: [
      { name: "Fresh Fruits", count: 55 },
      { name: "Fresh Vegetables", count: 72 },
      { name: "Exotic Vegetables", count: 28 },
      { name: "Herbs & Leaves", count: 18 },
      { name: "Sprouts", count: 12 },
    ],
  },
  {
    name: "Staples & Grocery",
    image: IMAGES.staples,
    brands: ["Fortune", "India Gate", "Tata", "Aashirvaad", "Patanjali"],
    subs: [
      { name: "Atta & Flour", count: 36 },
      { name: "Rice", count: 42 },
      { name: "Dal & Pulses", count: 54 },
      { name: "Cooking Oil", count: 38 },
      { name: "Sugar & Salt", count: 22 },
      { name: "Spices & Masala", count: 60 },
    ],
  },
  {
    name: "Frozen Foods",
    image: IMAGES.frozen,
    brands: ["McCain", "Amul", "Kwality Wall's", "Safal"],
    subs: [
      { name: "Frozen Vegetables", count: 28 },
      { name: "Ice Cream", count: 31 },
      { name: "Frozen Snacks", count: 22 },
      { name: "Frozen Ready Meals", count: 18 },
    ],
  },
  {
    name: "Personal Care",
    image: IMAGES.personal,
    brands: ["Dove", "Head & Shoulders", "Colgate", "Nivea", "Himalaya"],
    subs: [
      { name: "Hair Care", count: 58 },
      { name: "Skin Care", count: 62 },
      { name: "Oral Care", count: 45 },
      { name: "Bath & Body", count: 48 },
    ],
  },
  {
    name: "Home Care",
    image: IMAGES.homecare,
    brands: ["Surf Excel", "Harpic", "Colin", "Scotch-Brite", "Lizol"],
    subs: [
      { name: "Laundry", count: 44 },
      { name: "Dishwash", count: 26 },
      { name: "Surface Cleaners", count: 32 },
      { name: "Fresheners", count: 18 },
      { name: "Insect Repellents", count: 14 },
    ],
  },
  {
    name: "Baby Care",
    image: IMAGES.babycare,
    brands: ["Pampers", "Huggies", "Johnson's", "Mamaearth", "Mamy Poko"],
    subs: [
      { name: "Diapers", count: 22 },
      { name: "Baby Food", count: 34 },
      { name: "Baby Skin Care", count: 28 },
      { name: "Baby Bath", count: 20 },
      { name: "Baby Accessories", count: 16 },
    ],
  },
];

function splitCount(total: number, parts: number): number[] {
  const out: number[] = [];
  let remaining = total;
  for (let i = 0; i < parts; i++) {
    if (i === parts - 1) {
      out.push(remaining);
    } else {
      const share = Math.max(1, Math.round(total / parts + (i === 0 ? 2 : -1)));
      out.push(Math.min(share, remaining - (parts - 1 - i)));
      remaining -= out[i];
    }
  }
  return out;
}

export const CATALOG = { id: "cat-dmart", name: "D-Mart" };

export const categories: Category[] = [];
export const subs: Sub[] = [];
export const groups: Group[] = [];

SPEC.forEach((spec, ci) => {
  const catId = `c${ci}`;
  let catGroupCount = 0;
  spec.subs.forEach((sub, si) => {
    const subId = `${catId}-s${si}`;
    const nGroups = Math.min(3, spec.brands.length);
    const parts = splitCount(sub.count, nGroups);
    parts.forEach((pc, gi) => {
      groups.push({
        id: `${subId}-g${gi}`,
        name: `${spec.brands[gi % spec.brands.length]} ${sub.name}`,
        subId,
        catId,
        productCount: pc,
      });
    });
    catGroupCount += nGroups;
    subs.push({
      id: subId,
      name: sub.name,
      catId,
      productCount: sub.count,
      groupCount: nGroups,
    });
  });
  categories.push({
    id: catId,
    name: spec.name,
    image: img(spec.image),
    productCount: spec.subs.reduce((a, b) => a + b.count, 0),
    subCount: spec.subs.length,
    groupCount: catGroupCount,
  });
});

export const TOTAL_PRODUCTS = categories.reduce(
  (a, c) => a + c.productCount,
  0,
);

// Representative products (browsable sample for the "Products" view).
type ProdSpec = {
  name: string;
  sub: string;
  units: number;
  image: string;
  cat: string;
};

const PROD_SPECS: ProdSpec[] = [
  // Dairy
  { name: "Amul Gold Milk 500ml", sub: "Milk", units: 1240, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Amul Taaza Milk 1L", sub: "Milk", units: 860, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Mother Dairy Full Cream Milk 500ml", sub: "Milk", units: 1080, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Mother Dairy Curd 400g", sub: "Curd", units: 512, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Amul Masti Dahi 400g", sub: "Curd", units: 680, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Amul Cheese Slices 200g", sub: "Cheese", units: 340, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Amul Butter 100g", sub: "Butter", units: 720, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Nestlé Fresh Paneer 200g", sub: "Paneer", units: 168, image: IMAGES.dairy, cat: "Dairy" },
  { name: "Amul Ghee 500ml", sub: "Ghee", units: 430, image: IMAGES.dairy, cat: "Dairy" },
  // Bakery
  { name: "Britannia Brown Bread", sub: "Bread", units: 430, image: IMAGES.bakery, cat: "Bakery" },
  { name: "Modern Milk Bread 400g", sub: "Bread", units: 610, image: IMAGES.bakery, cat: "Bakery" },
  { name: "Harvest Gold White Bread", sub: "Bread", units: 520, image: IMAGES.bakery, cat: "Bakery" },
  { name: "Britannia Good Day Cookies", sub: "Cookies", units: 980, image: IMAGES.bakery, cat: "Bakery" },
  { name: "Britannia Marie Gold 250g", sub: "Cookies", units: 860, image: IMAGES.bakery, cat: "Bakery" },
  { name: "English Oven Choco Muffin", sub: "Muffins", units: 122, image: IMAGES.bakery, cat: "Bakery" },
  { name: "Britannia Bourbon Cream 200g", sub: "Cookies", units: 540, image: IMAGES.bakery, cat: "Bakery" },
  // Snacks
  { name: "Lay's Classic Salted 90g", sub: "Chips", units: 1520, image: IMAGES.snacks, cat: "Snacks" },
  { name: "Bingo Mad Angles 80g", sub: "Chips", units: 890, image: IMAGES.snacks, cat: "Snacks" },
  { name: "Haldiram's Aloo Bhujia 200g", sub: "Namkeen", units: 640, image: IMAGES.snacks, cat: "Snacks" },
  { name: "Haldiram's Mixture 200g", sub: "Namkeen", units: 490, image: IMAGES.snacks, cat: "Snacks" },
  { name: "Act II Butter Popcorn", sub: "Popcorn", units: 210, image: IMAGES.snacks, cat: "Snacks" },
  { name: "Too Yumm Multigrain Chips 60g", sub: "Chips", units: 380, image: IMAGES.snacks, cat: "Snacks" },
  // Beverages
  { name: "Real Mixed Fruit Juice 1L", sub: "Juices", units: 1120, image: IMAGES.beverages, cat: "Beverages" },
  { name: "Tropicana Orange 1L", sub: "Juices", units: 770, image: IMAGES.beverages, cat: "Beverages" },
  { name: "Coca-Cola 750ml", sub: "Soft drinks", units: 2040, image: IMAGES.beverages, cat: "Beverages" },
  { name: "Pepsi 750ml", sub: "Soft drinks", units: 1850, image: IMAGES.beverages, cat: "Beverages" },
  { name: "Tata Tea Gold 500g", sub: "Tea", units: 640, image: IMAGES.beverages, cat: "Beverages" },
  { name: "Nescafé Classic 100g", sub: "Coffee", units: 410, image: IMAGES.beverages, cat: "Beverages" },
  { name: "Bisleri Water 1L", sub: "Water", units: 3120, image: IMAGES.beverages, cat: "Beverages" },
  // Fruits & Vegetables
  { name: "Bananas (12 pcs)", sub: "Fresh Fruits", units: 380, image: IMAGES.fruits, cat: "Fruits & Vegetables" },
  { name: "Apples Royal Gala 1kg", sub: "Fresh Fruits", units: 260, image: IMAGES.fruits, cat: "Fruits & Vegetables" },
  { name: "Tomatoes 500g", sub: "Fresh Vegetables", units: 540, image: IMAGES.fruits, cat: "Fruits & Vegetables" },
  { name: "Onions 1kg", sub: "Fresh Vegetables", units: 710, image: IMAGES.fruits, cat: "Fruits & Vegetables" },
  { name: "Spinach (Palak) 250g", sub: "Herbs & Leaves", units: 190, image: IMAGES.fruits, cat: "Fruits & Vegetables" },
  { name: "Baby Corn 200g", sub: "Exotic Vegetables", units: 140, image: IMAGES.fruits, cat: "Fruits & Vegetables" },
  // Staples & Grocery
  { name: "Aashirvaad Atta 5kg", sub: "Atta & Flour", units: 830, image: IMAGES.staples, cat: "Staples & Grocery" },
  { name: "India Gate Basmati Rice 5kg", sub: "Rice", units: 620, image: IMAGES.staples, cat: "Staples & Grocery" },
  { name: "Fortune Toor Dal 1kg", sub: "Dal & Pulses", units: 740, image: IMAGES.staples, cat: "Staples & Grocery" },
  { name: "Fortune Sunflower Oil 1L", sub: "Cooking Oil", units: 910, image: IMAGES.staples, cat: "Staples & Grocery" },
  { name: "Tata Salt 1kg", sub: "Sugar & Salt", units: 1240, image: IMAGES.staples, cat: "Staples & Grocery" },
  { name: "MDH Kitchen King Masala 100g", sub: "Spices & Masala", units: 550, image: IMAGES.staples, cat: "Staples & Grocery" },
  // Frozen Foods
  { name: "McCain French Fries 750g", sub: "Frozen Snacks", units: 305, image: IMAGES.frozen, cat: "Frozen Foods" },
  { name: "Kwality Wall's Vanilla 1L", sub: "Ice Cream", units: 260, image: IMAGES.frozen, cat: "Frozen Foods" },
  { name: "Safal Green Peas 500g", sub: "Frozen Vegetables", units: 190, image: IMAGES.frozen, cat: "Frozen Foods" },
  { name: "Amul Chocolate Ice Cream 1L", sub: "Ice Cream", units: 310, image: IMAGES.frozen, cat: "Frozen Foods" },
  // Personal Care
  { name: "Dove Shampoo 340ml", sub: "Hair Care", units: 410, image: IMAGES.personal, cat: "Personal Care" },
  { name: "Head & Shoulders 180ml", sub: "Hair Care", units: 520, image: IMAGES.personal, cat: "Personal Care" },
  { name: "Nivea Body Lotion 400ml", sub: "Skin Care", units: 300, image: IMAGES.personal, cat: "Personal Care" },
  { name: "Colgate MaxFresh 150g", sub: "Oral Care", units: 880, image: IMAGES.personal, cat: "Personal Care" },
  { name: "Himalaya Neem Face Wash 150ml", sub: "Skin Care", units: 640, image: IMAGES.personal, cat: "Personal Care" },
  // Home Care
  { name: "Surf Excel Easy Wash 1kg", sub: "Laundry", units: 720, image: IMAGES.homecare, cat: "Home Care" },
  { name: "Harpic Power Plus 500ml", sub: "Surface Cleaners", units: 540, image: IMAGES.homecare, cat: "Home Care" },
  { name: "Scotch-Brite Scrub Pad (3pc)", sub: "Dishwash", units: 480, image: IMAGES.homecare, cat: "Home Care" },
  { name: "Colin Glass Cleaner 500ml", sub: "Surface Cleaners", units: 310, image: IMAGES.homecare, cat: "Home Care" },
  { name: "Lizol Disinfectant 500ml", sub: "Surface Cleaners", units: 390, image: IMAGES.homecare, cat: "Home Care" },
  // Baby Care
  { name: "Pampers Active Baby Diapers L (44pcs)", sub: "Diapers", units: 280, image: IMAGES.babycare, cat: "Baby Care" },
  { name: "Huggies Wonder Pants M (42pcs)", sub: "Diapers", units: 240, image: IMAGES.babycare, cat: "Baby Care" },
  { name: "Nestlé Cerelac Wheat 300g", sub: "Baby Food", units: 190, image: IMAGES.babycare, cat: "Baby Care" },
  { name: "Johnson's Baby Lotion 200ml", sub: "Baby Skin Care", units: 320, image: IMAGES.babycare, cat: "Baby Care" },
  { name: "Mamaearth Gentle Baby Wash 400ml", sub: "Baby Bath", units: 210, image: IMAGES.babycare, cat: "Baby Care" },
];

export const products: Product[] = PROD_SPECS.map((p, i) => {
  const sub = subs.find((s) => s.name === p.sub && categoryName(s.catId) === p.cat);
  const cat = categories.find((c) => c.name === p.cat)!;
  const group = groups.find((g) => g.subId === sub?.id) ?? groups[0];
  return {
    id: `p${i}`,
    name: p.name,
    sku: String(10000000 + i * 137),
    image: img(p.image, 80, 80),
    units: p.units,
    groupId: group.id,
    groupName: group.name,
    subId: sub?.id ?? "",
    subName: p.sub,
    catId: cat?.id ?? "",
    catName: p.cat,
  };
});

function categoryName(catId: string): string {
  return categories.find((c) => c.id === catId)?.name ?? "";
}

export function catById(id: string) {
  return categories.find((c) => c.id === id);
}
export function subById(id: string) {
  return subs.find((s) => s.id === id);
}
export function groupById(id: string) {
  return groups.find((g) => g.id === id);
}
export function productById(id: string) {
  return products.find((p) => p.id === id);
}
