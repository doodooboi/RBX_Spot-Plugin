/*

In order to get the lyrics you have to login with your real spotify login, since there is not offical API
When enabled, it will open a browser (hidden) and login to spotify automatically, retrieving the token

No data gets read or sent from your profile

Make sure to set SPOTIFY_USERNAME and SPOTIFY_PASSWORD in the .env file
*/

exports.LyricsEnabled = true
exports.Port = 8080 // Port which the server runs on


// dont edit
exports.endpoints = {
  currently_playing: "me/player/currently-playing",
  resume: "me/player/play",
  pause: "me/player/pause",
  skip_next: "me/player/next",
  skip_previous: "me/player/previous",
  seek: "me/player/seek",
  set_repeat: "me/player/repeat",
  set_volume: "me/player/volume",
  set_shuffle: "me/player/shuffle",
  audio_analysis: "audio-analysis/",
  get_queue: "me/player/queue",
  lyric_api: "https://spclient.wg.spotify.com/color-lyrics/v2/track/",
  oauth: "https://accounts.spotify.com/authorize",
  token: "https://accounts.spotify.com/api/token",
  
}

exports.scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "user-follow-read",
  "user-read-currently-playing",
  "user-read-playback-position",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read"
]