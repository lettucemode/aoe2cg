const DIVS = {
  gameSettings: 'gameSettings',
};

const MESSAGES = {
  gameStarted: 'Active',
  someoneRegistered: 'someoneRegistered',
};

var twitch = window.Twitch.ext;
var entryCount = 0;
var winnersForStatusDisplay = [];

var requests = {
  startthegamealready: createRequest('POST', 'StartTheGameAlready', logSuccess, logError),
  updateGameSettings: createRequest('POST', 'UpdateGameSettings', logSuccess, logError),
  roll: createRequest('POST', 'Roll', logSuccess, logError),
  endGame: createRequest('POST', 'EndGame', logSuccess, logError),
  checkStatus: createRequest('GET', 'CheckStatus', logSuccess, logError),
};

twitch.onContext(function (context) {
  setTheme(context.theme);
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
        addNewWinners(data.winners);
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

function addNewWinners(newWinners) {
  $.each(newWinners, (i, v) => {
    winnersForStatusDisplay.push({
      displayName: v.displayName,
      ouid: v.opaqueUserId,
      confirmed: v.confirmed,
    });
  });
  drawWinnerStatusDisplay();
}

function clearWinners() {
  winnersForStatusDisplay = [];
  drawWinnerStatusDisplay();
}

function drawWinnerStatusDisplay() {
  $('#winnerStatusDisplay').empty();
  $.each(winnersForStatusDisplay, (i, v) => {
    $('#winnerStatusDisplay').append(
      '<div class="row m-1">' +
        '<button type="button" class="btn btn-sm ' + (v.confirmed ? "btn-success" : "btn-secondary") + '" style="font-size: .75em">' + 
          v.displayName + ' ' + 
          (v.confirmed ? '<img src="/bootstrap/icons/person-check-fill.svg" alt="" width="16" height="16">' : '<div class="spinner-border spinner-border-sm"></div>') +
        '</button>' +
      '</div>'
    );
  });
}

$(function () {
  $('#btnUpdateSettings').click(function () {
    $(this).html('<span class="spinner-border spinner-border-sm"></span>');
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
        $('#btnRoll').removeClass('disabled');
        $(this).html('Update Settings');
      },
    ];
    $.ajax(req);
  });

  $('#btnRoll').click(function () {
    if ($('#txtNumToRoll').val() === '' || !$('#txtNumToRoll').val()) return;
    if ($(this).prop('disabled')) return;
    $(this).html('<span class="spinner-border spinner-border-sm"></span>');
    var req = requests.roll;
    req.data = JSON.stringify({
      numToRoll: $('#txtNumToRoll').val(),
      extVersion: getExtVersion(),
    });
    req.success = [
      logSuccess,
      (data) => {
        $(this).html('Roll');
        if (!data.success) return;
        var newWinners = JSON.parse(data.winners);
        addNewWinners(newWinners);
      },
    ];
    $.ajax(req);
  });

  $('#btnEndGame').click(function () {
    $(this).html('<span class="spinner-border spinner-border-sm"></span>');
    var req = requests.endGame;
    req.data = JSON.stringify({
      extVersion: getExtVersion(),
    });
    req.success = [
      logSuccess,
      () => {
        $(this).html('Close Raffle');
        $('#btnUpdateSettings').html('Start Raffle');
        $('#txtLobbyId').val('');
        $('#txtLobbyPassword').val('');
        $('#numSubMult').val(1);
        $('#btnRoll').addClass('disabled');
        resetEntryCount();
        clearWinners();
      },
    ];
    $.ajax(requests.endGame);
  });

  // listen for incoming EBS pubsubs
  twitch.listen('broadcast', function (target, contentType, message) {
    if (message === MESSAGES.someoneRegistered) {
      incrementEntryCount();
    } else if (message.startsWith('confirmed ')) {
      var confirmedOpaqueId = message.substring(10);
      $.each(winnersForStatusDisplay, (i, v) => {
        if (v.ouid === confirmedOpaqueId) {
          v.confirmed = true;
        }
      });
      drawWinnerStatusDisplay();
    }
  });
});
