const DIVS = {
  gameSettings: 'gameSettings',
};

const MESSAGES = {
  gameStarted: 'Active',
  someoneRegistered: 'someoneRegistered',
};

var twitch = window.Twitch.ext;
var entryCount = 0;

var requests = {
  startthegamealready: createRequest('POST', 'StartTheGameAlready', logSuccess, logError),
  updateGameSettings: createRequest('POST', 'UpdateGameSettings', logSuccess, logError),
  roll: createRequest('POST', 'Roll', logSuccess, logError),
  endGame: createRequest('POST', 'EndGame', logSuccess, logError),
  checkStatus: createRequest('GET', 'CheckStatus', logSuccess, logError),
};

twitch.onContext(function (context) {
  twitch.rig.log(context);
});

twitch.configuration.onChanged(function () {
  var config = JSON.parse(twitch.configuration.global.content);
  setConfig(config, requests);
});

twitch.onAuthorized(function (auth) {
  setAuth(auth.token, requests);
  checkStatus();
});

function logError(obj, error, status) {
  twitch.rig.log(
    'EBS request returned ' + JSON.stringify(status) + ' (' + JSON.stringify(error) + ') : ' + JSON.stringify(obj)
  );
}

function logSuccess(data, status) {
  twitch.rig.log('EBS request returned ' + JSON.stringify(data) + ' (' + status + ')');
}

function checkStatus() {
  var req = requests.checkStatus;
  req.success = [
    logSuccess,
    (data) => {
      if (data.gameStatus === MESSAGES.gameStarted) {
        $('#txtLobbyId').val(data.lobbyId);
        $('#txtLobbyPassword').val(data.lobbyPassword);
        $('#numSubMult').val(data.subMult);
        setEntryCount(data.entryCount);
        $('#btnUpdateSettings').html('Update Settings');
        $('#btnRoll').removeClass('disabled');
      }
      removeLoadingSpinner();
      $('#gameSettings').removeAttr('hidden');
    },
  ];
  $.ajax(req);
}

function incrementEntryCount() {
  entryCount += 1;
  $('#entryCount').text(entryCount);
}

function setEntryCount(val) {
  entryCount = val;
  $('#entryCount').text(entryCount);
}

function resetEntryCount() {
  entryCount = 0;
  $('#entryCount').text(entryCount);
}

$(function () {
  $('#btnUpdateSettings').click(function () {
    $('#btnUpdateSettings').addClass('loading');
    var req = requests.updateGameSettings;
    req.data = JSON.stringify({
      lobbyId: $('#txtLobbyId').val(),
      lobbyPassword: $('#txtLobbyPassword').val(),
      subMult: $('#numSubMult').val() === '' || !$('#numSubMult').val() ? 1 : $('#numSubMult').val(),
      extVersion: getExtVersion(),
    });
    req.success = [
      logSuccess,
      () => {
        $('#btnUpdateSettings').removeClass('loading');
        $('#btnRoll').removeClass('disabled');
        $('#btnUpdateSettings').html('Update Settings');
      },
    ];
    $.ajax(req);
  });

  $('#btnRoll').click(function () {
    if ($('#txtNumToRoll').val() === '' || !$('#txtNumToRoll').val()) return;
    $('#btnRoll').addClass('loading');
    var req = requests.roll;
    req.data = JSON.stringify({
      numToRoll: $('#txtNumToRoll').val(),
      extVersion: getExtVersion(),
    });
    req.success = [
      logSuccess,
      () => {
        $('#btnRoll').removeClass('loading');
      },
    ];
    $.ajax(req);
  });

  $('#btnEndGame').click(function () {
    $('#btnEndGame').addClass('loading');
    var req = requests.endGame;
    req.data = JSON.stringify({
      extVersion: getExtVersion(),
    });
    req.success = [
      logSuccess,
      () => {
        $('#btnUpdateSettings').html('Start Raffle');
        $('#txtLobbyId').val('');
        $('#txtLobbyPassword').val('');
        $('#numSubMult').val(1);
        $('#btnEndGame').removeClass('loading');
        $('#btnRoll').addClass('disabled');
        resetEntryCount();
      },
    ];
    $.ajax(requests.endGame);
  });

  // listen for incoming EBS pubsubs
  twitch.listen('broadcast', function (target, contentType, message) {
    if (message === MESSAGES.someoneRegistered) {
      incrementEntryCount();
    }
  });
});
