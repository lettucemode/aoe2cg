function setAuth(token, requests) {
  Object.keys(requests).forEach((req) => {
    requests[req].headers = { Authorization: 'Bearer ' + token };
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
  $('#spinner').removeClass('active');
  $('#placeholder').attr('hidden', 'true');
}
