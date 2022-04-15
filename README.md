# Important info
This is a 'continuation' of the original Spicetify project, supporting legacy Spotify versions (namely `1.1.56.595`). It has some additional features for extension developers who just want to stick to the good, old version (me). Do not use it if you don't know what you're doing.

## New features since v1.2.1
- support for `.spa` packaged custom apps
- built-in React components exposed for custom usage
- added some helper functions and APIs
- added type declarations for the `window.__spotify` object

## Installing
Install scripts in this fork are modified to use its releases. The following is an extract from the [original repo's Wiki page](https://github.com/khanhas/spicetify-cli/wiki/Installation#legacy-installations) with modified URLs.

**Windows**: In powershell
```powershell
$v="1.3.0"; Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/kuba2k2/spicetify-legacy/legacy/install.ps1" | Invoke-Expression
```

**Linux/MacOS:** In bash
```bash
curl -fsSL https://raw.githubusercontent.com/kuba2k2/spicetify-legacy/legacy/install.sh -o /tmp/install.sh
sh /tmp/install.sh 1.3.0
```

I take no copyright nor responsibility for using this fork. This is here just so that I can use it easily.

# The original readme goes here

<h3 align="center"><img src="https://i.imgur.com/iwcLITQ.png" width="600px"></h3>
<p align="center">
  <a href="https://goreportcard.com/report/github.com/kuba2k2/spicetify-legacy"><img src="https://goreportcard.com/badge/github.com/kuba2k2/spicetify-legacy"></a>
  <a href="https://github.com/kuba2k2/spicetify-legacy/releases/latest"><img src="https://img.shields.io/github/release/kuba2k2/spicetify-legacy/all.svg?colorB=97CA00?label=version"></a>
  <a href="https://github.com/kuba2k2/spicetify-legacy/releases"><img src="https://img.shields.io/github/downloads/kuba2k2/spicetify-legacy/total.svg?colorB=97CA00"></a>
  <a href="https://spectrum.chat/spicetify"><img src="https://withspectrum.github.io/badge/badge.svg"></a>
</p>

<img src="https://i.imgur.com/7eiKd1k.png" alt="img" align="right" width="400px">
Command-line tool to customize Spotify client.
Supports Windows, MacOS and Linux.

### Features
- Change colors whole UI
- Inject CSS for advanced customization
- Inject Extensions (Javascript script) to extend functionalities, manipulate UI and control player.
- Inject Custom apps
- Enable additional, hidden features
- Remove bloated components to improve performance
<img src="https://i.imgur.com/eLfNSqp.png" alt="img" align="right" width="400px">

#### [Installation](https://github.com/kuba2k2/spicetify-legacy/wiki/Installation)
#### [Basic Usage](https://github.com/kuba2k2/spicetify-legacy/wiki/Basic-Usage)
#### [Customization](https://github.com/kuba2k2/spicetify-legacy/wiki/Customization)
#### [Extensions](https://github.com/kuba2k2/spicetify-legacy/wiki/Extensions)
#### [Custom Apps](https://github.com/kuba2k2/spicetify-legacy/wiki/Custom-Apps)
#### [Wiki](https://github.com/kuba2k2/spicetify-legacy/wiki)
