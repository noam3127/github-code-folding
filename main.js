$(function() {
  'use strict';

  // In case this script has already been run and modified the DOM on a previous page in github,
  // make sure to reset it.
  $('span.collapser').remove();

  const codeLines = $('.file table.highlight .blob-code-inner');
  const codeLinesText = $.map(codeLines, l => $(l).text());
  const triangle =
    '<span class="collapser"><svg version="1.1" width="7px" fill="#969896" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">'+
      '<metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>' +
      '<g><path d="M579.5,879.8c-43.7,75.7-115.3,75.7-159,0L28.7,201.1c-43.7-75.7-8-137.7,79.5-137.7h783.7c87.5,0,123.2,62,79.5,137.7L579.5,879.8z"></path></g>'+
    '</svg><span>';

  const spaceMap = new Map();
  const pairs = new Map();
  const stack = [];

  const countInitialWhiteSpace = arr => {
    const getWhiteSpaceIndex = i => {
      if (arr[i] !== ' ') {
        return i;
      }
      i++;
      return getWhiteSpaceIndex(i);
    }
    return getWhiteSpaceIndex(0);
  };
  const last = arr => arr[arr.length - 1];
  const getPreviousSpaces = (map, lineNum) => {
    let prev = map.get(lineNum - 1);
    return prev === -1 ? getPreviousSpaces(map, lineNum - 1) : {lineNum: lineNum - 1, count: prev};
  };

  for (let lineNum = 0; lineNum < codeLinesText.length; lineNum++) {
    let line = codeLinesText[lineNum];
    let count = line.trim().length ? countInitialWhiteSpace(line.split('')) : -1;
    spaceMap.set(lineNum, count);

    function tryPair() {
      let top = last(stack);
      if (count !== -1 && count <= spaceMap.get(top)) {
        pairs.set(top, lineNum);
        $(codeLines[top]).prepend(triangle);
        stack.pop();
        return tryPair();
      }
    }
    tryPair();

    let prevSpaces = getPreviousSpaces(spaceMap, lineNum);
    if (count > prevSpaces.count) {
      stack.push(prevSpaces.lineNum);
    }
  }

  const toggleCode = (action, start, end) => {
    if (action === 'hide') {
      codeLines.slice(start, end).parent('tr').addClass('hidden-line');

      if ($(codeLines[start - 1]).find('.ellipsis').length === 0) {
        $(codeLines[start - 1]).append($('<span class="pl-smi ellipsis">...</span>'));
      }
    } else if (action === 'show') {
      let sliced = codeLines.slice(start, end);
      sliced.parent('tr').removeClass('hidden-line');
      $(sliced).find('.sideways').removeClass('sideways');
      sliced.find('.ellipsis').remove();
      $(codeLines[start - 1]).find('.ellipsis').remove();
    }

    if (hasLoaded) {
      checkStorage(start, end);
    }
  }

  $('.collapser').on('click', function(elem) {
    let e = $(this);
    let td = e.closest('td').attr('id');
    if (td && td.length) {
      let index = parseInt(td.slice(2)) - 1;
      if (e.hasClass('sideways')) {
        e.removeClass('sideways');
        toggleCode('show', index + 1, pairs.get(index));
      } else {
        e.addClass('sideways');
        toggleCode('hide', index + 1, pairs.get(index));
      }
    }
  });

  $('.file .blob-code-inner').on('click', '.ellipsis', function(elem) {
    let e = $(this);
    let td = e.closest('td').attr('id');
    e.siblings('.sideways').removeClass('sideways');
    if (td && td.length) {
      let index = parseInt(td.slice(2)) - 1;
      toggleCode('show', index + 1, pairs.get(index));
    }
  });

  const STORAGE_ID = document.location.href;
  let hasLoaded = false;

  function checkStorage(start, end) {
    try {
      if (localStorage.getItem(STORAGE_ID) === null) {
        setStorage([]);
      }

      updateStorage(`${start}-${end}`);
    } catch(err) {
      return false;
    }
  }

  function getStorage() {
    return JSON.parse(localStorage.getItem(STORAGE_ID));
  }

  function setStorage(storage) {
    localStorage.setItem(STORAGE_ID, JSON.stringify(storage));
  }

  function updateStorage(key) {
    let isDuplicate = false;
    let [lower, higher] = key.split('-');
    let storage = getStorage();
    let deletions = [];

    storage.forEach(function(item, index) {
      let currentLower = parseInt(item.key.split('-')[0]);

      if (key === item.key) {
        isDuplicate = true;
        deletions.push(index);
      } else if ( (parseInt(lower) < currentLower) && (parseInt(higher) > currentLower) ) {
        deletions.push(index);
      }
    });

    let deletionsLength = deletions.length;
    for (let j = deletionsLength - 1; j >= 0; j--) {
      storage.splice(deletions[j], 1);
    }

    if (!isDuplicate) {
      storage.push({ key: key });
    }

    setStorage(storage);
  }

  (function collapseItemsOnload() {
    try {
      if (localStorage.getItem(STORAGE_ID) !== null) {
        let storage = getStorage();

        storage.forEach(function(item) {
          document.querySelector('#LC' + item.key.split('-')[0] + ' .collapser').click();
        });
      }
    } catch(err) {
      return false;
    }
    hasLoaded = true;
  })();
});
