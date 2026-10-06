import ysBowlAsset from "@/assets/menu/bowl-ys.webp.asset.json";
import jsBowlAsset from "@/assets/menu/bowl-js.webp.asset.json";
import bulgurBowlAsset from "@/assets/menu/bowl-bulgur-blizz.webp.asset.json";
import midoriBowlAsset from "@/assets/menu/bowl-midori-ebi.webp.asset.json";
import falafelBowlAsset from "@/assets/menu/bowl-falafel-exotica.webp.asset.json";
import alohaBowlAsset from "@/assets/menu/bowl-aloha.webp.asset.json";
import strawberryMatchaAsset from "@/assets/menu/matcha-strawberry.webp.asset.json";
import coconutMatchaAsset from "@/assets/menu/matcha-coconut.webp.asset.json";
import mangoMatchaAsset from "@/assets/menu/matcha-mango.webp.asset.json";
import lotusMatchaAsset from "@/assets/menu/matcha-lotus.webp.asset.json";
import pistachioMatchaAsset from "@/assets/menu/matcha-pistachio.webp.asset.json";
import lotusAcaiAsset from "@/assets/menu/acai-lotus.webp.asset.json";
import pistachioAcaiAsset from "@/assets/menu/acai-pistachio.webp.asset.json";
import buenoAcaiAsset from "@/assets/menu/acai-bueno.webp.asset.json";
import cookieAcaiAsset from "@/assets/menu/acai-cookie.webp.asset.json";
import snickersAcaiAsset from "@/assets/menu/acai-snickers.webp.asset.json";
import brownieAcaiAsset from "@/assets/menu/acai-brownie.webp.asset.json";
import tropicalAcaiAsset from "@/assets/menu/acai-tropical.webp.asset.json";
import whiteChocolateAcaiAsset from "@/assets/menu/acai-white-chocolate.webp.asset.json";
import iceBurgerAsset from "@/assets/menu/peeka-ice-burger.webp.asset.json";
import wrapAsset from "@/assets/menu/chicken-wrap.webp.asset.json";

export type BowlFilter = "Alle" | "High Protein" | "Chicken" | "Fisch & Garnelen" | "Vegan";

export type Bowl = {
  name: string;
  tag: string;
  filters: BowlFilter[];
  description: string;
  protein: string;
  small: string;
  large: string;
  image: string;
};

export const bowls: Bowl[] = [
  {
    name: "Y's Bowl",
    tag: "Signature",
    filters: ["Alle", "Chicken"],
    description: "Base + Grilled Chicken, Tomaten, Rote Zwiebel, Paprika, Gurken, Avocado, Nachos, Chipotle",
    protein: "19,3 g / 36,9 g",
    small: "10,90 €",
    large: "13,90 €",
    image: ysBowlAsset.url,
  },
  {
    name: "J's Bowl",
    tag: "Signature",
    filters: ["Alle", "Chicken"],
    description: "Base + Grilled Chicken, Mais, Frühlingszwiebel, Paprika, Nachos, Crunchy Onions",
    protein: "19,8 g / 38 g",
    small: "10,90 €",
    large: "13,90 €",
    image: jsBowlAsset.url,
  },
  {
    name: "Bulgur Blizz Bowl",
    tag: "High Protein",
    filters: ["Alle", "High Protein", "Chicken"],
    description: "Base + Grilled Chicken, Tomaten, Gurken, Rote Zwiebel, Mais, Babyspinat, Schafskäse, Sesam-Mix, Honey Mustard Sauce",
    protein: "25,1 g / 48,5 g",
    small: "10,90 €",
    large: "13,90 €",
    image: bulgurBowlAsset.url,
  },
  {
    name: "Midori Ebi Bowl",
    tag: "Garnelen",
    filters: ["Alle", "Fisch & Garnelen"],
    description: "Base + Garnelen, Edamame, Gurke, Frühlingszwiebel, Mais, Crunchy Onions, Sweet Onion Sauce",
    protein: "17,4 g / 33,2 g",
    small: "11,50 €",
    large: "14,30 €",
    image: midoriBowlAsset.url,
  },
  {
    name: "Falafel Exotica Bowl",
    tag: "Vegan",
    filters: ["Alle", "Vegan"],
    description: "Base + Falafel, Gurke, Frühlingszwiebel, Babyspinat, Mango, Granatapfel, Mango-Chilli Sauce",
    protein: "12,5 g / 19,6 g",
    small: "10,90 €",
    large: "12,90 €",
    image: falafelBowlAsset.url,
  },
  {
    name: "Aloha Bowl",
    tag: "Tropical",
    filters: ["Alle", "Fisch & Garnelen"],
    description: "Base + Thunfisch, Ananas, Cashewkerne, Mais, Tomaten, Gurke, Frühlingszwiebel, Babyspinat, Sesam",
    protein: "12,5 g / 19,6 g",
    small: "10,90 €",
    large: "13,90 €",
    image: alohaBowlAsset.url,
  },
];

export const bowlSteps = [
  { number: "1", title: "Base", note: "Deine Grundlage", items: ["Bulgur", "Somalireis", "Salat"] },
  { number: "2", title: "Protein", note: "Wähle dein Protein", items: ["Chicken Filets", "Chicken Sticks", "Garnelen", "Tuna", "Planted Base Chicken", "Falafel"] },
  { number: "3", title: "Veggies", note: "3× inklusive · teils saisonal", items: ["Tomaten", "Gurken", "Mais", "Paprika", "Rucola", "Frühlingszwiebeln", "Rote Zwiebel", "Edamame", "Babyspinat"] },
  { number: "4", title: "Specials", note: "1× inklusive · teils saisonal", items: ["Schafskäse", "Avocado", "Ananas", "Mango", "Granatapfelkerne"] },
  { number: "5", title: "Gravies", note: "1× inklusive · Crunch & Topping", items: ["Nachos", "Crunchy Onions", "Sesam Mix", "Kokoschips", "Erdnüsse", "Cashewkerne", "Sonnenblumenkerne", "Walnüsse"] },
  { number: "6", title: "Saucen", note: "1× inklusive · Zum Abrunden", items: ["Chipotle", "Sesam", "Mango-Chili", "Honey Mustard", "Sweet Onion", "Soja", "Bio Olivenöl & Bio Zitronenöl", "Sesamöl", "Balsamico"] },
];

export const matchas = [
  { name: "Iced Strawberry", description: "Fruchtige Erdbeere trifft cremigen Matcha", price: "6,90 €", size: "0,3 l", image: strawberryMatchaAsset.url },
  { name: "Iced Coconut", description: "Matcha trifft Kokos – cremig & erfrischend", price: "6,90 €", size: "0,3 l", image: coconutMatchaAsset.url },
  { name: "Iced Mango", description: "Süße Mango trifft kräftigen Matcha", price: "6,90 €", size: "0,3 l", image: mangoMatchaAsset.url },
  { name: "Iced Lotus", description: "Karamellige Lotus-Note mit Matcha", price: "7,50 €", size: "0,3 l", image: lotusMatchaAsset.url, signature: true },
  { name: "Iced Pistachio", description: "Cremige Pistazie trifft Matcha", price: "7,50 €", size: "0,3 l", image: pistachioMatchaAsset.url, signature: true },
];

export const coffees = [
  ["Cafe Crema", "3,00 €"], ["Espresso", "2,00 €"], ["Espresso Macchiato", "2,50 €"],
  ["Cappuccino", "3,60 €"], ["Flat White", "3,60 €"], ["Cafe Latte", "3,60 €"],
  ["Hot Chocolate", "3,50 €"], ["Extra Flavor", "+ 0,60 €"],
];

export const acais = [
  { name: "Lotus Açaí", description: "Lotus Creme · Lotus Crumbles", image: lotusAcaiAsset.url },
  { name: "Pistachio Açaí", description: "Pistaziencreme · Pistazienflocken", image: pistachioAcaiAsset.url },
  { name: "Bueno Açaí", description: "Bueno Creme · Haselnüsse", image: buenoAcaiAsset.url },
  { name: "Cookie Açaí", description: "Oreo Creme · Cookie Crumbles", image: cookieAcaiAsset.url },
  { name: "Snickers Açaí", description: "Erdnussbutter · Snickers", image: snickersAcaiAsset.url },
  { name: "Brownie Açaí", description: "Chocolate Sauce · Brownie-Stücke", image: brownieAcaiAsset.url },
  { name: "Tropical Açaí", description: "Mangopüree · Kokosflocken", image: tropicalAcaiAsset.url },
  { name: "White Chocolate Açaí", description: "White Chocolate Creme · Flakes", image: whiteChocolateAcaiAsset.url },
];

export const iceBurgerImage = iceBurgerAsset.url;
export const wrapImage = wrapAsset.url;