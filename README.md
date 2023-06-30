# RBX_Spot-Plugin
Roblox Studio plugin designed to show you're currently playing song during development

Appears as a small widget which can be docked anywhere, with the smallest size being 300x400

Shows the current song's title, artists, cover photo, and optionally lyrics *see below*

# Installation
Download [NodeJS](https://nodejs.org/en) which is used for hosting the server locally to manage cover photos, lyrics, and authentication

### NodeJS Package Dependencies
[axios](https://axios-http.com/docs/intro) `Used to send requests to the spotify API`

[express](https://expressjs.com/) `Used to run the server locally`

[create-desktop-shortcuts](https://www.npmjs.com/package/create-desktop-shortcuts) `Hacky method in order to run spotify URI's (*Opens spotify app whenever you click on an artist or title*)`

[fast-average-color-node](https://www.npmjs.com/package/fast-average-color-node?activeTab=readme) `Used to extract dominant color from cover photo, used in some elements for the widget`

[dotenv](https://www.npmjs.com/package/dotenv) `Used to load the .env file, which stores private information like api key`

[puppeteer](https://pptr.dev/) `Used to login to spotify to retrieve lyrics, if enabled in settings.`

### Command to install all packages at once
`npm i puppeteer dotenv fast-average-color-node create-desktop-shortcuts axios`

# Setup
### Files
1. Create a empty folder which will hold all the files.
2. Navigate to the new folder, and copy the installed files into it
3. Edit settings.js to modify 2 settings to your preferences

### Spotify API
1. Go to [Spotify Developer](https://developer.spotify.com/dashboard) and log in, creating an account if asked to
2. Press Create App to the right side of the screen
3. Enter whatever for the name, description, and leave website blank
4. For the 'Redirect URI' enter the url 'http://localhost:PORT/callback'
5. Accept the terms and create the bot
6. Edit the bot again after creation and copy the 'Client ID' and 'Client Secret'
7. Copy these values and paste them in the .env file; *make sure you scroll down*

Your .env file should look like this

```
CLIENT_ID=456....
CLIENT_SECRET=123....
```

### Finishing steps
You are now complete with all the steps needed

Whenever you want to use the plugin, navigate to the folder you dedicated and open a terminal there

Run the command `node index.js` to start the server, then navigate to the link outputted and authenticate

Press 'Connect to Spotify' in the widget when completed

# Known Bugs
Having to re-authenticate every ~1 hour; Working on a fix soon
