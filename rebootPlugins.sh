#!/bin/sh

ionic plugin ls
ionic state clear -- plugins

ionic plugin add cordova-plugin-app-version@latest
ionic plugin add cordova-plugin-app-event@latest
ionic plugin add cordova-plugin-badge@latest
ionic plugin add cordova-plugin-camera@latest --variable CAMERA_USAGE_DESCRIPTION="Upload-user-avatar-or-post-gallery-images" --variable PHOTOLIBRARY_USAGE_DESCRIPTION="Upload-user-avatar-or-post-gallery-images"
ionic plugin add cordova-plugin-console@latest
ionic plugin add cordova-plugin-device@1.1.5
ionic plugin add cordova-plugin-dialogs@latest
ionic plugin add cordova-plugin-facebook4@latest --save --variable APP_ID="724123877696428" --variable APP_NAME="Learnly"
ionic plugin add cordova-plugin-file-transfer@latest
ionic plugin add cordova-plugin-file@latest
ionic plugin add cordova-plugin-geolocation@latest --variable GEOLOCATION_USAGE_DESCRIPTION="Learnly-uses-Location-data-to-find-nearby-tutors" --save
ionic plugin add cordova-plugin-inappbrowser@1.7.0
ionic plugin add cordova-plugin-intercom@3.0.26
ionic plugin add cordova-plugin-splashscreen@latest
ionic plugin add cordova-plugin-statusbar@latest
ionic plugin add cordova-plugin-whitelist@latest
ionic plugin add cordova-plugin-x-socialsharing@latest
ionic plugin add ionic-plugin-keyboard@latest
ionic plugin add pushwoosh-cordova-plugin@latest --variable IOS_FOREGROUND_ALERT_TYPE="ALERT"
ionic plugin add ionic-plugin-deeplinks --variable URL_SCHEME=learnly  --variable DEEPLINK_HOST=learnly.sg

ionic plugin ls