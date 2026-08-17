const config = require("../config");
const { openTab, delay, safely } = require("./browser");
const { scoped } = require("../logger");

const log = scoped("ola");

// Ola doesn't expose a public price-estimate page, so — as in the original
// project — we go through taxifarefinder.com's per-category estimator pages.
// NOTE: these URLs are hardcoded to Delhi/Mathura categories on
// taxifarefinder.com; swap them for the categories relevant to your city.
const CATEGORY_LINKS = [
  { Type: "Bike", url: "https://www.taxifarefinder.com/main.php?city=Ola-Bike-Delhi" },
  { Type: "Auto", url: "https://www.taxifarefinder.com/main.php?city=Ola-Auto-Delhi-India" },
  { Type: "Hatchback", url: "https://www.taxifarefinder.com/main.php?city=Ola-Mini-Delhi-India" },
  { Type: "Sedan", url: "https://www.taxifarefinder.com/main.php?city=Ola-Sedan-Mathura-India" },
  { Type: "SUV", url: "https://www.taxifarefinder.com/main.php?city=Ola-Prime-SUV-Delhi" },
];

function parseFareText(text) {
  const match = text.match(/₹\s?([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

async function getFareForCategory(browserInstance, url, source, destination) {
  return safely(`ola.getFareForCategory(${url})`, async () => {
    const tab = await openTab(browserInstance);
    await tab.goto(url, { waitUntil: "domcontentloaded" });

    await tab.waitForSelector("#fromAddress", { visible: true });
    await tab.type("#fromAddress", source, { delay: 100 });
    await delay(config.scrapeStepDelayMs);
    await tab.keyboard.press("Enter");

    await tab.waitForSelector("#toAddress", { visible: true });
    await tab.type("#toAddress", destination, { delay: 100 });
    await delay(config.scrapeStepDelayMs);
    await tab.keyboard.press("Enter");

    await delay(config.scrapeStepDelayMs);
    await safely("ola.clickGo", async () => tab.click(".form-goButton"));

    await tab.waitForSelector(".fareValue", { visible: true });
    const fareText = await tab.evaluate(
      () => document.querySelector(".fareValue")?.innerText || ""
    );
    await tab.close();

    const fare = parseFareText(fareText);
    return fare === null ? null : String(fare);
  });
}

/**
 * Fetches Ola's estimated fare for each vehicle category by querying the
 * per-category taxifarefinder pages sequentially (the original site doesn't
 * expose one page with every category at once).
 */
async function getOla(source, destination, browserInstance) {
  const details = [];
  for (const category of CATEGORY_LINKS) {
    const fare = await getFareForCategory(browserInstance, category.url, source, destination);
    details.push({ Type: category.Type, Fare: fare ?? "NOT AVAILABLE" });
  }
  log.info("Fetched Ola fares", details);
  return details;
}

module.exports = { getOla };
