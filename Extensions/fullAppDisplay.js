// @ts-check
// NAME: Full App Display
// AUTHOR: khanhas
// VERSION: 1.0
// DESCRIPTION: Fancy artwork and track status display.

/// <reference path="../globals.d.ts" />

(function FullAppDisplay() {
    if (!Spicetify.Player || !Spicetify.Player.data) {
        setTimeout(FullAppDisplay, 200)
        return
    }

    const CONFIG = getConfig()

    const style = document.createElement("style")
    const styleBase = `
#full-app-display {
    display: none;
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 500;
    cursor: default;
}
#fad-header {
    position: fixed;
    width: 100%;
    height: 80px;
    -webkit-app-region: drag;
}
#fad-foreground {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
#fad-art-image {
    position: relative;
    width: 100%;
    height: 100%;
    padding-bottom: 100%;
    border-radius: 15px;
    background-size: cover;
}
#fad-art-inner {
    position: absolute;
    left: 3%;
    bottom: 0;
    width: 94%;
    height: 94%;
    z-index: -1;
    backface-visibility: hidden;
    transform: translateZ(0);
    filter: blur(6px);
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}
#fad-progress-container {
    width: 100%;
    display: flex;
    align-items: center;
}
#fad-progress {
    width: 100%;
    height: 6px;
    border-radius: 6px;
    background-color: #ffffff50;
    overflow: hidden;
}
#fad-progress-inner {
    height: 100%;
    border-radius: 6px;
    background-color: #ffffff;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.8);
    transition: width 1s linear;
}
#fad-elapsed {
    margin-right: 10px;
}
#fad-duration {
    margin-left: 10px;
}
#fad-background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
    transform: scale(1.5);
}
#fad-background-image {
    height: 100%;
    background-size: cover;
    backface-visibility: hidden;
    transform: translateZ(0);
    filter: blur(30px) brightness(0.6);
    backdrop-filter: blur(30px) brightness(0.6);
    background-position: center;
}
#fad-artist::before {
    content: "\\f168";
}
#fad-album::before {
    content: "\\f167";
}
body.fad-activated #full-app-display {
    display: block
}
.fad-background-fade {
    transition: background-image 1s linear;
}
body.video-full-screen.video-full-screen--hide-ui {
    cursor: auto;
}
`

    const styleChoices = [`
#fad-foreground {
    flex-direction: row;
    text-align: left;
}
#fad-art {
    width: calc(100vw - 840px);
    min-width: 200px;
    max-width: 340px;
}
#fad-details {
    padding-left: 50px;
    line-height: initial;
    max-width: 70%;
    color: #FFFFFF;
}
#fad-title {
    font-size: 87px;
    font-weight: var(--glue-font-weight-black);
}
#fad-artist, #fad-album {
    font-size: 54px;
    font-weight: var(--glue-font-weight-medium);
}
#fad-artist::before, #fad-album::before {
    font-size: 54px;
    opacity: 30%;
    font-family: "glue-spoticon";
    line-height: 70px;
    vertical-align: bottom;
    padding-right: 12px;
}
#fad-status {
    display: flex;
    min-width: 400px;
    max-width: 400px;
    align-items: center;
}
#fad-status.active {
    margin-top: 20px;
}
#fad-controls {
    display: flex;
    margin-right: 10px;
}`,
`
#fad-art {
    width: calc(100vh - 400px);
    max-width: 340px;
}
#fad-foreground {
    flex-direction: column;
    text-align: center;
}
#fad-details {
    padding-top: 50px;
    line-height: initial;
    max-width: 70%;
    color: #FFFFFF;
}
#fad-title {
    font-size: 54px;
    font-weight: var(--glue-font-weight-black);
}
#fad-artist, #fad-album {
    font-size: 33px;
    font-weight: var(--glue-font-weight-medium);
}
#fad-artist::before, #fad-album::before {
    font-size: 33px;
    opacity: 30%;
    font-family: "glue-spoticon";
    line-height: 42px;
    vertical-align: bottom;
    padding-right: 8px;
}
#fad-status {
    display: flex;
    min-width: 400px;
    max-width: 400px;
    align-items: center;
    flex-direction: column;
}
#fad-status.active {
    margin: 20px auto 0;
}
#fad-controls {
    margin-top: 20px;
    order: 2
}`
    ]

    const iconStyleChoices = [`
#fad-artist::before, #fad-album::before {
    display: none;
}`,
`
#fad-artist::before, #fad-album::before {
    display: inline-block;
}`
    ]

    const container = document.createElement("div")
    container.id = "full-app-display"

    let cover, back, title, artist, album, prog, elaps, durr, play, bgImage
    const nextTrackImg = new Image()

    function render() {
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        Spicetify.Player.removeEventListener("onprogress", updateProgress)
        Spicetify.Player.removeEventListener("onplaypause", updateControl)

        style.innerHTML = styleBase + styleChoices[CONFIG.vertical ? 1 : 0] + iconStyleChoices[CONFIG.icons ? 1 : 0];

        container.innerHTML = `
<div id="fad-background">
    <div id="fad-background-image"></div>
</div>
<div id="fad-header"></div>
<div id="fad-foreground">
    <div id="fad-art">
        <div id="fad-art-image">
            <div id="fad-art-inner"></div>
        </div>
    </div>
    <div id="fad-details">
        <div id="fad-title"></div>
        <div id="fad-artist"></div>
        ${CONFIG.showAlbum ? `<div id="fad-album"></div>` : ""}
        <div id="fad-status" class="${CONFIG.enableControl || CONFIG.enableProgress ? "active" : ""}">
            ${CONFIG.enableControl ? `
            <div id="fad-controls">
                ${CONFIG.vertical ? `<button id="fad-back" class="button spoticon-skip-back-16"></button>` : ""}
                <button id="fad-play" class="button spoticon-play-16"></button>
                <button id="fad-next" class="button spoticon-skip-forward-16"></button>` : ""}
            </div>
            ${CONFIG.enableProgress ? `
            <div id="fad-progress-container">
                <span id="fad-elapsed"></span>
                <div id="fad-progress"><div id="fad-progress-inner"></div></div>
                <span id="fad-duration"></span>
            </div>` : ""}
        </div>
    </div>
</div>`

        cover = container.querySelector("#fad-art-image")
        back = container.querySelector("#fad-background-image")
        title = container.querySelector("#fad-title")
        artist = container.querySelector("#fad-artist")
        album = container.querySelector("#fad-album")

        if (CONFIG.enableProgress) {
            prog = container.querySelector("#fad-progress-inner")
            durr = container.querySelector("#fad-duration")
            elaps = container.querySelector("#fad-elapsed")
        }

        if (CONFIG.enableControl) {
            play = container.querySelector("#fad-play")
            play.onclick = Spicetify.Player.togglePlay
            container.querySelector("#fad-next").onclick = Spicetify.Player.next
            if (CONFIG.vertical) {
                container.querySelector("#fad-back").onclick = Spicetify.Player.back
            }
        }
    }

    const classes = [
        "video",
        "video-full-screen",
        "video-full-window",
        "video-full-screen--hide-ui",
        "fad-activated"
    ]

    function getAlbumInfo(uri) {
        return new Promise((resolve) => {
            Spicetify.CosmosAPI.resolver.get(`hm://album/v1/album-app/album/${uri}/desktop`, (err, raw) => {
                resolve(!err && raw.getJSONBody())
            })
        })
    }

    async function updateInfo() {
        const meta = Spicetify.Player.data.track.metadata

        // prepare title
        let rawTitle = meta.title
        if (CONFIG.trimTitle) {
            rawTitle = rawTitle
                .replace(/\(.+?\)/g, "")
                .replace(/\[.+?\]/g, "")
                .replace(/\s\-\s.+?$/, "")
                .trim()
        }

        // prepare artist
        let artistName
        if (CONFIG.showAllArtists) {
            artistName = Object.keys(meta)
                .filter(key => key.startsWith('artist_name'))
                .sort()
                .map(key => meta[key])
                .join(', ')
        } else {
            artistName = meta.artist_name
        }

        // prepare album
        let albumText
        if (CONFIG.showAlbum) {
            const albumURI = meta.album_uri
            const albumInfo = await getAlbumInfo(albumURI.replace("spotify:album:", ""))

            const albumDate = new Date(albumInfo.year, (albumInfo.month || 1) - 1, albumInfo.day || 0)
            const recentDate = new Date()
            recentDate.setMonth(recentDate.getMonth() - 6)
            const dateStr = albumDate.toLocaleString(
                'default',
                albumDate > recentDate ? {
                    year: 'numeric',
                    month: 'short'
                } : {
                    year: 'numeric'
                }
            )

            albumText = meta.album_title + " • " + dateStr
        }

        // prepare duration
        let durationText
        if (CONFIG.enableProgress) {
            durationText = Spicetify.Player.formatTime(meta.duration)
        }

        // Wait until next track image is downloaded then update UI text and images
        nextTrackImg.src = meta.image_xlarge_url
        nextTrackImg.onload = () => {
            const bgImage = `url("${meta.image_xlarge_url}")`
            back.style.backgroundImage = bgImage
            cover.style.backgroundImage = bgImage

            title.innerText = rawTitle || ""
            artist.innerText = artistName || ""
            if (album) {
                album.innerText = albumText || ""
            }
            if (durr) {
                durr.innerText = durationText || ""
            }
        }
    }

    function updateProgress() {
        prog.style.width = Spicetify.Player.getProgressPercent() * 100 + "%"
        elaps.innerText = Spicetify.Player.formatTime(Spicetify.Player.getProgress())
    }

    function updateControl() {
        if (Spicetify.Player.isPlaying()) {
            play.classList.replace("spoticon-play-16", "spoticon-pause-16")
        } else {
            play.classList.replace("spoticon-pause-16", "spoticon-play-16")
        }
    }

    function activate() {
        updateInfo()
        Spicetify.Player.addEventListener("songchange", updateInfo)
        if (CONFIG.enableProgress) {
            updateProgress()
            Spicetify.Player.addEventListener("onprogress", updateProgress)
        }
        if (CONFIG.enableControl) {
            updateControl()
            Spicetify.Player.addEventListener("onplaypause", updateControl)
        }
        if (CONFIG.enableFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.webkitIsFullScreen) {
            document.exitFullscreen()
        }
        if (CONFIG.enableFade) {
            back.classList.add("fad-background-fade")
            cover.classList.add("fad-background-fade")
        } else {
            back.classList.remove("fad-background-fade")
            cover.classList.remove("fad-background-fade")
        }
        document.body.classList.add(...classes)
    }

    function deactivate() {
        Spicetify.Player.removeEventListener("songchange", updateInfo)
        if (CONFIG.enableProgress) {
            Spicetify.Player.removeEventListener("onprogress", updateProgress)
        }
        if (CONFIG.enableControl) {
            Spicetify.Player.removeEventListener("onplaypause", updateControl)
        }
        if (CONFIG.enableFullscreen || document.webkitIsFullScreen) {
            document.exitFullscreen()
        }
        document.body.classList.remove(...classes)
    }

    function getConfig() {
        try {
            const parsed = JSON.parse(Spicetify.LocalStorage.get("full-app-display-config"))
            if (parsed && typeof parsed === "object") {
                return parsed
            }
            throw ""
        } catch {
            Spicetify.LocalStorage.set("full-app-display-config", "{}")
            return {}
        }
    }

    function saveConfig() {
        Spicetify.LocalStorage.set("full-app-display-config", JSON.stringify(CONFIG))
    }

    // Add activator on top bar
    const button = document.createElement("button")
    button.classList.add("button", "spoticon-minimise-16", "fad-button")
    button.setAttribute("data-tooltip", "Full App Display")

    document.querySelector("#view-browser-navigation-top-bar").append(button)
    document.getElementById("video-player").append(style, container)

    // Add setting toggles in right click menu
    container.setAttribute("data-uri", "spotify:special:fullappdisplay")
    container.setAttribute("data-contextmenu", "")

    const checkURI = ([uri]) => uri === "spotify:special:fullappdisplay"

    function newMenuItem(name, key) {
        new Spicetify.ContextMenu.Item(
            name,
            function () {
                CONFIG[key] = !CONFIG[key]
                this.icon = CONFIG[key] && "check"
                saveConfig()
                render()
                activate()
            },
            checkURI,
            CONFIG[key] ? "check" : undefined,
        ).register()
    }

    newMenuItem("Enable progress bar", "enableProgress")
    newMenuItem("Enable controls", "enableControl")
    newMenuItem("Trim title", "trimTitle")
    newMenuItem("Show album", "showAlbum")
    newMenuItem("Show all artists", "showAllArtists")
    newMenuItem("Show icons", "icons")
    newMenuItem("Vertical mode", "vertical")
    newMenuItem("Enable fullscreen", "enableFullscreen")
    newMenuItem("Enable song change animation", "enableFade")
    new Spicetify.ContextMenu.Item("Exit", deactivate, checkURI).register()

    button.onclick = activate
    container.ondblclick = deactivate

    function toggleFad() {
        if (document.body.classList.contains('fad-activated')) {
            deactivate();
        } else {
            activate();
        }
    }

    Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["F11"],
            ctrl: false,
            shift: false,
            alt: false,
        },
        toggleFad
    );

    render()
})()