(function() {
  'use strict';

  // In case this script has already been run and modified the DOM on a previous page in github,
  // make sure to reset it.
  (function removePreviousArrows() {
    const arrows = document.querySelectorAll('span.collapser');
    arrows.forEach(a => a.parentNode.removeChild(a));
    const ellipsis = document.querySelectorAll('.ellipsis');
    ellipsis.forEach(a => a.parentNode.removeChild(a));
  })()

  const [...codeLines] = document.querySelectorAll('.file table.highlight .blob-code-inner');
  const codeLinesText = codeLines.map(l => l.textContent);

  const _arrow =
    '<svg version="1.1" width="7px" fill="#969896" xmlns="http://www.w3.org/2000/svg" '+
      'xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">'+
      '<metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>' +
      '<g><path d="M579.5,879.8c-43.7,75.7-115.3,75.7-159,0L28.7,201.1c-43.7-75.7-8-137.7,79.5-137.7h783.7c87.5,0,123.2,62,79.5,137.7L579.5,879.8z"></path></g>'+
    '</svg>';

  class Element {
    constructor(name) {
      this.element = document.createElement(name);
    }
    addClass(className) {
      this.element.classList.add(className)
      return this;
    }
    setId(id) {
      this.element.id = id;
      return this;
    }
    setHTML(str) {
      this.element.innerHTML = str;
      return this;
    }
  }

  const arrowFactory = (id) => {
    return new Element('span')
      .addClass('collapser')
      .setId(id)
      .setHTML(_arrow)
      .element;
  }

  const ellipsisFactory = (id) => {
    return new Element('span')
      .addClass('pl-smi')
      .addClass('ellipsis')
      .setId(id)
      .setHTML('...')
      .element;
  };

  const spaceMap = new Map();
  const pairs = new Map();
  const stack = [];
  const blockStarts = [];
  const countLeadingWhitespace = arr => {
    const getWhitespaceIndex = i => {
      if (arr[i] !== ' ' && arr[i] !== '\t') {
        return i;
      }
      i++;
      return getWhitespaceIndex(i);
    }
    return getWhitespaceIndex(0);
  };

  const last = arr => arr[arr.length - 1];
  const getPreviousSpaces = (map, lineNum) => {
    let prev = map.get(lineNum - 1);
    return prev === -1 ? getPreviousSpaces(map, lineNum - 1) : {lineNum: lineNum - 1, count: prev};
  };

  for (let lineNum = 0; lineNum < codeLinesText.length; lineNum++) {
    let line = codeLinesText[lineNum];
    let count = line.trim().length ? countLeadingWhitespace(line.split('')) : -1;
    spaceMap.set(lineNum, count);

    function tryPair() {
      let top = last(stack);
      if (count !== -1 && count <= spaceMap.get(top)) {
        pairs.set(top, lineNum);
        codeLines[top].setAttribute('block-start', 'true');
        codeLines[top].appendChild(arrowFactory(`gcf-${top + 1}`));
        blockStarts.push(codeLines[top]);
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
      const sliced = codeLines.slice(start, end);
      sliced.forEach(elem => {
        let tr = elem.parentNode;
        if (tr.classList) {
          tr.classList.add('hidden-line');
        } else {
          tr.className += ' hidden-line';
        }
        // Check if any children blocks of this parent block have previously
        // been collapsed so we can remove ellipsis and reset arrows
        let previouslyCollapsed = elem.querySelectorAll('.ellipsis');
        previouslyCollapsed.forEach(block => {
          block.previousSibling.classList.remove('sideways');
          block.parentNode.removeChild(block);
        });
      });
      codeLines[start - 1].appendChild(ellipsisFactory(`ellipsis-${start - 1}`));
    } else if (action === 'show') {
      const sliced = codeLines.slice(start, end);
      const topLine = codeLines[start - 1];
      sliced.forEach(elem => {
        let tr = elem.parentNode;
        if (tr.classList) {
          tr.classList.remove('hidden-line');
        } else {
          tr.className.replace(' hidden-line', '');
        }
      });
      topLine.removeChild(topLine.lastChild);
    }
  };

  const arrows = document.querySelectorAll('.collapser');
  function arrowListener(e) {
    e.preventDefault();
    let svg = e.currentTarget;
    let td = e.currentTarget.parentElement;
    let id = td.getAttribute('id');
    let index = parseInt(id.slice(2)) - 1;
    if (svg.classList.contains('sideways')) {
      svg.classList.remove('sideways');
      toggleCode('show', index + 1, pairs.get(index));
    } else {
      svg.classList.add('sideways');
      toggleCode('hide', index + 1, pairs.get(index));
    }
  };

  arrows.forEach(c => {
    c.addEventListener('click', arrowListener);
  });

  function ellipsisListener(e) {
    if (!e.target.parentElement) return;
    if (e.target.classList.contains('ellipsis')) {
      let td = e.target.parentElement;
      let svg = td.querySelector('.sideways');
      let id = e.target.parentElement.getAttribute('id');
      let index = parseInt(id.slice(2)) - 1;
      svg.classList.remove('sideways');
      toggleCode('show', index + 1, pairs.get(index));
    }
  };

  blockStarts.forEach(line => {
    line.addEventListener('click', ellipsisListener);
  });
})()
