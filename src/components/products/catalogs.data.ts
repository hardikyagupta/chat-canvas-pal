/** The product catalogs integrated with the account. */

export interface CatalogRow {
  id: number;
  name: string;
  active: boolean;
  products: number;
  variants: number;
  lastSync: string;
  nextSync: string;
  frequency: string;
}

export const catalogs: CatalogRow[] = [
  {
    id: 347,
    name: "Product Catalog",
    active: true,
    products: 996,
    variants: 996,
    lastSync: "Aug 27, 2026, 6:00 AM",
    nextSync: "Aug 27, 2026, 7:00 AM",
    frequency: "Hourly",
  },
  {
    id: 305,
    name: "Pure_farm_catalog",
    active: true,
    products: 100,
    variants: 100,
    lastSync: "Aug 27, 2026, 6:00 AM",
    nextSync: "Aug 27, 2026, 7:00 AM",
    frequency: "Hourly",
  },
  {
    id: 13,
    name: "Nyco product catalog",
    active: false,
    products: 28330,
    variants: 464296,
    lastSync: "Nov 6, 2025, 8:30 AM",
    nextSync: "Aug 27, 2026, 9:30 AM",
    frequency: "Daily",
  },
];
