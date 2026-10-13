import { describe, expect, test } from "bun:test";
import { acais, acaiOptions, bowls, bowlSteps, coffeeExtra, coffees, iceBurgers, matchas, milkOptions, parseMenuPrice, wraps } from "./menu-data";

describe("Original-Speisekarte", () => {
  test("alle sechs Signature Bowls behalten beide Originalpreise", () => {
    expect(bowls.map(item => [item.name, item.small, item.large])).toEqual([
      ["Y's Bowl", "10,90 €", "13,90 €"], ["J's Bowl", "10,90 €", "13,90 €"],
      ["Bulgur Blizz Bowl", "10,90 €", "13,90 €"], ["Midori Ebi Bowl", "11,50 €", "14,30 €"],
      ["Falafel Exotica Bowl", "10,90 €", "12,90 €"], ["Aloha Bowl", "10,90 €", "13,90 €"],
    ]);
  });
  test("High Protein umfasst die drei Chicken Bowls der Vorlage", () => {
    expect(bowls.filter(item => item.filters.includes("High Protein")).map(item => item.name)).toEqual(["Y's Bowl", "J's Bowl", "Bulgur Blizz Bowl"]);
  });
  test("Nährwerte bleiben größenabhängig", () => {
    expect(bowls[0]?.nutrition.small).toEqual({ k: 484, f: 15.7, c: 66.6, z: 4.95, p: 19.3, b: 4 });
    expect(bowls[0]?.nutrition.large).toEqual({ k: 885, f: 29.8, c: 117.8, z: 9.83, p: 36.9, b: 7.1 });
  });
  test("acht Açaí Specials kosten jeweils 11,90 Euro", () => {
    expect(acais.map(item => item.price)).toEqual(Array(8).fill("11,90 €"));
    expect(acaiOptions).toEqual(["Chia", "Granola"]);
    expect(acais[0]?.ingredients).toEqual(["Lotus Creme", "Chia oder Granola", "Erdnussbutter", "Erdbeeren", "Heidelbeeren", "Lotus Crumbles"]);
  });
  test("Matcha enthält Hot Matcha und die Originalpreise", () => {
    expect(matchas.map(item => [item.name, item.price])).toEqual([["Iced Strawberry", "6,90 €"], ["Iced Coconut", "6,90 €"], ["Iced Mango", "6,90 €"], ["Iced Lotus", "7,50 €"], ["Iced Pistachio", "7,50 €"], ["Hot Matcha", "5,50 €"]]);
    expect(milkOptions).toEqual(["Milk", "Oat Milk", "Coconut Milk"]);
  });
  test("Kaffee enthält sieben Getränke und Extra Flavor für 0,60 Euro", () => {
    expect(coffees).toEqual([["Cafe Crema", "3,00 €"], ["Espresso", "2,00 €"], ["Espresso Macchiato", "2,50 €"], ["Cappuccino", "3,60 €"], ["Flat White", "3,60 €"], ["Cafe Latte", "3,60 €"], ["Hot Chocolate", "3,50 €"]]);
    expect(parseMenuPrice("3,60 €") + parseMenuPrice(coffeeExtra.price)).toBeCloseTo(4.2);
  });
  test("Ice Burger kosten 4 Euro und Chicken Wrap 8,90 Euro", () => {
    expect(iceBurgers.map(item => [item.name, item.price])).toEqual([["Peeka Pistachio", "4,00 €"], ["Peeka Lotus", "4,00 €"], ["Peeka Bueno", "4,00 €"]]);
    expect(wraps[0]?.price).toBe("8,90 €");
  });
  test("Baukasten enthält sechs Schritte mit den Original-Inklusivmengen", () => {
    expect(bowlSteps.map(step => step.included)).toEqual([null, null, 3, 1, 1, 1]);
    expect(bowlSteps.filter(step => step.seasonal).map(step => step.title)).toEqual(["Veggies", "Specials"]);
  });
});