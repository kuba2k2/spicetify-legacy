package apply

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/khanhas/spicetify-cli/src/utils"
)

// Flag enables/disables additional feature
type Flag struct {
	ExperimentalFeatures utils.TernaryBool
	FastUserSwitching    utils.TernaryBool
	Home                 utils.TernaryBool
	LyricAlwaysShow      utils.TernaryBool
	LyricForceNoSync     utils.TernaryBool
	Radio                utils.TernaryBool
	SongPage             utils.TernaryBool
	VisHighFramerate     utils.TernaryBool
	Extension            []string
	CustomApp            []string
	CustomAppName        []string
}

// AdditionalOptions .
func AdditionalOptions(appsFolderPath string, flags Flag) {
	filesToModified := map[string]func(path string, flags Flag){
		filepath.Join(appsFolderPath, "zlink", "zlink.bundle.js"):   zlinkMod,
		filepath.Join(appsFolderPath, "zlink", "index.html"):        htmlMod,
		filepath.Join(appsFolderPath, "lyrics", "lyrics.bundle.js"): lyricsMod,
	}

	for file, call := range filesToModified {
		if _, err := os.Stat(file); os.IsNotExist(err) {
			continue
		}

		call(file, flags)
	}
}

// UserCSS creates user.css file in "zlink", "login" and "settings" apps.
// To not use custom css, set `themeFolder` to blank string
// To use default color scheme, set `scheme` to `nil`
func UserCSS(appsFolderPath, themeFolder string, scheme map[string]string) {
	css := []byte(getColorCSS(scheme) + getUserCSS(themeFolder))
	// "login" app is initially loaded apps so it needs its own assets,
	// unlike other apps that are able to depend on zlink assets.
	// "setting" app can be accessed from "login" app so it also needs its css file
	// else it would not load.
	apps := []string{"zlink", "login", "settings"}

	for _, v := range apps {
		dest := filepath.Join(appsFolderPath, v, "css", "user.css")
		if err := ioutil.WriteFile(dest, css, 0700); err != nil {
			utils.Fatal(err)
		}
	}
}

// UserAsset .
func UserAsset(appsFolderPath, themeFolder string) {
	var assetsPath = getAssetsPath(themeFolder)

	if err := utils.Copy(assetsPath, appsFolderPath, true, nil); err != nil {
		utils.Fatal(err)
	}
}

func htmlMod(htmlPath string, flags Flag) {
	if len(flags.Extension) == 0 {
		return
	}

	extensionsHTML := ""

	for _, v := range flags.Extension {
		if strings.HasSuffix(v, ".mjs") {
			extensionsHTML += `<script type="module" src="` + v + `"></script>` + "\n"
		} else {
			extensionsHTML += `<script src="` + v + `"></script>` + "\n"
		}
	}

	utils.ModifyFile(htmlPath, func(content string) string {
		utils.Replace(
			&content,
			`<!\-\-Extension\-\->`,
			"${0}\n"+extensionsHTML,
		)
		return content
	})
}

func lyricsMod(jsPath string, flags Flag) {
	if flags.VisHighFramerate.IsDefault() && flags.LyricForceNoSync.IsDefault() {
		return
	}

	utils.ModifyFile(jsPath, func(content string) string {
		if !flags.VisHighFramerate.IsDefault() {
			utils.Replace(&content, `[\w_]+\.highVisualizationFrameRate\s?=`, `${0}`+flags.VisHighFramerate.ToForceOperator())
		}

		if !flags.LyricForceNoSync.IsDefault() {
			utils.Replace(&content, `[\w_]+\.forceNoSyncLyrics\s?=`, `${0}`+flags.LyricForceNoSync.ToForceOperator())
		}

		return content
	})
}

func zlinkMod(jsPath string, flags Flag) {
	utils.ModifyFile(jsPath, func(content string) string {
		// Disable WebUI button permanently to prevent confusion for user.
		utils.Replace(&content, `(enableDarkMode:)("Enabled")`, `${1}false&&${2}`)

		if !flags.ExperimentalFeatures.IsDefault() {
			utils.Replace(&content, `[\w_]+(&&[\w_]+\.default.createElement\([\w_]+\.default,\{name:"experiments)`, flags.ExperimentalFeatures.ToString()+`${1}`)
		}

		if !flags.FastUserSwitching.IsDefault() {
			utils.Replace(&content, `[\w_]+(&&[\w_]+\.default.createElement\([\w_]+\.default,\{name:"switch\-user)`, flags.FastUserSwitching.ToString()+`${1}`)
		}

		if !flags.Home.IsDefault() {
			utils.Replace(&content, `(isHomeEnabled:)("Enabled")`, `${1}`+flags.Home.ToForceOperator()+`${2}`)
		}

		if !flags.LyricAlwaysShow.IsDefault() {
			utils.Replace(&content, `(lyricsEnabled\()[\w_]+&&\(.+?\)`, `${1}`+flags.LyricAlwaysShow.ToString())
		}

		if !flags.Radio.IsDefault() {
			utils.Replace(&content, `"1"===[\w_]+\.productState\.radio`, flags.Radio.ToString())
		}

		if !flags.SongPage.IsDefault() {
			utils.Replace(&content, `window\.initialState\.isSongPageEnabled`, flags.SongPage.ToString())
		}

		if len(flags.CustomApp) > 0 {
			insertCustomApp(&content, flags.CustomApp, flags.CustomAppName)
		}

		return content
	})
}

func getUserCSS(themeFolder string) string {
	if len(themeFolder) == 0 {
		return ""
	}

	cssFilePath := filepath.Join(themeFolder, "user.css")
	_, err := os.Stat(cssFilePath)

	if err != nil {
		return ""
	}

	content, err := ioutil.ReadFile(cssFilePath)
	if err != nil {
		return ""
	}

	return string(content)
}

func getColorCSS(scheme map[string]string) string {
	var variableList string
	mergedScheme := make(map[string]string)

	for k, v := range scheme {
		mergedScheme[k] = v
	}

	for k, v := range utils.BaseColorList {
		if len(mergedScheme[k]) == 0 {
			mergedScheme[k] = v
		}
	}

	for k, v := range mergedScheme {
		parsed := utils.ParseColor(v)
		variableList += fmt.Sprintf(`
    --modspotify_%s: #%s;
    --modspotify_rgb_%s: %s;`,
			k, parsed.Hex(),
			k, parsed.RGB())
	}

	return fmt.Sprintf(":root {%s\n}\n", variableList)
}

func insertCustomApp(zlinkContent *string, appList []string, appNames []string) {
	symbol1 := utils.FindSymbol("React and SidebarList", *zlinkContent, []string{
		`([\w_]+)\.default\.createElement\(([\w_]+)\.default,\{title:[\w_]+\.default\.get\("(?:desktop\.zlink\.)?your_music\.app_name"\)`,
	})
	if symbol1 == nil || len(symbol1) < 2 {
		utils.PrintError("Cannot find enough symbol for React and SidebarList.")
		return
	}

	symbol2 := utils.FindSymbol("Last requested URI", *zlinkContent, []string{
		`([\w_]+)\.default,{isActive:/\^spotify:app:home/\.test\(([\w_]+)\)`,
	})
	if symbol2 == nil || len(symbol2) < 2 {
		utils.PrintError("Cannot find enough symbol for Last requested URI.")
		return
	}

	react := symbol1[0]
	list := symbol1[1]

	element := symbol2[0]
	pageURI := symbol2[1]

	pageLogger := ""
	menuItems := ""

	for index, name := range appList {
		appName := appNames[index]
		if appName == "" {
			continue
		}
		name = strings.Replace(name, ".spa", "", 1)
		menuItems += react +
			`.default.createElement(` + element +
			`.default,{isActive:/^spotify:app:` + name +
			`(\:.*)?$/.test(` + pageURI +
			`),isBold:!0,label:"` + appName +
			`",uri:"spotify:app:` + name + `"}),`

		pageLogger += `"` + name + `":"` + name + `",`
	}

	utils.Replace(
		zlinkContent,
		`[\w_]+\.default\.createElement\([\w_]+\.default,\{title:[\w_]+\.default\.get\("(?:desktop\.zlink\.)?your_music\.app_name"`,
		react+`.default.createElement(`+list+
			`.default,{title:"Your app"},`+menuItems+`)),`+
			react+`.default.createElement("div",{className:"LeftSidebar__section"},${0}`,
	)

	utils.Replace(
		zlinkContent,
		`EMPTY:"empty"`,
		pageLogger+`${0}`,
	)
}

func getAssetsPath(themeFolder string) string {
	dir := filepath.Join(themeFolder, "assets")

	if _, err := os.Stat(dir); err != nil {
		return ""
	}

	return dir
}
