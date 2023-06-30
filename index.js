const {SpotifyClient} = require("./spotify")

const settings = require('./settings')
const express = require('express')
const QueryString = require('querystring')

const client = new SpotifyClient()
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.listen(settings.Port, () => {
  console.log("To authenticate, visit this link: http://localhost:" + settings.Port + "/oauth2") 
})

app.get("/oauth2", async (req, res) => {
  let response = await client.getLyricsToken()
  
  res.redirect(settings.endpoints.oauth + "?" + 
    QueryString.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: settings.scopes.join(" "),
      redirect_uri: "http://localhost:" + settings.Port + "/callback",
      state: client.generateState(),
      show_dialog: true
    }));
});

app.get('/callback', async(req, res) => {
  let params = client.getUrlParams(req)
  // [0] = code; [1] = state;

  if (params[1] !== client.currentState()) {
    res.status(403).json({ response: "Invalid authorization state; Please retry at http://localhost:" + settings.Port + "/oauth2" })
  } else {
    await client.login(params[0])

    res.redirect("/status")
  }
});

app.get("/status", (req, res) => {
  let responseData = {
    loggedIn: client.isLoggedIn(),
    currently_playing: {},
    song_playing: false
  }

  client.getPlayingSong().then((data) => {
    if (!data.response && data.status == 200 ) {
      responseData.currently_playing = data.data;
      responseData.song_playing = true;
    } else {
      responseData.currently_playing = undefined
      responseData.error = data.data.error
    }

    console.log(data.data)
    
    res.status(data.status).json(responseData)
  })
})

app.post("/openURI", async (req, res) => {
  client.runSpotifyURI(req.body.URI)

  res.status(200).json({response: "OK"})
})

app.get("/lyrics", async (req, res) => {
  if (!settings.LyricsEnabled) {
    res.status(404).send("Lyrics disabled in settings")
  } else if (client.getPlayingSong(true) === undefined) {
    res.status(404).send("No song playing")
  } else {
    let lyrics = await client.getSongLyrics()

    if (lyrics[0] !== undefined) {
      res.status(200).send(lyrics[0])
    } else {
      res.status(404).send(lyrics[1])
    }
  }
 })

app.post("/import", async (req, res) => {
  
})

app.post("/skip", (req, res) => {
  client.skipSong(req.body.direction)

  res.status(200).json({response: "OK"})
})

app.put("/seek", (req, res) => {
  client.seek(req.body.seek_ms)

  res.status(200).json({response: "OK"})
})

