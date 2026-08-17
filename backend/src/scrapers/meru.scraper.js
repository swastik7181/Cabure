const { openTab, delay, safely } = require("./browser");
const { scoped } = require("../logger");

const log = scoped("meru");

const NOT_AVAILABLE = "NOT AVAILABLE";

/**
 * Fetches Meru's estimated fares. Meru only quotes Hatchback/Sedan/SUV on
 * its homepage widget, so Bike/Auto are reported as unavailable, matching
 * the original behaviour.
 */
async function getMeru(source, destination, browserInstance) {
  const fallback = [
    { Type: "Bike", Fare: NOT_AVAILABLE },
    { Type: "Auto", Fare: NOT_AVAILABLE },
    { Type: "Hatchback", Fare: NOT_AVAILABLE },
    { Type: "Sedan", Fare: NOT_AVAILABLE },
    { Type: "SUV", Fare: NOT_AVAILABLE },
  ];

  return safely(
    "meru.getMeru",
    async () => {
      const tab = await openTab(browserInstance);
      await tab.goto("https://www.meru.in/", { waitUntil: "domcontentloaded" });

      await tab.waitForSelector("#select2-chosen-1", { visible: true });
      await tab.click("#select2-chosen-1");
      await delay(1000);
      await tab.type("#s2id_autogen1_search", `   ${destination}`, { delay: 150 });
      await delay(1500);
      await tab.keyboard.press("Enter");

      await safely("meru.dismissDropMask1", async () => tab.click("#select2-drop-mask"));

      await tab.waitForSelector("#select2-chosen-2", { visible: true });
      await tab.click("#select2-chosen-2");
      await delay(1000);
      await tab.type("#s2id_autogen2_search", source, { delay: 150 });
      await delay(1500);
      await tab.keyboard.press("Enter");

      await safely("meru.dismissDropMask2", async () => tab.click("#select2-drop-mask"));

      await tab.waitForSelector(".swap_location", { visible: true });
      await tab.click(".swap_location");

      await tab.waitForSelector(".fare_sedan .fare_cost", { visible: true });

      const rawFares = await tab.evaluate(() =>
        Array.from(document.querySelectorAll(".fare_cost")).map((el) => el.innerText)
      );
      await tab.close();

      // Meru's widget lists [hatchback, sedan, suv] in that order; each
      // entry looks like "₹ 1200-1400", so take the lower bound.
      const parsed = rawFares.slice(0, 3).map((text) => {
        const match = text.match(/([\d,]+)/);
        return match ? match[1].replace(/,/g, "") : null;
      });

      const [hatchback, sedan, suv] = parsed;

      const details = [
        { Type: "Bike", Fare: NOT_AVAILABLE },
        { Type: "Auto", Fare: NOT_AVAILABLE },
        { Type: "Hatchback", Fare: hatchback ?? NOT_AVAILABLE },
        { Type: "Sedan", Fare: sedan ?? NOT_AVAILABLE },
        { Type: "SUV", Fare: suv ?? NOT_AVAILABLE },
      ];

      log.info("Fetched Meru fares", details);
      return details;
    },
    fallback
  );
}

module.exports = { getMeru };
