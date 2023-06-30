require("dotenv").config()

const GetLyricToken = require("../helpers/getLyricToken")
const createShortcut = require("create-desktop-shortcuts")
const average_color = require("fast-average-color-node")
const settings = require('../settings')
const crypto = require("crypto")
const axios = require('axios');
const fs = require('fs');
const os = require("os")

const { exec } = require("child_process");
const path = require("path")

const apiClient = axios.create({
  baseURL: "https://api.spotify.com/v1/",
  withCredentials: false,
  validateStatus: function (status) {
    return status <= 503;
  }
});

let contentFolder = path.join(__dirname, "..", "content")

let currentColorCache = {}
let savedColors = JSON.parse(fs.readFileSync(path.join(contentFolder, "colors.json")))

function hms(seconds) {
  return [3600, 60]
    .reduceRight(
      (p, b) => r => [Math.floor(r / b)].concat(p(r % b)),
      r => [r]
    )(seconds)
    .map(a => a.toString().padStart(2, '0'))
    .join(':');
}

async function getImageColor(trackID) {
  if (savedColors[trackID] || currentColorCache[trackID]) {return savedColors[trackID] || currentColorCache[trackID]}
  
  let colorData = await average_color.getAverageColor(path.join(contentFolder, "images", `${trackID}.jpeg`)).catch(() => {}) 
  if (!colorData) {return undefined}

  fs.readFile( path.join(contentFolder, "colors.json") , async function (err, data) {
    if (err) {throw err;}

    let json = JSON.parse(data);

    currentColorCache[trackID] = colorData.value

    json[`${trackID}`] = colorData.value
    fs.writeFile(path.join(contentFolder, "colors.json"), JSON.stringify(json), function(err) {if (err) throw err;});

    return colorData.value
  })
}

exports.SpotifyClient = class SpotifyClient {
  #state = ""
  #PlayingSong = {}

  #lyrics_token = null
  #access_token = null
  #refresh_token = null

  constructor() { }

  login(code) {
    return this.#callAuthorizationApi({
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": localURL + "/callback",
      "client_id": process.env.CLIENT_ID,
      "client_secret": process.env.CLIENT_SECRET
    })
  }

  refreshLogin() {
    return this.#callAuthorizationApi({
      "grant_type": "refresh_token",
      "refresh_token": this.#refresh_token,
      "client_id": process.env.CLIENT_ID,
      "client_secret": process.env.CLIENT_SECRET
    });
  }

  getSongLyrics() {
    if (this.#PlayingSong === undefined) { return [undefined, "Song not playing!"] }

    return this.#createFile(`./content/lyrics/${this.#PlayingSong.id}.json`, `${settings.endpoints.lyric_api}${this.#PlayingSong.id}?format=json&vocalRemoval=false`, "lyrics").catch((err) => {
      console.log("error", err)
    })
  }

  isLoggedIn() {
    return this.#access_token !== null
  }

  generateState() {
    this.#state = crypto.randomBytes(20).toString('hex');

    return this.#state
  }

  async importPlaylistImages(trackID) {

  }

  async getPlayingSong(immediate) {
    if (immediate) { return this.#PlayingSong }
    if (!this.#refresh_token || !this.#access_token) {
      return {status: 400, data: {error: `Not logged in; refresh: ${this.#refresh_token}; access: ${this.#access_token}`}}
    }

    let response = await this.#callEndpoint("get", settings.endpoints.currently_playing + "?market=US", null)
    let data = response.data

    if (!data) {
      this.#PlayingSong = undefined

      return { status: 404, data: { response: "Data missing from " + settings.endpoints.currently_playing } }
    } else if (!data.is_playing || !data.item || response.status != 200) {
      this.#PlayingSong = undefined

 //     console.log(response.status, !data.item, !data.is_playing)

      if (response.status >= 400) {
        console.log(response.data, response.body)

        if (response.status == 429) {
          return {status: response.status, data: {error: `Ratelimited for ${hms(response.headers["retry-after"])}`}}
        }

        return {status: response.status, data: {error: response.data.error.message}}
      }

      return { status: 204, data: {error: "No song playing" } }
    }

    let currentData = {
      ["artists"]: [],
      ["name"]: "",
      ["id"]: "",

      ["progress"]: 0,
      ["duration"]: 0,

    }

    currentData.id = data.item.id
    currentData.name = data.item.name
    currentData.progress = data.progress_ms
    currentData.duration = data.item.duration_ms

    data.item.artists.forEach((artist) => {
      currentData.artists.push({ name: artist.name, extern_url: artist.external_urls.spotify })
    })

    this.#PlayingSong = currentData

    if (data.item.album.images) {
      this.#createFile(`./content/images/${currentData.id}.jpeg`, data.item.album.images[1].url, "image").catch((err) => {
        console.log(err)
      })

      getImageColor(currentData.id).then(color => {
        currentData.color = color
      })
    }

    return { status: 200, data: currentData }
  }

  async startResumePlayback() {

  }

  async skipSong(direction) {
    if (direction == "next") {
      this.#callEndpoint("post", settings.endpoints.skip_next)
    } else if (direction == "prev") {
      this.#callEndpoint("post", settings.endpoints.skip_previous)
    }
  }

  async runSpotifyURI(URI) {
    let options = {
      name: 'temp_SpotifyURI',
      filePath: `spotify://${URI}`,
    }

    let shortcut = createShortcut({
      windows: options,
      linux: options,
      osx: options
    })

    if (shortcut) {
      let shortcutPath = path.join(os.homedir(), "Desktop", "temp_SpotifyURI.lnk")

      exec(shortcutPath)
      setTimeout(() => {
        fs.unlinkSync(shortcutPath)
      }, 500);
    } else {
      console.log("Failed to create spotify URI shortcut, maybe check permissions?")
    }
  }

  async getLyricsToken() {
    // return new Promise(async (resolve, reject) => {
    //   if (!settings.LyricsEnabled) {
    //     resolve([false, "Lyrics not enabled"])
    //     return
    //   }

    //   const browser = await puppeteer.launch({
    //     // args: [
    //     //   `--no-sandbox`,
    //     // ],
    //     headless: false
    //   });
    //   const page = await browser.newPage();

    //   await page.goto('https://accounts.spotify.com/en/login');

    //   await page.type('input[id="login-username"]', process.env.SPOTIFY_USERNAME)
    //   await page.type('input[id="login-password"]', process.env.SPOTIFY_PASSWORD)

    //   await page.setRequestInterception(true);

    //   page.on('request', interceptedRequest => {
    //     if (interceptedRequest.isInterceptResolutionHandled()) return;

    //     interceptedRequest.continue();
    //   });

    //   page.on('requestfinished', async (interceptedRequest) => {
    //     if (interceptedRequest.url().endsWith("password")) {
    //       let status = interceptedRequest.response().status()
    //       let json = await interceptedRequest.response().json()

    //       if (status >= 400 && status < 500) {
    //         browser.close()

    //         if (json.error == "errorUnknown")

    //         resolve([false, status + " Error retrieving lyrics token: Invalid username/password for spotify!"])
    //       } else if (status >= 500) {
    //         browser.close()
    //         resolve([false, "status" + " Error retrieving lyrics token: Internal server error"])
    //       } else if (status === 200) {
    //         setTimeout(async () => {
    //           await page.goto("https://open.spotify.com/get_access_token")

    //           const tokenElement = await page.waitForSelector('body > pre')
    //           const token = JSON.parse(await (await tokenElement.getProperty('innerHTML')).jsonValue())

    //           this.#lyrics_token = token.accessToken

    //           await browser.close()
    //           resolve([true, "Retrieved lyrics token!"])

    //         }, 1000);
    //       } else {
    //         await browser.close()
    //         resolve([undefined, "fell"])
    //       }

    //     }
    //   })

    //   setTimeout(() => {
    //     page.click('button[id="login-button"]')
    //   }, 500)

    // })
    this.#lyrics_token = await GetLyricToken.main()

    return [true, "worked"]
  }

  currentState() {
    return this.#state
  }

  getUrlParams(request) {
    let query = new URL(this.#getRequestUrl(request))

    return [query.searchParams.get("code"), query.searchParams.get("state")]
  }

  dump() {

    /*

    #state = ""
  #PlayingSong = {}
  #lyrics_token = null
  #access_token = null
  #refresh_token = null

    */

    return {
      state: this.#state,
      playingSong: this.#PlayingSong,
      accessToken: this.#access_token,
      lyricToken: this.#lyrics_token,
      refreshToken: this.#refresh_token
    }
  }

  seek(ms) {
    return this.#callEndpoint("put", settings.endpoints.seek + "?position_ms=" + parseInt(ms))
  }
  //private

  async #getPlaylistTracks(id) {
    let response = await this.#callEndpoint("get", "playlists/" + id + "/tracks")
    let status = this.#handleApiResponse(response)

    if (status[0]) {

    }
  }

  #handleApiResponse(response) {
    if (response.status === 401) {
      console.log("refreshing lyrics token")
      this.refreshLogin()


      return [false, "Token Expired"]
    } else if (response.status === 403) {
      console.error("Bad OAuth: ", response.data)

      return [false, "Bad OAuth"]
    } else if (response.status === 429) {
      console.log("Rate limited, retry-after: " + response.headers["retry-after"] + "s")

      return [false, "Rate limited"]
    }

    return [true, "OK"]
  }

  #createFile(path, url, type) {
    return new Promise(async (resolve, reject) => {
      if (fs.existsSync(path)) {
        if (type !== "lyrics") { return }

        fs.readFile(path, 'utf8', (err, data) => {
          if (err) { reject(err) }

          resolve([data, "Got lyrics"])
        })

        return
      }

      if (type === "image") {
        let response = await apiClient.get(url, { responseType: 'stream' })

        response.data.pipe(fs.createWriteStream(path))
          .on('error', reject)
          .once('close', () => resolve([true, "Created image"]));
      } else {
        let response = await this.#callEndpoint("get", url, null, true)

        if (!response.data) {
          if (response.status === 403) {
            this.getLyricsToken()
          }
          resolve([undefined, `Failed to get response.data from: ${url}, status: ${response.status} ${response.statusText}`])
          return
        }

        if (response.data.status >= 400) {
          console.log("Lyrics token expired, regenerating.")

          getLyricsToken()
          resolve([undefined, "Token expired"])
        } else {
          let data = JSON.stringify(response.data)

          fs.writeFile(path, data, (err) => {
            if (err) { reject(err); return }

            resolve([data, "Got lyrics"])
          })
        }
      }

    })
  }

  #callEndpoint(method, endpoint, body, useLyrics) {
    let headers = {
      headers: {
        "Content-Type": 'application/json',
        "Authorization": 'Bearer ' + (useLyrics ? this.#lyrics_token : this.#access_token),
        "app-platform": "WebPlayer"
      }
    }

    return apiClient[method](endpoint, (body) ? body : headers, headers).then((response) => {
      this.#handleApiResponse(response)

      return response
    })
  }

  #callAuthorizationApi(body) {
    return apiClient.post(settings.endpoints.token, body, {
      headers: {
        "Content-Type": 'application/x-www-form-urlencoded',
        "Authorization": 'Basic ' + Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET).toString("base64")
      }
    }).then((res) => {
      if (res.status == 200) {
        this.#access_token = res.data.access_token;
        this.#refresh_token = res.data.refresh_token;

        console.log("Auth token expires in " + res.data.expires_in + "s")
      } else {
        console.log(res.status, res.data)
      }
    })
  }

  #getRequestUrl(request) {
    return `${request.protocol}://${request.get('host')}${request.originalUrl}`
  }
}