/**
 * Where a product's stock sits. The catalogue only carries a single total
 * quantity, so for the prototype that total is split across a handful of
 * Indian locations — deterministically per product, and always summing back
 * to exactly the product's quantity.
 */

export interface LocationStock {
  state: string;
  city: string;
  district: string;
  pinCode: string;
  quantity: number;
}

const POOL: Omit<LocationStock, "quantity">[] = [
  { state: "Maharashtra", city: "Mumbai", district: "Mumbai Suburban", pinCode: "400001" },
  { state: "Maharashtra", city: "Pune", district: "Pune", pinCode: "411001" },
  { state: "Delhi", city: "New Delhi", district: "Central Delhi", pinCode: "110001" },
  { state: "Karnataka", city: "Bengaluru", district: "Bengaluru Urban", pinCode: "560001" },
  { state: "Tamil Nadu", city: "Chennai", district: "Chennai", pinCode: "600001" },
  { state: "Telangana", city: "Hyderabad", district: "Hyderabad", pinCode: "500001" },
  { state: "West Bengal", city: "Kolkata", district: "Kolkata", pinCode: "700001" },
  { state: "Gujarat", city: "Ahmedabad", district: "Ahmedabad", pinCode: "380001" },
  { state: "Rajasthan", city: "Jaipur", district: "Jaipur", pinCode: "302001" },
  { state: "Uttar Pradesh", city: "Lucknow", district: "Lucknow", pinCode: "226001" },
  { state: "Haryana", city: "Gurugram", district: "Gurugram", pinCode: "122001" },
  { state: "Kerala", city: "Kochi", district: "Ernakulam", pinCode: "682001" },
];

export function locationsFor(productId: string, quantity: number): LocationStock[] {
  const seed = Number.parseInt(productId, 10) || 1;
  const count = Math.min(3 + (seed % 4), quantity); // 3–6 locations
  const start = seed % POOL.length;

  // Step of 5 is coprime with the pool size, so picks never repeat.
  const picks = Array.from({ length: count }, (_, i) => POOL[(start + i * 5) % POOL.length]);
  const weights = picks.map((_, i) => 2 + ((seed * (i + 3)) % 7));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const quantities = weights.map((w) => Math.floor((quantity * w) / totalWeight));
  // Whatever flooring left over goes to the largest location.
  const remainder = quantity - quantities.reduce((a, b) => a + b, 0);
  quantities[quantities.indexOf(Math.max(...quantities))] += remainder;

  const stock = picks
    .map((p, i) => ({ ...p, quantity: quantities[i] }))
    .sort((a, b) => b.quantity - a.quantity);

  // With four or more locations the smallest one is sold out: its stock moves
  // to the largest, so the total still equals the product's quantity.
  if (stock.length >= 4) {
    stock[0].quantity += stock[stock.length - 1].quantity;
    stock[stock.length - 1].quantity = 0;
  }
  return stock;
}

export interface VariantLocation {
  city: string;
  retail: number;
  sales: number;
  quantity: number;
  inStock: boolean;
}

// Per-location price differences, as a share of the variant's own price and
// by position in the list. Locations never undercut the listed price, so the
// listed sales price is also the variant's starting ("From") price.
const RETAIL_UPLIFT = [0, 0, 0.02, 0, 0.02, 0];
const SALES_UPLIFT = [0, 0.03, 0.05, 0.01, 0.04, 0.02];

const uplift = (price: number, share: number) =>
  price + (share > 0 ? Math.max(1, Math.round(price * share)) : 0);

/** A variant's stock and pricing broken out by location — same locations and
 *  quantities as `locationsFor`, so the totals agree everywhere. */
export function variantLocationsFor(
  productId: string,
  quantity: number,
  retail: number,
  sales: number
): VariantLocation[] {
  return locationsFor(productId, quantity).map((l, i) => ({
    city: l.city,
    retail: uplift(retail, RETAIL_UPLIFT[i]),
    sales: uplift(sales, SALES_UPLIFT[i]),
    quantity: l.quantity,
    inStock: l.quantity > 0,
  }));
}

/** The lowest sales price across a variant's locations. */
export const startingPrice = (locations: VariantLocation[]) =>
  Math.min(...locations.map((l) => l.sales));
