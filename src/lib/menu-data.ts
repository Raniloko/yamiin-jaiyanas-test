import bowlPokeImage from "@/assets/bowl-poke.jpg";
import bowlSaladImage from "@/assets/bowl-salat.jpg";
import bowlVeggieImage from "@/assets/bowl-veggie.jpg";
import acaiImage from "@/assets/acai.jpg";
import matchaImage from "@/assets/matcha.jpg";
import sandwichImage from "@/assets/sandwich.jpg";

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
    image: bowlPokeImage,
  },
  {
    name: "J's Bowl",
    tag: "Signature",
    filters: ["Alle", "Chicken"],
    description: "Base + Grilled Chicken, Mais, Frühlingszwiebel, Paprika, Nachos, Crunchy Onions",
    protein: "19,8 g / 38 g",
    small: "10,90 €",
    large: "13,90 €",
    image: bowlPokeImage,
  },
  {
    name: "Bulgur Blizz Bowl",
    tag: "High Protein",
    filters: ["Alle", "High Protein", "Chicken"],
    description: "Base + Grilled Chicken, Tomaten, Gurken, Rote Zwiebel, Mais, Babyspinat, Schafskäse, Sesam-Mix, Honey Mustard Sauce",
    protein: "25,1 g / 48,5 g",
    small: "10,90 €",
    large: "13,90 €",
    image: bowlSaladImage,
  },
  {
    name: "Midori Ebi Bowl",
    tag: "Garnelen",
    filters: ["Alle", "Fisch & Garnelen"],
    description: "Base + Garnelen, Edamame, Gurke, Frühlingszwiebel, Mais, Crunchy Onions, Sweet Onion Sauce",
    protein: "17,4 g / 33,2 g",
    small: "11,50 €",
    large: "14,30 €",
    image: bowlPokeImage,
  },
  {
    name: "Falafel Exotica Bowl",
    tag: "Vegan",
    filters: ["Alle", "Vegan"],
    description: "Base + Falafel, Gurke, Frühlingszwiebel, Babyspinat, Mango, Granatapfel, Mango-Chilli Sauce",
    protein: "12,5 g / 19,6 g",
    small: "10,90 €",
    large: "12,90 €",
    image: bowlVeggieImage,
  },
  {
    name: "Aloha Bowl",
    tag: "Tropical",
    filters: ["Alle", "Fisch & Garnelen"],
    description: "Base + Thunfisch, Ananas, Cashewkerne, Mais, Tomaten, Gurke, Frühlingszwiebel, Babyspinat, Sesam",
    protein: "12,5 g / 19,6 g",
    small: "10,90 €",
    large: "13,90 €",
    image: bowlPokeImage,
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
  { name: "Iced Strawberry", description: "Fruchtige Erdbeere trifft cremigen Matcha", price: "6,90 €", size: "0,3 l", image: matchaImage },
  { name: "Iced Coconut", description: "Matcha trifft Kokos – cremig & erfrischend", price: "6,90 €", size: "0,3 l", image: matchaImage },
  { name: "Iced Mango", description: "Süße Mango trifft kräftigen Matcha", price: "6,90 €", size: "0,3 l", image: matchaImage },
  { name: "Iced Lotus", description: "Karamellige Lotus-Note mit Matcha", price: "7,50 €", size: "0,3 l", image: matchaImage, signature: true },
  { name: "Iced Pistachio", description: "Cremige Pistazie trifft Matcha", price: "7,50 €", size: "0,3 l", image: matchaImage, signature: true },
];

export const coffees = [
  ["Cafe Crema", "3,00 €"], ["Espresso", "2,00 €"], ["Espresso Macchiato", "2,50 €"],
  ["Cappuccino", "3,60 €"], ["Flat White", "3,60 €"], ["Cafe Latte", "3,60 €"],
  ["Hot Chocolate", "3,50 €"], ["Extra Flavor", "+ 0,60 €"],
];

export const acais = [
  { name: "Lotus Açaí", description: "Lotus Creme · Lotus Crumbles", image: acaiImage },
  { name: "Pistachio Açaí", description: "Pistaziencreme · Pistazienflocken", image: acaiImage },
  { name: "Bueno Açaí", description: "Bueno Creme · Haselnüsse", image: acaiImage },
  { name: "Cookie Açaí", description: "Oreo Creme · Cookie Crumbles", image: acaiImage },
  { name: "Snickers Açaí", description: "Erdnussbutter · Snickers", image: acaiImage },
  { name: "Brownie Açaí", description: "Chocolate Sauce · Brownie-Stücke", image: acaiImage },
  { name: "Tropical Açaí", description: "Mangopüree · Kokosflocken", image: acaiImage },
  { name: "White Chocolate Açaí", description: "White Chocolate Creme · Flakes", image: acaiImage },
];

export const iceBurgerImage = sandwichImage;
export const wrapImage = sandwichImage;
