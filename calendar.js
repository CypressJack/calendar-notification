const fs = require("fs");
const colors = require('colors');
const readline = require("readline");
const { google } = require("googleapis");
const { builtinModules } = require("module");
const WindowsToaster = require("node-notifier").WindowsToaster;
const schedule = require("node-schedule");
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "./dependancies/token.json";

var notifier = new WindowsToaster({
  withFallback: false, // Fallback to Growl or Balloons?
  customPath: undefined, // Relative/Absolute path if you want to use your fork of SnoreToast.exe
});

function makeNotifications() {
  console.clear();
  // Load client secrets from a local file.
  fs.readFile("./dependancies/credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
  });
}

makeNotifications();
setInterval(makeNotifications, 300000);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const events = res.data.items;
      if (events.length) {
        let eventToday = 0;
        var today = new Date();
        var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + " " + time;
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          const formattedDate = start.slice(0, 10);
          const formattedTime = start.slice(11, 20);
          const year = parseInt(formattedDate.slice(0, 4), 10);
          const month = parseInt(formattedDate.slice(5, 7), 10);
          const day = parseInt(formattedDate.slice(8, 10), 10);
          const hours = parseInt(formattedTime.slice(0, 2), 10);
          const minutes = parseInt(formattedTime.slice(3, 5), 10);
          const dateTime = `${formattedDate} ${formattedTime}`;
          const dateAndSummary = `${dateTime}${event.summary}`;
          if (formattedDate === date) {
            eventToday = 1;
            const minutesBefore = 15;
            var meeting = new Date(year, month - 1, day, hours, minutes, 0);
            var notification = new Date();
            notification.setTime(meeting.getTime() - (minutesBefore * 60 * 1000));
            if (notification > today) {
              console.log(`\n---------\n`, `\n${event.summary}`.brightGreen, `${meeting.toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST`.brightCyan);
              console.log('Scheduled Notification Time'.brightBlue, notification.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).brightGreen, "PST".brightGreen);
              const job = schedule.scheduleJob(notification, function(){
                console.log('scheduler triggered');
                notifier.notify(
                  {
                    title: event.summary, // String. Required
                    message: "Happens in 15 minutes", // String. Required if remove is not defined
                    icon: "./dependancies/calendar-logo.png", // String. Absolute path to Icon
                    sound: true, // Bool | String (as defined by http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx)
                    id: 88888, // Number. ID to use for closing notification.
                    appID: "Google Calendar", // String. App.ID and app Name. Defaults to no value, causing SnoreToast text to be visible.
                    remove: undefined, // Number. Refer to previously created notification to close.
                    install: undefined, // String (path, application, app id).  Creates a shortcut <path> in the start menu which point to the executable <application>, appID used for the notifications.
                  },
                  function (error, response) {
                    console.log(response);
                  }
                );
              });
            } else {
              console.log(`\n---------\n`, `\n${event.summary}`.brightGreen, `${meeting.toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST`.brightRed);
              console.log(`Notification has already happened`.yellow);
            }
          }
        });
      if (eventToday === 0) {
        console.log('No events scheduled for today so far');
      }
      } else {
        console.log("No upcoming events found.");
      }
    }
  );
}

