(function () {
    'use strict';

    const classes = {
        hidden: 'gcf-hidden-line',
        sideways: 'gcf-sideways',
        collapser: 'gcf-collapser',
        ellipsis: 'gcf-ellipsis',
        blockStart: 'gcf-block-start',
        previouslyCollapsed: 'gcf-stay-hidden',
    };

    // Clear old classes and attributes from previous page loads
    document.querySelectorAll('.' + classes.collapser).forEach((arrow) => {
        arrow.parentElement.removeChild(arrow);
    });

    document.querySelectorAll('.' + classes.ellipsis).forEach((el) => {
        el.parentElement.removeChild(el);
    });

    document.querySelectorAll(`[${classes.previouslyCollapsed}]`).forEach((el) => {
        el.removeAttribute(`[${classes.previouslyCollapsed}]`);
    });

    const codeLines = [...document.querySelectorAll('table.js-file-line-container tr .blob-code-inner')];
    const codeLinesText = codeLines.map((l) => l.textContent);

    const _arrow =
        '<svg version="1.1" width="7px" fill="#969896" xmlns="http://www.w3.org/2000/svg" ' +
        'xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">' +
        '<metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>' +
        '<g><path d="M579.5,879.8c-43.7,75.7-115.3,75.7-159,0L28.7,201.1c-43.7-75.7-8-137.7,79.5-137.7h783.7c87.5,0,123.2,62,79.5,137.7L579.5,879.8z"></path></g>' +
        '</svg>';

    class Element {
        constructor(name) {
            this.element = document.createElement(name);
        }
        addClass(className) {
            this.element.classList.add(className);
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
        return new Element('span').addClass(classes.collapser).setId(id).setHTML(_arrow).element;
    };

    const ellipsisFactory = (id) => {
        return new Element('span').addClass('pl-smi').addClass(classes.ellipsis).setId(id).setHTML('...').element;
    };

    const spaceMap = new Map();
    const pairs = new Map();
    const stack = [];
    const blockStarts = [];
    const countLeadingWhitespace = (arr) => {
        const getWhitespaceIndex = (i) => {
            if (arr[i] !== ' ' && arr[i] !== '\t') {
                return i;
            }
            i++;
            return getWhitespaceIndex(i);
        };
        return getWhitespaceIndex(0);
    };

    const last = (arr) => arr[arr.length - 1];
    const getPreviousSpaces = (map, lineNum) => {
        let prev = map.get(lineNum - 1);
        return prev === -1 ? getPreviousSpaces(map, lineNum - 1) : { lineNum: lineNum - 1, count: prev };
    };

    for (let lineNum = 0; lineNum < codeLinesText.length; lineNum++) {
        let line = codeLinesText[lineNum];
        let count = line.trim().length ? countLeadingWhitespace(line.split('')) : -1;
        spaceMap.set(lineNum, count);

        function tryPair() {
            let top = last(stack);
            if (count !== -1 && count <= spaceMap.get(top)) {
                pairs.set(top, lineNum);
                // codeLines[top].setAttribute(classes.blockStart, true);
                const arrow = arrowFactory(`gcf-${top + 1}`);
                codeLines[top].prepend(arrow);
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
            sliced.forEach((elem) => {
                const tr = elem.parentElement;

                // If a line was already hidden, there was an inner block that
                // was previously collapsed. Setting this attribute will
                // protect the inner block from being expanded
                // when this current outer block is expanded
                if (tr.classList.contains(classes.hidden)) {
                    tr.setAttribute(classes.previouslyCollapsed, true);
                }
                tr.classList.add(classes.hidden);
            });
            codeLines[start - 1].appendChild(ellipsisFactory(`ellipsis-${start - 1}`));
        } else if (action === 'show') {
            const sliced = codeLines.slice(start, end);
            const topLine = codeLines[start - 1];

            sliced.forEach((elem) => {
                const tr = elem.parentElement;
                if (!tr.getAttribute(classes.previouslyCollapsed)) {
                    tr.classList.remove(classes.hidden);
                } else {
                    tr.removeAttribute(classes.previouslyCollapsed);
                }
            });
            topLine.removeChild(topLine.lastChild);
        }
    };

    const arrows = document.querySelectorAll('.' + classes.collapser);
    function arrowListener(e) {
        e.preventDefault();
        let svg = e.currentTarget;
        let td = e.currentTarget.parentElement;
        let id = td.getAttribute('id');
        let index = parseInt(id.slice(2)) - 1;
        if (svg.classList.contains(classes.sideways)) {
            svg.classList.remove(classes.sideways);
            toggleCode('show', index + 1, pairs.get(index));
        } else {
            svg.classList.add(classes.sideways);
            toggleCode('hide', index + 1, pairs.get(index));
        }
    }

    arrows.forEach((c) => {
        c.addEventListener('click', arrowListener);
    });

    function ellipsisListener(e) {
        if (!e.target.parentElement) return;
        if (e.target.classList.contains(classes.ellipsis)) {
            let td = e.target.parentElement;
            let svg = td.querySelector('.' + classes.sideways);
            let id = e.target.parentElement.getAttribute('id');
            let index = parseInt(id.slice(2)) - 1;
            svg.classList.remove(classes.sideways);
            toggleCode('show', index + 1, pairs.get(index));
        }
    }

    blockStarts.forEach((line) => {
        line.addEventListener('click', ellipsisListener);
    });
})();
