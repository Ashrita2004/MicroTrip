import * as Notifications from "expo-notifications";

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    console.log("Notification permission not granted.");
    return false;
  }

  return true;
}

export async function scheduleTripNotifications(timeBudget: number) {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return;
  }

  // Cancels any old trip notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const notifications: {
    minutesBeforeEnd: number;
    title: string;
    body: string;
  }[] = [];

  // for deciding which reminders to send
  if (timeBudget >= 60) {
    notifications.push({
      minutesBeforeEnd: 20,
      title: "Return soon",
      body: "You have 20 minutes left. Start wrapping up your Local Hour.",
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
  } else if (timeBudget >= 45) {
    notifications.push({
      minutesBeforeEnd: 15,
      title: "Return soon",
      body: "You have 15 minutes left. Start wrapping up your Local Hour.",
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
  } else if (timeBudget >= 25) {
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
  } else {
    notifications.push({
      minutesBeforeEnd: 5,
      title: "Return now",
      body: "Only 5 minutes left. Time to head back!",
    });
  }

  // Schedule each notification
  for (const notification of notifications) {
    const secondsFromNow = (timeBudget - notification.minutesBeforeEnd) * 60;
    //const secondsFromNow = notifications.indexOf(notification) * 10 + 10; used during testing purpose
    if (secondsFromNow > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 ${notification.title}`,
          body: notification.body,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
        },
      });
    }
  }

  console.log("Trip notifications scheduled.");
}

export async function cancelTripNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("Trip notifications cancelled.");
}
