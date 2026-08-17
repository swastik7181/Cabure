const config = require("../config");
const { openTab, delay, safely } = require("./browser");
const { scoped } = require("../logger");

const log = scoped("uber");

// Uber's price-estimate page groups products under human labels. We map the
// labels we care about to the vehicle categories Caburé reports on.
const PRODUCT_LABEL_TO_TYPE = {
  Moto: "Bike",
  UberAuto: "Auto",
  UberGo: "Hatchback",
  Premier: "Sedan",
  UberXL: "SUV",
};

function parseFareText(text) {
  // Fare lines look like "UberGo\n₹123-₹150" or "UberGo\n₹123". Grab the
  // first rupee amount and strip thousands separators.
  const match = text.match(/₹\s?([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

/**
 * Fetches Uber's live price estimate for a trip. Returns an array of
 * { Type, Fare } entries; any vehicle type Uber didn't show is reported as
 * "NOT AVAILABLE" rather than being silently dropped, so the frontend table
 * always has five aligned rows per provider.
 */
async function getUber(source, destination, browserInstance) {
  const emptyResult = Object.values(PRODUCT_LABEL_TO_TYPE).map((Type) => ({
    Type,
    Fare: "NOT AVAILABLE",
  }));

  return safely(
    "uber.getUber",
    async () => {
      const tab = await openTab(browserInstance);
      await tab.goto("https://www.uber.com/in/en/price-estimate/", {
        waitUntil: "domcontentloaded",
      });

      await tab.waitForSelector("input[name='destination']", { visible: true });
      await tab.type("input[name='destination']", destination, { delay: 250 });
      await tab.keyboard.press("Enter");
      await delay(config.scrapeStepDelayMs);

      await tab.waitForSelector("input[name='pickup']", { visible: true });
      await tab.type("input[name='pickup']", source, { delay: 250 });
      await delay(config.scrapeStepDelayMs);
      await tab.keyboard.press("Enter");
      await delay(config.scrapeStepDelayMs);

      // Uber sometimes re-prompts for the destination after the pickup is
      // confirmed; retype it defensively, same as the original flow.
      await safely("uber.reconfirmDestination", async () => {
        await tab.type("input[name='destination']", destination, { delay: 250 });
        await tab.keyboard.press("Enter");
      });
      await delay(config.scrapeStepDelayMs);

      await tab.waitForSelector(".pe-products-item", { visible: true });

      const rawItems = await tab.evaluate(() =>
        Array.from(document.querySelectorAll(".pe-products-item")).map(
          (el) => el.innerText
        )
      );

      const seen = new Set();
      const details = [];
      for (const raw of rawItems) {
        const [label, fareLine] = raw.split("\n");
        const type = PRODUCT_LABEL_TO_TYPE[label];
        if (!type || seen.has(type)) continue;
        const fare = parseFareText(fareLine || "");
        details.push({ Type: type, Fare: fare === null ? "NOT AVAILABLE" : String(fare) });
        seen.add(type);
      }

      await tab.close();

      // Fill in any vehicle types Uber didn't return so the table stays aligned.
      for (const type of Object.values(PRODUCT_LABEL_TO_TYPE)) {
        if (!details.some((d) => d.Type === type)) {
          details.push({ Type: type, Fare: "NOT AVAILABLE" });
        }
      }

      log.info("Fetched Uber fares", details);
      return details;
    },
    emptyResult
  );
}

module.exports = { getUber };
