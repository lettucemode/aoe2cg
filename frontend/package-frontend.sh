# all files in a twitch panel extension need to be included in the extension - https://dev.twitch.tv/docs/extensions/guidelines-and-policies#2-technical

# use simple setup for semantic-ui - just download the zip and extract it into here
rm -r semantic-ui
curl -sS https://codeload.github.com/Semantic-Org/Semantic-UI-CSS/zip/master > semantic-ui.zip
7z x semantic-ui.zip
rm semantic-ui.zip
mv Semantic-UI-CSS-master semantic-ui

rm -r bootstrap
curl -sS -L https://github.com/twbs/bootstrap/releases/download/v4.5.0/bootstrap-4.5.0-dist.zip > bootstrap.zip
7z x bootstrap.zip
rm bootstrap.zip
mv bootstrap-4.5.0-dist bootstrap

# get jquery-3.3.1.min.js
curl -sS https://code.jquery.com/jquery-3.3.1.min.js > jquery-3.3.1.min.js

# zip up this directory (except for this script)
set +H
rm frontend.zip
7z a -tzip frontend.zip . -x!package-frontend.sh