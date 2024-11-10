# webphone-sip

![Logo](/docs/logo.svg?raw=true "Logo")

WebRTC SIP based VoIP client software (+chrome extension)

It allows you to make calls using your browser in an extremely productive way.

![Preview](/docs/preview-1400x560.png?raw=true "Preview")

## Features
* Make and get calls
* Audio effects using JS Audio API (Ex.: DTMF)
* Phone Controls - HOLD / MUTE / STOP
* Visual Effects in Calls (waveform viewer)
* ONLY JAVA-SCRIPT (using SIP.js)
* Chrome Extension for Click-To-CALL
* Internationalization Support

### TODO 
* Call History
* Receive Calls "in Backgruound"
* Desktop Notifications

## Chrome Extension

Chrome Extension allows you to turn phone numbers and link with the extension to make calls quickly (Click-To-Call).  
This allows integration with any CRM. In the menu you also have an option to make the call. 

https://chrome.google.com/webstore/detail/webphone/mcajodgaocmkmmomogbefkghjepgilnc

## Ready to use
I did a free version (hosted in github) that is used by the chrome extension (as popUP).  
If you improve this code, automatically it's reflected in the extension.  
Please send me feedback if you will use. ;)  

### Guides

* [FusionPBX + FreeSwitch + SSL](./docs/fusionpbx-guide.md)
* nvoip.com.br Provider: (_Use Domain: app.nvoip.com.br and Server: app.nvoip.com.br:7443_)
* [SIP.js server guides](https://sipjs.com/guides/server-configuration/)

### Requirements
* Need Https and WebRTC
* FreeSwitch

PS: I have not done any testing using asterisk so far


## Compile e Testing

> npm install
> npm start

