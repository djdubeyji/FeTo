/**
 * This file is used to wrap the templates exported in the global namespace
 * by Google Closure Compile with an AMD module. The goal of this AMD module
 * is to hold a reference to the templates, even when they are removed from
 * the global namespace.
 */
define('jira/empty-states/template', [], function () {
  'use strict';

  return window.JIRA.Templates.EmptyStates;
});