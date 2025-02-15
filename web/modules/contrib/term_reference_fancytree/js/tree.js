(function ($, Drupal, drupalSettings) {
  'use strict';

  $.ui.fancytree._FancytreeClass.prototype.selectAllWithLazyLoad = function(topOnly) {
    var tree = this;

    tree.visit(function(node) {
      node.setSelected(true);

      if (node.isSelected()) {
        if (node.isUndefined()) {
          // Load and select all child nodes
          node.load().done(function () {
            node.visit(function (childNode) {
              childNode.setSelected(true);
            });
          });
        } else {
          // Select all child nodes
          node.visit(function (childNode) {
            childNode.setSelected(true);
          });
        }
      }
    });
  };

  /**
   * Attaches the JS.
   */
  Drupal.behaviors.TermReferenceFancyTree = {
    attach: function (context, settings) {
      // Loop through each fancytree (each field) in our settings.
      for (let key in settings.term_reference_fancytree) {
        // Get the settings the tree.
        let treeSettings = settings.term_reference_fancytree[key].tree || [];
        if (treeSettings instanceof Array) {
          for (let i = 0; i < treeSettings.length; i++) {
            // Initialise a new Fancytree with our settings.
            $('#' + treeSettings[i].id).once('term-reference-fancytree').each(function () {
              new Drupal.TermReferenceFancyTree(treeSettings[i].id, treeSettings[i].name, treeSettings[i].source, treeSettings[i].select_children);

              if (treeSettings[i].select_all) {
                $('#' + treeSettings[i].id + ' .selectAll').click(function () {
                  $.ui.fancytree.getTree('#' + treeSettings[i].id).selectAllWithLazyLoad();
                  return false;
                });
              }
            });
          }
        }
      }
    }
  };

  /**
   * FancyTree integration.
   *
   * @param {string} id The id of the wrapping div element
   * @param {string} name The form element name (used in $_POST)
   * @param {object} source The JSON object representing the initial tree
   * @param {int} select_children Flag to select the children terms when parent is selected
   */
  Drupal.TermReferenceFancyTree = function (id, name, source, select_children) {
    // Settings generated by http://wwwendt.de/tech/fancytree/demo/sample-configurator.html
    $('#' + id).fancytree({
      activeVisible: true, // Make sure, active nodes are visible (expanded).
      aria: true, // Enable WAI-ARIA support.
      autoActivate: true, // Automatically activate a node when it is focused (using keys).
      autoCollapse: false, // Automatically collapse all siblings, when a node is expanded.
      autoScroll: true, // Automatically scroll nodes into visible area.
      clickFolderMode: 4, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
      checkbox: true, // Show checkboxes.
      debugLevel: 2, // 0:quiet, 1:normal, 2:debug
      disabled: false, // Disable control
      focusOnSelect: false, // Set focus when node is checked by a mouse click
      generateIds: false, // Generate id attributes like <span id='fancytree-id-KEY'>
      idPrefix: 'ft_', // Used to generate node id´s like <span id='fancytree-id-<key>'>.
      icon: true, // Display node icons.
      keyboard: true, // Support keyboard navigation.
      keyPathSeparator: '/', // Used by node.getKeyPath() and tree.loadKeyPath().
      minExpandLevel: 1, // 1: root node is not collapsible
      quicksearch: true, // Navigate to next node by typing the first letters.
      selectMode: 2, // 1:single, 2:multi, 3:multi-hier
      tabindex: 0, // Whole tree behaves as one single control
      titlesTabbable: true, // Node titles can receive keyboard focus
      lazyLoad: function (event, data) {
        // Load child nodes via ajax GET /term_reference_fancytree/parent=1234&vocab=true
        data.result = {
          url: Drupal.url('term_reference_fancytree/subTree'),
          data: {parent: data.node.key, vocab: data.node.data.vocab},
          cache: false
        };
      },
      source: source,
      select: function (event, data) {
        // We update the the form inputs on every checkbox state change as
        // ajax events might require the latest state.
        data.tree.generateFormElements(name + '[]');
        // When a selection is made, we need to update the active trail.
        if(data.node.selected){
          data.node.addClass('activeTrail');
          data.node.visitParents(function (node) {
            node.addClass('activeTrail');
          });
        }
        else if(data.node.getSelectedNodes().length === 0){
          data.node.removeClass('activeTrail');
          data.node.visitParents(function (node) {
            node.removeClass('activeTrail');
          });
        }

        if (select_children) {
          if (data.node.isSelected()) {
            if (data.node.isUndefined()) {
              // Load and select all child nodes
              data.node.load().done(function () {
                data.node.visit(function (childNode) {
                  childNode.setSelected(true);
                });
              });
            } else {
              // Select all child nodes
              data.node.visit(function (childNode) {
                childNode.setSelected(true);
              });
            }
          }
        }
      },
      // Change status in bulk for child nodes.
      dblclick: function (event, data) {
        // Get the selection status
        let status = !data.node.selected;
        // Set the parent status.
        data.node.setSelected(status);
        // Go through every child and change the status of the parent.
        data.node.visit(function (node) {
          node.setSelected(status);
        });
      },
      postProcess: function (event, data) {
        data.tree.generateFormElements(name + '[]');
      },
      init: function (event, data) {
        data.tree.generateFormElements(name + '[]');
      }
    });
  };

})(jQuery, Drupal, drupalSettings);
