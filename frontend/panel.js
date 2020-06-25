const DIVS = {
  notLoggedIn: 'notLoggedIn',
  gameNotStarted: 'gameNotStarted',
  identityShare: 'identityShare',
  clickToRegister: 'clickToRegister',
  waitingForWin: 'waitingForWin',
  confirmNotAfk: 'confirmNotAfk',
  forbiddenKnowledge: 'forbiddenKnowledge',
};

const MESSAGES = {
  gameStarted: 'Active',
  gameEnded: 'Ended',
};

var twitch = window.Twitch.ext;

var requests = {
  checkStatus: createRequest('GET', 'CheckStatus', logSuccess, logError),
  register: createRequest('POST', 'Register', logSuccess, logError),
  forbiddenKnowledge: createRequest('GET', 'ForbiddenKnowledge', logSuccess, logError),
};

twitch.onContext(function (context) {
  setTheme(context.theme);
});

twitch.configuration.onChanged(function () {
  var config = JSON.parse(twitch.configuration.global.content);
  setConfig(config, requests);
});

twitch.onAuthorized(function (auth) {
  if (auth.userId.toString().startsWith('A')) {
    setVisibleDiv(DIVS.notLoggedIn, DIVS);
    removeLoadingSpinner();
    twitch.unlisten('broadcast', handleBroadcast);
    return;
  }

  $('#btnShareIdentity').html('Share Account Details');
  twitch.listen('whisper-' + auth.userId, function (targ, cType, message) {
    if (message === 'Winner') {
      setVisibleDiv(DIVS.confirmNotAfk, DIVS);
      //todo: notify broadcaster
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
  if (data.gameStatus === MESSAGES.gameStarted) {
    if (!data.registered) {
      setVisibleDiv(twitch.viewer.isLinked ? DIVS.clickToRegister : DIVS.identityShare, DIVS);
    } else if (data.winner) {
      setVisibleDiv(DIVS.confirmNotAfk, DIVS);
    } else {
      setVisibleDiv(DIVS.waitingForWin, DIVS);
    }
  } else if (data.gameStatus === MESSAGES.gameEnded) {
    setVisibleDiv(DIVS.gameNotStarted, DIVS);
  }
  removeLoadingSpinner();
}

function obtainTheForbiddenKnowledge() {
  var req = requests.forbiddenKnowledge;
  req.success = [
    logSuccess,
    (data) => {
      if (!data.success) return;
      $('#txtLobbyId').val(data.lobbyId);
      $('#txtLobbyPassword').val(data.lobbyPassword);
      setVisibleDiv(DIVS.forbiddenKnowledge, DIVS);
    },
  ];
  $.ajax(req);
}

function handleBroadcast(targ, cType, message) {
  if (message === MESSAGES.gameStarted) {
    setVisibleDiv(twitch.viewer.isLinked ? DIVS.clickToRegister : DIVS.identityShare, DIVS);
  } else if (message === MESSAGES.gameEnded) {
    setVisibleDiv(DIVS.gameNotStarted, DIVS);
  }
}

$(function () {
  $('#btnRegister').click(function () {
    $(this).html('<span class="spinner-border spinner-border-sm"></span>');
    var req = requests.register;
    req.data = JSON.stringify({
      isSubscriber: twitch.viewer.subscriptionStatus ? true : false,
      realUserId: twitch.viewer.id,
    });
    req.success = [
      logSuccess,
      (data) => {
        if (!data.success) return;
        $(this).html('Join Raffle');
        setVisibleDiv(DIVS.waitingForWin, DIVS);
      },
    ];
    $.ajax(req);
  });

  $('#btnShareIdentity').click(function () {
    if (twitch.viewer.isLinked) return;
    $(this).html('<span class="spinner-border spinner-border-sm"></span>');
    twitch.actions.requestIdShare();
  });

  $('#btnConfirmYes').click(function () {
    obtainTheForbiddenKnowledge();
    //todo: notify broadcaster
    //todo: log to db
  });

  if (localtest) {
    $('#cheat').html('<button type="button" id="btnCheat" class="btn btn-info btn-sm" style="width: 122px;">CHEAT</button>');
    $('#btnCheat').click(function () {
      setVisibleDiv(DIVS.confirmNotAfk, DIVS);
    });
  }

  // listen for incoming EBS pubsubs
  twitch.listen('broadcast', handleBroadcast);
});
