const path = require("path");
const { openTab, delay, safely } = require("./browser");
const { scoped } = require("../logger");

const log = scoped("map");

/**
 * Fetches a route summary (duration, distance, road names, and a note about
 * traffic) plus a screenshot of the rendered route from Google Maps.
 * Returns null (rather than throwing) if Maps' DOM has changed underneath
 * us, so a broken map never takes down the whole comparison request.
 */
async function getMap(source, destination, browserInstance, screenshotPath) {
  return safely(
    "map.getMap",
    async () => {
      const tab = await openTab(browserInstance);
      await tab.goto("https://www.google.com/maps", { waitUntil: "networkidle2" });

      await tab.waitForSelector("button[aria-label='Directions']", { visible: true });
      await tab.click("button[aria-label='Directions']");

      await tab.waitForSelector("#sb_ifc51", { visible: true });
      await tab.type("#sb_ifc51", source, { delay: 150 });
      await Promise.all([
        tab.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
        tab.keyboard.press("Enter"),
      ]);

      await tab.type("#sb_ifc52", destination, { delay: 150 });
      await Promise.all([
        tab.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
        tab.keyboard.press("Enter"),
      ]);

      await tab.waitForSelector(".section-directions-trip.clearfix", { visible: true });

      const summaryLines = await tab.evaluate(() => {
        const el = document.querySelector("#section-directions-trip-0");
        return el ? el.innerText.split("\n") : [];
      });

      await delay(3000);
      if (screenshotPath) {
        await tab.screenshot({
          path: screenshotPath,
          clip: { x: 410, y: 0, width: 960, height: 650 },
        });
      }
      await tab.close();

      const [duration, distance, route, trafficNote] = summaryLines;
      const result = {
        duration: duration || "Unavailable",
        distance: distance || "Unavailable",
        route: route || "Unavailable",
        trafficNote: trafficNote || "",
        screenshotFile: screenshotPath ? path.basename(screenshotPath) : null,
      };

      log.info("Fetched route summary", result);
      return result;
    },
    {
      duration: "Unavailable",
      distance: "Unavailable",
      route: "Unavailable",
      trafficNote: "",
      screenshotFile: null,
    }
  );
}

module.exports = { getMap };
