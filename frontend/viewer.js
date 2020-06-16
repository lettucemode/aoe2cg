const DIVS = {
  notLoggedIn: 'notLoggedIn',
  gameNotStarted: 'gameNotStarted',
  clickToRegister: 'clickToRegister',
  waitingForWin: 'waitingForWin',
  forbiddenKnowledge: 'forbiddenKnowledge',
};

const MESSAGES = {
  gameStarted: 'Active',
  gameEnded: 'Ended',
};

var twitch = window.Twitch.ext;
var subMult = 1;

var requests = {
  checkStatus: createRequest('GET', 'CheckStatus'),
  register: createRequest('POST', 'Register'),
  forbiddenKnowledge: createRequest('GET', 'ForbiddenKnowledge'),
};

function createRequest(method, endpoint) {
  return {
    // url: location.protocol + '//localhost:7071/api/' + endpoint,
    url: location.protocol + '//aoe2cg-fa.azurewebsites.net/api/' + endpoint,
    method: method,
    contentType: 'application/json',
    success: logSuccess,
    error: logError,
  };
}

twitch.onContext(function (context) {
  twitch.rig.log(context);
});

twitch.onAuthorized(function (auth) {
  if (auth.userId.toString().startsWith('A')) {
    setVisibleDiv(DIVS.notLoggedIn, DIVS);
    removeLoadingSpinner();
    return;
  }

  twitch.listen('whisper-' + auth.userId, function (targ, cType, message) {
    if (message === 'Winner') {
      obtainTheForbiddenKnowledge();
    }
  });
  setAuth(auth.token, requests);
  checkStatus();
});

function logError(error, status) {
  twitch.rig.log('EBS request returned ' + status + ' (' + JSON.stringify(error) + ')');
}

function logSuccess(data, status) {
  twitch.rig.log('EBS request returned ' + JSON.stringify(data) + ' (' + status + ')');
}

function checkStatus() {
  var req = requests.checkStatus;
  req.success = [logSuccess, (data) => processCheckStatusResult(data)];
  $.ajax(req);
}

function processCheckStatusResult(data) {
  subMult = data.subMult;
  if (data.gameStatus === MESSAGES.gameStarted) {
    if (!data.registered) {
      setVisibleDiv(DIVS.clickToRegister, DIVS);
      configureRegisterScreen();
    } else {
      setVisibleDiv(DIVS.waitingForWin, DIVS);
    }
  } else if (data.gameStatus === MESSAGES.gameEnded) {
    setVisibleDiv(DIVS.gameNotStarted, DIVS);
  }
  removeLoadingSpinner();
}

function configureRegisterScreen() {
  if (!twitch.viewer.isLinked) {
    // change share identity button to teal and show explanatory text
    $('#h5Identity').html(
      'Subs get an entry bonus, and winners get their names in chat! Will you share your twitch identity so I can do that?'
    );
    $('#btnShareIdentity').removeClass('right labeled icon loading');
    $('#btnShareIdentity').html('Yes, share identity');
  } else {
    // change share identity button to gray with check mark
    if (twitch.viewer.subscriptionStatus && twitch.viewer.subscriptionStatus.tier) {
      $('#h5Identity').html("Nice, you've got a " + subMult + 'x sub entry bonus!');
    } else {
      $('#h5Identity').html("You're all set!");
    }
    $('#btnShareIdentity').removeClass('teal');
    $('#btnShareIdentity').addClass('gray right labeled icon');
    $('#btnShareIdentity').html('<i class="check icon"></i> Identity Shared');
  }
}

function obtainTheForbiddenKnowledge() {
  var req = requests.forbiddenKnowledge;
  req.success = [
    logSuccess,
    (data) => {
      if (!data.success) return;
      $('#txtLobbyId').text(data.lobbyId);
      $('#txtLobbyPassword').text(data.lobbyPassword);
      setVisibleDiv(DIVS.forbiddenKnowledge, DIVS);
    },
  ];
  $.ajax(req);
}

$(function () {
  $('#btnRegister').click(function () {
    $('#btnRegister').addClass('loading');
    var req = requests.register;
    req.data = JSON.stringify({
      isSubscriber: twitch.viewer.subscriptionStatus ? true : false,
      realUserId: twitch.viewer.id,
    });
    req.success = [
      logSuccess,
      (data) => {
        if (!data.success) return;
        $('#btnRegister').removeClass('loading');
        setVisibleDiv(DIVS.waitingForWin, DIVS);
      },
    ];
    $.ajax(req);
  });

  $('#btnShareIdentity').click(function () {
    if (twitch.viewer.isLinked) return;
    $('#btnShareIdentity').addClass('loading');
    twitch.actions.requestIdShare();
  });

  // listen for incoming EBS pubsubs
  twitch.listen('broadcast', function (targ, cType, message) {
    if (message === MESSAGES.gameStarted) {
      setVisibleDiv(DIVS.clickToRegister, DIVS);
    } else if (message === MESSAGES.gameEnded) {
      setVisibleDiv(DIVS.gameNotStarted, DIVS);
    }
  });
});
