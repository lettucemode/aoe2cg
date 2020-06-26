var localtest = false; // set this to true when running backend locally

function createRequest(method, endpoint, success, error) {
  return {
    url: location.protocol + '//localhost:7071/api/' + endpoint,
    method: method,
    contentType: 'application/json',
    endpoint: endpoint,
    headers: {},
    success: success,
    error: error,
  };
}

function setConfig(config, requests) {
  Object.keys(requests).forEach((req) => {
    requests[req].headers['x-functions-key'] = config['functionsAuthKey'];
    if (!localtest) requests[req].url = config['functionsBaseUrl'] + requests[req].endpoint;
  });
}

function setAuth(token, requests) {
  Object.keys(requests).forEach((req) => {
    requests[req].headers['Authorization'] = 'Bearer ' + token;
  });
}

function setVisibleDiv(visibleDiv, divs) {
  if (visibleDiv === '') return;
  Object.keys(divs).forEach((divkey) => {
    $('#' + divkey).attr('hidden', 'true');
  });
  $('#' + visibleDiv).removeAttr('hidden');
}

function removeLoadingSpinner() {
  $('#spinner').attr('hidden', 'true');
}

function getExtVersion() {
  var regex = /(\d+\.\d+\.\d+)/;
  var matches = location.href.match(regex);
  return matches ? matches[0] : '1.0.0';
}

function setTheme(theme) {
  if (theme === 'light') {
    // setVisibleDiv(DIVS.shame_digusting, DIVS);
    $('body').addClass('light-mode');
    $('body').removeClass('dark-mode');
    $('li').addClass('light-mode');
    $('li').removeClass('dark-mode');
  } else {
    $('body').addClass('dark-mode');
    $('body').removeClass('light-mode');
    $('li').addClass('dark-mode');
    $('li').removeClass('light-mode');
  }
}
