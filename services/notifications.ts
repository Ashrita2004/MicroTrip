import * as Notifications from "expo-notifications";

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    console.log("Notification permission not granted.");
    return false;
  }

  return true;
}

export async function scheduleTripNotifications(tripEndTime: number) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return;
  }

  // for removing notifications from any previous trip
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();

  const notifications: {
    minutesBeforeEnd: number;
    title: string;
    body: string;
  }[] = [];

  const timeRemaining = Math.ceil((tripEndTime - now) / 60000);

  if (timeRemaining >= 60) {
    notifications.push({
      minutesBeforeEnd: 20,
      title: "Return soon",
      body: "You have 20 minutes left. Can sit a little longer.",
    });

    notifications.push({
      minutesBeforeEnd: 10,
      title: "Return soon",
      body: "Only 10 minutes left. It's a good time to head back.",
    });

    notifications.push({
      minutesBeforeEnd: 5,
      title: "Return now",
      body: "Only 5 minutes left. Time to head back!",
    });
  } else if (timeRemaining >= 45) {
    notifications.push({
      minutesBeforeEnd: 15,
      title: "Return soon",
      body: "You have 15 minutes left. Start wrapping up.",
    });

    notifications.push({
      minutesBeforeEnd: 10,
      title: "Return soon",
      body: "Only 10 minutes left. It's a good time to head back.",
    });

    notifications.push({
      minutesBeforeEnd: 5,
      title: "Return now",
      body: "Only 5 minutes left. Time to head back!",
    });
  } else if (timeRemaining >= 25) {
    notifications.push({
      minutesBeforeEnd: 10,
      title: "Return soon",
      body: "You have 10 minutes left. Start heading back soon.",
    });

    notifications.push({
      minutesBeforeEnd: 5,
      title: "Return now",
      body: "Only 5 minutes left. Time to head back!",
    });
  } else if (timeRemaining > 5) {
    notifications.push({
      minutesBeforeEnd: 5,
      title: "Return now",
      body: "Only 5 minutes left. Time to head back!",
    });
  }

  for (const notification of notifications) {
    const triggerTime = tripEndTime - notification.minutesBeforeEnd * 60 * 1000;

    // Only schedule notifications that are still in the future
    if (triggerTime <= Date.now()) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${notification.title}`,
        body: notification.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTime),
      },
    });

    console.log(
      `Scheduled ${notification.minutesBeforeEnd}-minute reminder for`,
      new Date(triggerTime).toLocaleTimeString(),
    );
  }

  console.log("Trip notifications scheduled.");
}

export async function cancelTripNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Trip notifications cancelled.");
}
