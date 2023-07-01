# RBX_Spot-Plugin
Roblox Studio plugin designed to show your currently playing song during development

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

[puppeteer](https://pptr.dev/) `Used to login to spotify to retrieve lyrics, if enabled in settings`

### Command to install all packages at once
`npm i puppeteer dotenv fast-average-color-node create-desktop-shortcuts axios express`

# Setup
### Files
1. Create a empty folder which will hold all the files.
2. Navigate to the new folder, and copy the installed files into it
3. Create a new file called exactly `.env`, just that and no name (see below)
4. Edit settings.js to your preferences

#### .env
Paste this into your .env
```
# Do not share this file; It may contain your real password and username to spotify; if provided

CLIENT_ID=
CLIENT_SECRET=

SPOTIFY_USERNAME=""
SPOTIFY_PASSWORD=""
```

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

If you changed the Port in the settings.js, make sure to change the port when connecting in the widget

Press 'Connect to Spotify' in the widget when completed

# Lyrics
In order to get lyrics for a song, you must include your Spotify password and username in the .env file and set LyricsEnabled to true in settings.js

The reasoning for this is that Spotify has no official API for retrieving these lyrics. Thus I use a undocumented spotify API, which I found off a [Stack Overflow](https://stackoverflow.com/questions/73704499/get-lyrics-data-from-spotify) post.

It logs into Spotify in order to retrieve an access token. This token is only used for the lyric API as it requires authentication. No data is read or modified from your account

I cannot use MusixMatch as their API is paid, and other solutions are the same, or not as accurate.

# Content
Images and lyrics are all downloaded at runtime. Whenever you listen to a song and there is no cover photo or lyrics saved. It will download it from spotify and cache it in the content folder.

The amount of space used is very minimal, with my machine only taking up 47 MB in total for 1,360 images and 161 lyrics

# Disclaimer
Currently this repo is used for holding all the code, but this is not release-worthy yet.

Any code you download right now is not the final version and is mostly in a debugging state

If you wish to use this, you may download it right now and it will work like intended with some bugs and output info

# Known Bugs
1. Having to re-authenticate every ~1 hour
2. Ratelimiting every once in a while for a long time
3. Being able to click non-visible buttons in the widget
4. Not being able to connect when logged in but no song playing

# Todo
1. Add option to widget to specify what port to use
2. Clean up the code and optimize it
3. Polish the widget interface and other things
4. Add more error handling and notifications 
