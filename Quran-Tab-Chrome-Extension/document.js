import {
  fetchUserData,
  playAdhanInOffscreen,
  shouldFireAlarm,
  stopAdhanInOffscreen,
} from "./utils.js";

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
  if (message.type === "play-adhan") {
    const prayerKey = message.data.name.split("-")[0];
    const userData = fetchUserData();

    if (userData && shouldFireAlarm(message.data.scheduledTime)) {
      playAdhanInOffscreen(prayerKey, userData);
    }
  } else if (message.type === "stop-adhan") {
    stopAdhanInOffscreen();
  } else {
    // eslint-disable-next-line no-console
    console.log("Unknown message type", message);
  }
}
