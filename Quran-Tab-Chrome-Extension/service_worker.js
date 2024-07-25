import { clearPrayerAlarms, fireAlarm, setPrayerAlarms, stopAdhanMessageInOffscreen } from "./utils.js";

const onReceiveMessage = async ({ name, userData }) => {
  switch (name) {
    case "setPrayerAlarms":
      if (userData && userData.settings.prayerTimesFlag !== false) setPrayerAlarms(userData);
      break;
    case "clearPrayerAlarms":
      clearPrayerAlarms();
      break;
    case "stopAdhan":
      await stopAdhanMessageInOffscreen();
      break;
    default:
      // eslint-disable-next-line no-console
      console.log("Unknown message type", name);
  }
};

chrome.runtime.onMessage.addListener(onReceiveMessage);

chrome.alarms.onAlarm.addListener(fireAlarm);

chrome.notifications.onClicked.addListener(stopAdhanMessageInOffscreen);

chrome.notifications.onClosed.addListener(stopAdhanMessageInOffscreen);

chrome.runtime.setUninstallURL("https://quran-uninstall.vercel.app/");
