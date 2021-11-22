package cmd

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/khanhas/spicetify-cli/src/apply"
	backupstatus "github.com/khanhas/spicetify-cli/src/status/backup"
	spotifystatus "github.com/khanhas/spicetify-cli/src/status/spotify"
	"github.com/khanhas/spicetify-cli/src/utils"
)

// Apply .
func Apply() {
	checkStates()
	InitSetting()

	// Copy raw assets to Spotify Apps folder if Spotify is never applied
	// before.
	// extractedStock is for preventing copy raw assets 2 times when
	// replaceColors is false.
	extractedStock := false
	if !spotifystatus.Get(appDestPath).IsApplied() {
		utils.PrintBold(`Copying raw assets:`)
		if err := os.RemoveAll(appDestPath); err != nil {
			utils.Fatal(err)
		}
		if err := utils.Copy(rawFolder, appDestPath, true, nil); err != nil {
			utils.Fatal(err)
		}
		utils.PrintGreen("OK")
		extractedStock = true
	}

	if replaceColors {
		utils.PrintBold(`Overwriting themed assets:`)
		if err := utils.Copy(themedFolder, appDestPath, true, nil); err != nil {
			utils.Fatal(err)
		}
		utils.PrintGreen("OK")
	} else if !extractedStock {
		utils.PrintBold(`Overwriting raw assets:`)
		if err := utils.Copy(rawFolder, appDestPath, true, nil); err != nil {
			utils.Fatal(err)
		}
		utils.PrintGreen("OK")
	}

	utils.PrintBold(`Transferring user.css:`)
	updateCSS()
	utils.PrintGreen("OK")

	if overwriteAssets {
		utils.PrintBold(`Overwriting custom assets:`)
		updateAssets()
		utils.PrintGreen("OK")
	}

	extentionList := featureSection.Key("extensions").Strings("|")
	customAppsList := featureSection.Key("custom_apps").Strings("|")
	customAppNames := []string{}

	if len(extentionList) > 0 {
		utils.PrintBold(`Transferring extensions:`)
		pushExtensions(extentionList...)
		utils.PrintGreen("OK")
		nodeModuleSymlink()
	}

	if len(customAppsList) > 0 {
		utils.PrintBold(`Creating custom apps symlinks:`)
		customAppNames = pushApps(customAppsList...)
		utils.PrintGreen("OK")
	}

	utils.PrintBold(`Applying additional modifications:`)
	apply.AdditionalOptions(appDestPath, apply.Flag{
		ExperimentalFeatures: toTernary("experimental_features"),
		FastUserSwitching:    toTernary("fastUser_switching"),
		Home:                 toTernary("home"),
		LyricAlwaysShow:      toTernary("lyric_always_show"),
		LyricForceNoSync:     toTernary("lyric_force_no_sync"),
		Radio:                toTernary("radio"),
		SongPage:             toTernary("song_page"),
		VisHighFramerate:     toTernary("visualization_high_framerate"),
		Extension:            extentionList,
		CustomApp:            customAppsList,
		CustomAppName:        customAppNames,
	})
	utils.PrintGreen("OK")

	if len(patchSection.Keys()) > 0 {
		utils.PrintBold(`Patching:`)
		Patch()
		utils.PrintGreen("OK")
	}

	utils.PrintSuccess("Spotify is spiced up!")

	if isAppX {
		utils.PrintInfo(`You are using Spotify Windows Store version, which is only partly supported.
Stop using Spicetify with Windows Store version unless you absolutely CANNOT install normal Spotify from installer.
Modded Spotify cannot be launched using original Shortcut/Start menu tile. To correctly launch Spotify with modification, please make a desktop shortcut that execute "spicetify auto". After that, you can change its icon, pin to start menu or put in startup folder.`)
	}
}

// UpdateTheme updates user.css and overwrites custom assets
func UpdateTheme() {
	checkStates()
	InitSetting()

	if len(themeFolder) == 0 {
		utils.PrintWarning(`Nothing is updated: Config "current_theme" is blank.`)
		os.Exit(1)
	}

	updateCSS()
	utils.PrintSuccess("Custom CSS is updated")

	if overwriteAssets {
		updateAssets()
		utils.PrintSuccess("Custom assets are updated")
	}
}

func updateCSS() {
	var scheme map[string]string = nil
	if colorSection != nil {
		scheme = colorSection.KeysHash()
	}
	theme := themeFolder
	if !injectCSS {
		theme = ""
	}
	apply.UserCSS(appDestPath, theme, scheme)
}

func updateAssets() {
	apply.UserAsset(appDestPath, themeFolder)
}

// UpdateAllExtension pushs all extensions to Spotify
func UpdateAllExtension() {
	checkStates()
	list := featureSection.Key("extensions").Strings("|")
	if len(list) > 0 {
		pushExtensions(list...)
		utils.PrintSuccess(utils.PrependTime("All extensions are updated."))
	} else {
		utils.PrintError("No extension to update.")
	}
}

// checkStates examines both Backup and Spotify states to promt informative
// instruction for users
func checkStates() {
	backupVersion := backupSection.Key("version").MustString("")
	backStat := backupstatus.Get(prefsPath, backupFolder, backupVersion)
	spotStat := spotifystatus.Get(appPath)

	if backStat.IsEmpty() {
		if spotStat.IsBackupable() {
			utils.PrintError(`You haven't backed up. Run "spicetify backup apply".`)

		} else {
			utils.PrintError(`You haven't backed up and Spotify cannot be backed up at this state. Please re-install Spotify then run "spicetify backup apply".`)
		}
		os.Exit(1)

	} else if backStat.IsOutdated() {
		utils.PrintWarning("Spotify version and backup version are mismatched.")

		if spotStat.IsMixed() {
			utils.PrintInfo(`Spotify client possibly just had an new update.`)
			utils.PrintInfo(`Please run "spicetify backup apply".`)

		} else if spotStat.IsStock() {
			utils.PrintInfo(`Please run "spicetify backup apply".`)

		} else {
			utils.PrintInfo(`Spotify cannot be backed up at this state. Please re-install Spotify then run "spicetify backup apply".`)
		}

		if !ReadAnswer("Continue anyway? [y/N] ", false, true) {
			os.Exit(1)
		}
	}
}

func getExtensionPath(name string) (string, error) {
	extFilePath := filepath.Join(userExtensionsFolder, name)

	if _, err := os.Stat(extFilePath); err == nil {
		return extFilePath, nil
	}

	extFilePath = filepath.Join(utils.GetExecutableDir(), "Extensions", name)

	if _, err := os.Stat(extFilePath); err == nil {
		return extFilePath, nil
	}

	return "", errors.New("Extension not found")
}

func pushExtensions(list ...string) {
	var err error
	var zlinkFolder = filepath.Join(appDestPath, "zlink")

	for _, v := range list {
		var extName, extPath string

		if filepath.IsAbs(v) {
			extName = filepath.Base(v)
			extPath = v
		} else {
			extName = v
			extPath, err = getExtensionPath(v)
			if err != nil {
				utils.PrintError(`Extension "` + extName + `" not found.`)
				continue
			}
		}

		if err = utils.CopyFile(extPath, zlinkFolder); err != nil {
			utils.PrintError(err.Error())
			continue
		}

		if strings.HasSuffix(extName, ".mjs") {
			utils.ModifyFile(filepath.Join(zlinkFolder, extName), func(content string) string {
				lines := strings.Split(content, "\n")
				for i := 0; i < len(lines); i++ {
					mapping := utils.FindSymbol("", lines[i], []string{
						`//\s*spicetify_map\{(.+?)\}\{(.+?)\}`,
					})
					if len(mapping) > 0 {
						lines[i+1] = strings.Replace(lines[i+1], mapping[0], mapping[1], 1)
					}
				}

				return strings.Join(lines, "\n")
			})
		}
	}
}

func getCustomAppPath(name string) (string, error) {
	customAppFolderPath := filepath.Join(userAppsFolder, name)

	if _, err := os.Stat(customAppFolderPath); err == nil {
		return customAppFolderPath, nil
	}

	customAppFolderPath = filepath.Join(utils.GetExecutableDir(), "CustomApps", name)

	if _, err := os.Stat(customAppFolderPath); err == nil {
		return customAppFolderPath, nil
	}

	return "", errors.New("Custom app not found")
}

func pushApps(list ...string) []string {
	customAppNames := []string{}
	for _, name := range list {
		customAppPath, err := getCustomAppPath(name)
		if err != nil {
			utils.PrintError(`Custom app "` + name + `" not found.`)
			continue
		}

		if strings.HasSuffix(customAppPath, ".spa") {
			customAppDestPath := filepath.Join(appDestPath, strings.Replace(name, ".spa", "", 1))
			err := utils.Unzip(customAppPath, customAppDestPath)
			if err != nil {
				utils.Fatal(err)
			}
		} else {
			customAppDestPath := filepath.Join(appDestPath, name)
			if err = utils.CreateJunction(customAppPath, customAppDestPath); err != nil {
				utils.Fatal(err)
			}
		}

		manifestPath := filepath.Join(appDestPath, strings.Replace(name, ".spa", "", 1), "manifest.json")
		jsonData, _ := ioutil.ReadFile(manifestPath)

		var data map[string]json.RawMessage
		err = json.Unmarshal(jsonData, &data)
		if err != nil {
			utils.Fatal(err)
		}

		var bundleType string
		err = json.Unmarshal(data["BundleType"], &bundleType)
		if err != nil {
			utils.Fatal(err)
		}

		if bundleType != "Application" {
			customAppNames = append(customAppNames, "")
			continue
		}

		var names map[string]string
		err = json.Unmarshal(data["AppName"], &names)
		if err != nil {
			var name string
			err = json.Unmarshal(data["AppName"], &name)
			if err != nil {
				utils.Fatal(err)
			}
			customAppNames = append(customAppNames, name)
			continue
		}

		customAppNames = append(customAppNames, names["en"])
	}
	return customAppNames
}

func toTernary(key string) utils.TernaryBool {
	return utils.TernaryBool(featureSection.Key(key).MustInt(0))
}

func nodeModuleSymlink() {
	nodeModulePath, err := getExtensionPath("node_modules")
	if err != nil {
		return
	}

	utils.PrintBold(`Found node_modules folder. Creating node_modules symlink:`)

	nodeModuleDest := filepath.Join(appDestPath, "zlink", "node_modules")
	if err = utils.CreateJunction(nodeModulePath, nodeModuleDest); err != nil {
		utils.PrintError("Cannot create node_modules symlink")
		return
	}

	utils.PrintGreen("OK")
}
