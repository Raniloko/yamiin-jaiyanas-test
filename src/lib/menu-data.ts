import ysAsset from "@/assets/menu/bowl-ys.webp.asset.json";
import jsAsset from "@/assets/menu/bowl-js.webp.asset.json";
import bulgurAsset from "@/assets/menu/bowl-bulgur-blizz.webp.asset.json";
import midoriAsset from "@/assets/menu/bowl-midori-ebi.webp.asset.json";
import falafelAsset from "@/assets/menu/bowl-falafel-exotica.webp.asset.json";
import alohaAsset from "@/assets/menu/bowl-aloha.webp.asset.json";
import m_strawAsset from "@/assets/menu/matcha-strawberry.webp.asset.json";
import m_coconutAsset from "@/assets/menu/matcha-coconut.webp.asset.json";
import m_mangoAsset from "@/assets/menu/matcha-mango.webp.asset.json";
import m_lotusAsset from "@/assets/menu/matcha-lotus.webp.asset.json";
import m_pistachioAsset from "@/assets/menu/matcha-pistachio.webp.asset.json";
import a_lotusAsset from "@/assets/menu/acai-lotus.webp.asset.json";
import a_pistachioAsset from "@/assets/menu/acai-pistachio.webp.asset.json";
import a_buenoAsset from "@/assets/menu/acai-bueno.webp.asset.json";
import a_cookieAsset from "@/assets/menu/acai-cookie.webp.asset.json";
import a_snickersAsset from "@/assets/menu/acai-snickers.webp.asset.json";
import a_brownieAsset from "@/assets/menu/acai-brownie.webp.asset.json";
import a_tropicalAsset from "@/assets/menu/acai-tropical.webp.asset.json";
import a_whitechocAsset from "@/assets/menu/acai-white-chocolate.webp.asset.json";
import iceAsset from "@/assets/menu/peeka-ice-burger.webp.asset.json";
import wrapAsset from "@/assets/menu/chicken-wrap.webp.asset.json";

export type BowlFilter = "Alle" | "High Protein" | "Chicken" | "Fisch & Garnelen" | "Vegan";
export type Nutrition = { k: number; f: number; c: number; z: number; p: number; b: number };
export type Bowl = { name: string; tag: string; filters: BowlFilter[]; description: string; protein: string; small: string; large: string; image: string; nutrition: { small: Nutrition; large: Nutrition } };
export type MenuProduct = { name: string; description: string; price: string; image: string; size?: string; signature?: boolean; ingredients?: string[]; options?: readonly string[]; optionLabel?: string; hot?: boolean };
export const bowlFilters: BowlFilter[] = ["Alle", "High Protein", "Chicken", "Fisch & Garnelen", "Vegan"];
export const menuCategories = [
  { id: "bowls", label: "Bowls" }, { id: "create", label: "Bowl selbst bauen" },
  { id: "matcha", label: "Matcha" }, { id: "coffee", label: "Coffee" },
  { id: "acai", label: "Açaí" }, { id: "ice", label: "Ice Burger" }, { id: "wrap", label: "Wraps" },
] as const;
export const milkOptions = ["Milk", "Oat Milk", "Coconut Milk"] as const;
export const acaiOptions = ["Chia", "Granola"] as const;
export const parseMenuPrice = (value: string) => Number(value.replace(",", ".").replace(" €", ""));
export const bowls: Bowl[] = [
{"name": "Y's Bowl", "tag": "Signature", "filters": ["Alle", "Chicken", "High Protein"], "description": "Base + Grilled Chicken, Tomaten, Rote Zwiebel, Paprika, Gurken, Avocado, Nachos, Chipotle", "protein": "19,3 g / 36,9 g", "small": "10,90 €", "large": "13,90 €", "nutrition": {"small": {"k": 484, "f": 15.7, "c": 66.6, "z": 4.95, "p": 19.3, "b": 4}, "large": {"k": 885, "f": 29.8, "c": 117.8, "z": 9.83, "p": 36.9, "b": 7.1}}, "image": ysAsset.url},
{"name": "J's Bowl", "tag": "Signature", "filters": ["Alle", "Chicken", "High Protein"], "description": "Base + Grilled Chicken, Mais, Frühlingszwiebel, Paprika, Nachos, Crunchy Onions", "protein": "19,8 g / 38 g", "small": "10,90 €", "large": "13,90 €", "nutrition": {"small": {"k": 492, "f": 15.2, "c": 68.6, "z": 4.4, "p": 19.8, "b": 3.4}, "large": {"k": 912, "f": 30.2, "c": 122.5, "z": 8.7, "p": 38, "b": 6.6}}, "image": jsAsset.url},
{"name": "Bulgur Blizz Bowl", "tag": "High Protein", "filters": ["Alle", "Chicken", "High Protein"], "description": "Base + Grilled Chicken, Tomaten, Gurken, Rote Zwiebel, Mais, Babyspinat, Schafskäse, Sesam-Mix, Honey Mustard Sauce", "protein": "25,1 g / 48,5 g", "small": "10,90 €", "large": "13,90 €", "nutrition": {"small": {"k": 357, "f": 9.4, "c": 47.2, "z": 6.9, "p": 25.1, "b": 9.9}, "large": {"k": 670, "f": 18.6, "c": 84.2, "z": 13.3, "p": 48.5, "b": 17.4}}, "image": bulgurAsset.url},
{"name": "Midori Ebi Bowl", "tag": "Garnelen", "filters": ["Alle", "Fisch & Garnelen"], "description": "Base + Garnelen, Edamame, Gurke, Frühlingszwiebel, Mais, Crunchy Onions, Sweet Onion Sauce", "protein": "17,4 g / 33,2 g", "small": "11,50 €", "large": "14,30 €", "nutrition": {"small": {"k": 389, "f": 4.9, "c": 69.5, "z": 8.8, "p": 17.4, "b": 3.2}, "large": {"k": 705, "f": 9.6, "c": 124.4, "z": 17.6, "p": 33.2, "b": 6.2}}, "image": midoriAsset.url},
{"name": "Falafel Exotica Bowl", "tag": "Vegan", "filters": ["Alle", "Vegan"], "description": "Base + Falafel, Gurke, Frühlingszwiebel, Babyspinat, Mango, Granatapfel, Mango-Chilli Sauce", "protein": "12,5 g / 19,6 g", "small": "10,90 €", "large": "12,90 €", "nutrition": {"small": {"k": 471, "f": 13.1, "c": 72.2, "z": 10, "p": 12.5, "b": 9.7}, "large": {"k": 767, "f": 21, "c": 119.3, "z": 16.4, "p": 19.6, "b": 14.1}}, "image": falafelAsset.url},
{"name": "Aloha Bowl", "tag": "Tropical", "filters": ["Alle", "Fisch & Garnelen"], "description": "Base + Thunfisch, Ananas, Cashewkerne, Mais, Tomaten, Gurke, Frühlingszwiebel, Babyspinat, Sesam", "protein": "12,5 g / 19,6 g", "small": "10,90 €", "large": "13,90 €", "nutrition": {"small": {"k": 471, "f": 13.1, "c": 72.2, "z": 10, "p": 12.5, "b": 9.7}, "large": {"k": 767, "f": 21, "c": 119.3, "z": 16.4, "p": 19.6, "b": 14.1}}, "image": alohaAsset.url},
];
export const bowlSteps = [
  {
    "number": "1",
    "title": "Base",
    "note": "Deine Grundlage",
    "items": [
      "Bulgur",
      "Somalireis",
      "Salat"
    ],
    "included": null,
    "seasonal": false
  },
  {
    "number": "2",
    "title": "Protein",
    "note": "Wähle dein Protein",
    "items": [
      "Chicken Filets",
      "Chicken Sticks",
      "Garnelen",
      "Tuna",
      "Planted Base Chicken",
      "Falafel"
    ],
    "included": null,
    "seasonal": false
  },
  {
    "number": "3",
    "title": "Veggies",
    "note": "3× inklusive: frisches Gemüse, teils saisonal",
    "items": [
      "Tomaten",
      "Gurken",
      "Mais",
      "Paprika",
      "Rucola",
      "Frühlingszwiebeln",
      "Rote Zwiebel",
      "Edamame",
      "Babyspinat"
    ],
    "included": 3,
    "seasonal": true
  },
  {
    "number": "4",
    "title": "Specials",
    "note": "1× inklusive: das gewisse Extra, teils saisonal",
    "items": [
      "Schafskäse",
      "Avocado",
      "Ananas",
      "Mango",
      "Granatapfelkerne"
    ],
    "included": 1,
    "seasonal": true
  },
  {
    "number": "5",
    "title": "Gravies",
    "note": "1× inklusive: Crunch & Topping",
    "items": [
      "Nachos",
      "Crunchy Onions",
      "Sesam Mix",
      "Kokoschips",
      "Erdnüsse",
      "Cashewkerne",
      "Sonnenblumenkerne",
      "Walnüsse"
    ],
    "included": 1,
    "seasonal": false
  },
  {
    "number": "6",
    "title": "Saucen",
    "note": "1× inklusive, zum Abrunden",
    "items": [
      "Chipotle",
      "Sesam",
      "Mango-Chili",
      "Honey Mustard",
      "Sweet Onion",
      "Soja",
      "Bio Olivenöl & Bio Zitronenöl",
      "Sesamöl",
      "Balsamico"
    ],
    "included": 1,
    "seasonal": false
  }
];
export const matchas: MenuProduct[] = [
{"name": "Iced Strawberry", "description": "Fruchtige Erdbeere trifft cremigen Matcha", "price": "6,90 €", "size": "0,3 l", "signature": false, "hot": false, "optionLabel": "Milch", "image": m_strawAsset.url, options: milkOptions},
{"name": "Iced Coconut", "description": "Matcha trifft Kokos – cremig & erfrischend", "price": "6,90 €", "size": "0,3 l", "signature": false, "hot": false, "optionLabel": "Milch", "image": m_coconutAsset.url, options: milkOptions},
{"name": "Iced Mango", "description": "Süße Mango trifft kräftigen Matcha", "price": "6,90 €", "size": "0,3 l", "signature": false, "hot": false, "optionLabel": "Milch", "image": m_mangoAsset.url, options: milkOptions},
{"name": "Iced Lotus", "description": "Karamellige Lotus-Note mit Matcha", "price": "7,50 €", "size": "0,3 l", "signature": true, "hot": false, "optionLabel": "Milch", "image": m_lotusAsset.url, options: milkOptions},
{"name": "Iced Pistachio", "description": "Cremige Pistazie trifft Matcha", "price": "7,50 €", "size": "0,3 l", "signature": true, "hot": false, "optionLabel": "Milch", "image": m_pistachioAsset.url, options: milkOptions},
{"name": "Hot Matcha", "description": "Dein Matcha nach Wahl, jetzt auch heiß", "price": "5,50 €", "size": "heiß", "signature": false, "hot": true, "optionLabel": "Milch", "image": "", options: milkOptions},
];
export const coffees = [["Cafe Crema", "3,00 €"], ["Espresso", "2,00 €"], ["Espresso Macchiato", "2,50 €"], ["Cappuccino", "3,60 €"], ["Flat White", "3,60 €"], ["Cafe Latte", "3,60 €"], ["Hot Chocolate", "3,50 €"]];
export const coffeeExtra = { name: "Extra Flavor", price: "0,60 €" };
export const acais: MenuProduct[] = [
{"name": "Lotus Açaí", "description": "Lotus Creme und Lotus Crumbles", "price": "11,90 €", "ingredients": ["Lotus Creme", "Chia oder Granola", "Erdnussbutter", "Erdbeeren", "Heidelbeeren", "Lotus Crumbles"], "optionLabel": "Chia oder Granola", image: a_lotusAsset.url, options: acaiOptions},
{"name": "Pistachio Açaí", "description": "Pistaziencreme und Pistazienflocken", "price": "11,90 €", "ingredients": ["Pistaziencreme", "Chia oder Granola", "Erdbeeren", "Heidelbeeren", "Pistazienflocken"], "optionLabel": "Chia oder Granola", image: a_pistachioAsset.url, options: acaiOptions},
{"name": "Bueno Açaí", "description": "Bueno Creme und Haselnüsse", "price": "11,90 €", "ingredients": ["Bueno Creme", "Chia oder Granola", "Erdnussbutter", "Erdbeeren", "Heidelbeeren", "Haselnüsse", "Bueno Stücke"], "optionLabel": "Chia oder Granola", image: a_buenoAsset.url, options: acaiOptions},
{"name": "Cookie Açaí", "description": "Oreo Creme und Cookie Crumbles", "price": "11,90 €", "ingredients": ["Oreo Creme", "Chia oder Granola", "Cookie Crumbles", "Erdbeeren", "Heidelbeeren", "Oreos"], "optionLabel": "Chia oder Granola", image: a_cookieAsset.url, options: acaiOptions},
{"name": "Snickers Açaí", "description": "Erdnussbutter und Snickers", "price": "11,90 €", "ingredients": ["Chocolate Sauce", "Erdnussbutter", "Chia oder Granola", "Erdbeeren", "Heidelbeeren", "Erdnüsse", "Snickers", "Snickers Flakes"], "optionLabel": "Chia oder Granola", image: a_snickersAsset.url, options: acaiOptions},
{"name": "Brownie Açaí", "description": "Chocolate Sauce und Brownie-Stücke", "price": "11,90 €", "ingredients": ["Chocolate Sauce", "Chia oder Granola", "Erdbeeren", "Heidelbeeren", "Brownie-Stücke", "Haselnüsse"], "optionLabel": "Chia oder Granola", image: a_brownieAsset.url, options: acaiOptions},
{"name": "Tropical Açaí", "description": "Mangopüree und Kokosflocken", "price": "11,90 €", "ingredients": ["Mangopüree", "Chia oder Granola", "Erdbeeren", "Heidelbeeren", "Mango", "Kokosflocken"], "optionLabel": "Chia oder Granola", image: a_tropicalAsset.url, options: acaiOptions},
{"name": "White Chocolate Açaí", "description": "White Chocolate Creme und Flakes", "price": "11,90 €", "ingredients": ["White Chocolate Creme", "Chia oder Granola", "Erdbeeren", "Heidelbeeren", "White Chocolate Flakes"], "optionLabel": "Chia oder Granola", image: a_whitechocAsset.url, options: acaiOptions},
 ];
export const iceBurgerImage = iceAsset.url;
export const wrapImage = wrapAsset.url;
export const iceBurgers: MenuProduct[] = ["Peeka Pistachio", "Peeka Lotus", "Peeka Bueno"].map(name => ({ name, description: "Gefüllt mit Ice Cream", price: "4,00 €", image: iceBurgerImage }));
export const wraps: MenuProduct[] = [{ name: "Chicken Wrap", description: "Zarter Chicken, frisches Gemüse, knackige Salate und leckere Saucen – du entscheidest, was reinkommt.", price: "8,90 €", image: wrapImage }];
export const menuNotes = { pricing: "Alle Preise in Euro inkl. MwSt.", nutrition: "Nährwertangaben sind Richtwerte und können je nach Zubereitung leicht abweichen.", allergens: "Fragen zu Zutaten oder Allergenen? Sprich uns gerne an.", create: "In 6 Schritten zu deiner Lieblings-Bowl. Einfach an der Theke Schritt für Schritt auswählen." };
