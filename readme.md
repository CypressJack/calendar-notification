# Windows Desktop Calendar Notifications
## About
This NodeJS command line app is designed to monitor ones google calendar, and update node scheduler to send out a native windows desktop notification 15 minutes before an event.
## Required Files
To get this working, one needs to create a google cloud project and follow the steps to setting up Oauth and creating a credentials.json file. This file is to be placed in the 'dependancies' folder. Once added you can run the app with 'node calendar.js' and it will prompt you to log into the google account you'd like to use. This will generate a token.js file which will need to be in the dependancies folder after it is created. That's it! Just use 'node calendar.js' to run the script and monitor your calendar, it will make API calls every 5 minutes to keep your notifications up to date.
