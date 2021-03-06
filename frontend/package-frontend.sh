# all panel extension files need to be included in the upload (with some exceptions) - https://dev.twitch.tv/docs/extensions/guidelines-and-policies#2-technical
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
pushd "$DIR"

# get bootstrap
rm -r bootstrap
curl -sS -L https://github.com/twbs/bootstrap/releases/download/v4.5.0/bootstrap-4.5.0-dist.zip > bootstrap.zip
7z x bootstrap.zip
rm bootstrap.zip
mv bootstrap-4.5.0-dist bootstrap

# get bootstrap icons
curl -sS -L https://github.com/twbs/icons/releases/download/v1.0.0-alpha4/bootstrap-icons-1.0.0-alpha4.zip > icons.zip
7z x icons.zip
rm icons.zip
mv bootstrap-icons-1.0.0-alpha4 ./bootstrap/icons

# get jquery-3.5.1.min.js
curl -sS https://code.jquery.com/jquery-3.5.1.min.js > jquery-3.5.1.min.js

# zip up this directory (except for this script)
set +H
rm frontend.zip
7z a -tzip frontend.zip . -x!package-frontend.sh

# all done
popd