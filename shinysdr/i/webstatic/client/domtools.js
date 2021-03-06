// Copyright 2014, 2017 Kevin Reid <kpreid@switchb.org>
// 
// This file is part of ShinySDR.
// 
// ShinySDR is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// ShinySDR is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with ShinySDR.  If not, see <http://www.gnu.org/licenses/>.

define([], () => {
  'use strict';
  
  const exports = {};
  
  // HTML element life cycle facility. It is expected that:
  // "init" is fired when the element has been inserted in the document (and has approximately correct layout)
  // "destroy" is fired when the element and its children are going to be discarded (not reused)
  
  function fireLifecycleEvent(element, condition) {
    const key = '__shinysdr_lifecycle_' + condition + '__';
    if (key in element) {
      element[key].forEach(function(callback) {
        // TODO: error handling and think about scheduling
        callback();
      });
    }
  }
  
  function addLifecycleListener(element, condition, callback) {
    const key = '__shinysdr_lifecycle_' + condition + '__';
    if (!(key in element)) {
      element[key] = [];
    }
    element[key].push(callback);
  }
  exports.addLifecycleListener = addLifecycleListener;
  
  function lifecycleInit(element) {
    if (element.__shinysdr_lifecycle__ !== undefined) return;
    
    let root = element;
    while (root.parentNode) root = root.parentNode;
    if (root.nodeType !== Node.DOCUMENT_NODE) return;
    
    element.__shinysdr_lifecycle__ = 'live';
    fireLifecycleEvent(element, 'init');
  }
  exports.lifecycleInit = lifecycleInit;
  
  function lifecycleDestroy(element) {
    if (element.__shinysdr_lifecycle__ !== 'live') return;
    
    element.__shinysdr_lifecycle__ = 'dead';
    fireLifecycleEvent(element, 'destroy');
    
    Array.prototype.forEach.call(element.children, function (childEl) {
      lifecycleDestroy(childEl);
    });
  }
  exports.lifecycleDestroy = lifecycleDestroy;
  
  // "Reveal" facility.
  // To reveal a node is to make it visible on-screen (as opposed to hidden by some hidden/collapsed container).
  // Custom collapsible-things may add event listeners to handle revealing.
  function reveal(node) {
    node.dispatchEvent(new CustomEvent('shinysdr:reveal', {
      bubbles: true
    }));
    
    // Handle built-in elements
    for (let parent = node; parent; parent = parent.parentNode) {
      switch (parent.nodeName.toLowerCase()) {
        case 'details':
          parent.open = true;
          break;
        case 'dialog':
          parent.open();
          break;
      }
      
      if (!parent.parentNode && parent !== node.ownerDocument) {
        console.warn('domtools.reveal: tried to reveal an un-rooted node', node);
        return false;
      }
    }

    if (node.offsetWidth === 0) {
      // TODO: Find a better test that can't false-positive if the node is currently empty
      console.warn('domtools.reveal: apparently failed to reveal', node);
      return false;
    }
    return true;
  }
  exports.reveal = reveal;
  
  return Object.freeze(exports);
});
