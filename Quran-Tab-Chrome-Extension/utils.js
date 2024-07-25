let adhanAudio;

const ADHAN_VOICES_ARRAY = [
  "adhan-abdulbasit-abdusamad",
  "adhan-abul-ainain-shuaisha",
  "adhan-ali-ibn-ahmad-mala",
  "adhan-mahmoud-ali-al-banna",
  "adhan-muhammad-refaat",
  "adhan-mustafa-ismail",
  "adhan-nasser-al-qatami",
  "adhan-nasr-eldin-tobar",
];

const getRandomAdhanVoice = () => {
  return ADHAN_VOICES_ARRAY[Math.floor(Math.random() * ADHAN_VOICES_ARRAY.length)];
};

const ARABIC_PRAYER_TIMES = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

let creating; // A global promise to avoid concurrency issues

async function createOffscreen() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL("offscreen.html");
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "testing",
    });
    await creating;
    creating = null;
  }
}

export const sendMessageToOffscreen = async (type, data) => {
  await createOffscreen();
  chrome.runtime.sendMessage({
    target: "offscreen",
    type,
    data,
  });
};

export const stopAdhanMessageInOffscreen = () => sendMessageToOffscreen("stop-adhan");

export const getNotificationMessage = (label, language) => {
  if (label) {
    if (language === "ar") {
      return `حان الان موعد أذان ${ARABIC_PRAYER_TIMES[label]} 🕌`;
    }

    return `It's ${label} time 🕌`;
  }

  if (language === "ar") {
    return "حان وقت الصلاة 🕌";
  }

  return "It's prayer time 🕌";
};

export const shouldFireAlarm = scheduledTime => {
  const alarmTime = new Date(scheduledTime).getTime();
  const currentTime = new Date().getTime();
  const MARGIN_TIME_IN_MINUTES = 5 * 60 * 1000; // convert 5 minutes to milliseconds

  return currentTime - alarmTime <= MARGIN_TIME_IN_MINUTES;
};

export const createNotification = (message, isRequireInteraction) => {
  chrome.notifications.create(
    "setPrayerAlarms",
    {
      type: "basic",
      title: "Quran Tab",
      message,
      requireInteraction: isRequireInteraction,
      iconUrl: "icon.png",
    },
    () => {
      // eslint-disable-next-line no-console
      console.log("Notification created");
    },
  );
};

export const fetchUserData = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "");
  } catch {
    /* proceed with no ops */
  }
  return false;
};

export const stopAdhanInOffscreen = () => {
  console.log("Stop Audio");

  if (adhanAudio) {
    adhanAudio.pause();
    adhanAudio.src = "";
  }
};

export const playAdhanInOffscreen = (label, userData) => {
  const { adhanAudioLevel } = userData;
  const shouldPlayAudio = userData && userData.selectedAdhanVoice !== "no-audio";
  const prayerReminderType = userData && userData.settings.prayerReminderType;

  const OFF = "off";
  const SHORT_REMINDER = "shortReminder";
  const FULL_ADHAN = "fullAdhan";

  if (shouldPlayAudio && prayerReminderType !== OFF) {
    console.log("Play Audio");

    if ((!adhanAudio || adhanAudio.paused) && prayerReminderType === FULL_ADHAN) {
      if (userData.selectedAdhanVoice === "shuffle-adhans")
        adhanAudio = new Audio(`./data/adhan/${getRandomAdhanVoice()}.mp3`);
      else adhanAudio = new Audio(`./data/adhan/${userData.selectedAdhanVoice}.mp3`);

      adhanAudio.volume = adhanAudioLevel;
      adhanAudio.play();
    }
    // if we used else here: the two sound will be played!
    if ((!adhanAudio || adhanAudio.paused) && prayerReminderType === SHORT_REMINDER) {
      adhanAudio = new Audio(`./data/reminder/${label}.mp3`);
      adhanAudio.volume = adhanAudioLevel;
      adhanAudio.play();
    }
  }
};

export const clearPrayerAlarms = () => {
  chrome.alarms.clearAll();
};

export const setPrayerAlarms = userData => {
  const prayerTimesObject = { ...userData.prayerTimesObject };
  if (prayerTimesObject) {
    clearPrayerAlarms();
    delete prayerTimesObject.sunrise;
    Object.entries(prayerTimesObject).forEach(item => {
      chrome.alarms.create(`${item[0]}-${userData.settings.selectedLanguageKey}`, { when: item[1].timeValue });
    });
  }
};

export const fireAlarm = alarm => {
  // Play Adhan in offscreen
  sendMessageToOffscreen("play-adhan", alarm);

  // Show Notification
  const prayerKey = alarm.name.split("-")[0];
  const selectedLanguage = alarm.name.split("-")[1];
  const message = getNotificationMessage(prayerKey, selectedLanguage);

  if (shouldFireAlarm(alarm.scheduledTime)) {
    createNotification(message, true);
  }
};
