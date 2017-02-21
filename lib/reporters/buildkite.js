/**
 * Module dependencies.
 */

var Base = require('./base');
var inherits = require('../utils').inherits;
var color = Base.color;
var cursor = Base.cursor;

/**
 * Expose `BuildKite`.
 */

exports = module.exports = BuildKite;

// recursive function to traverse up the family tree, until the suite below root
// is found.  Then we make it print the buildkite string to expand the previous
// collapsed section.
var expandTopSuiteAfterFailure = function(suite) {
  if (!suite.parent.root) { // recurse!
    failTopSuite(suite.parent);
    return;
  }

  suite.afterAll(function() {
    console.log("^^^+++"); // exapnd the previous section
  });
}

/**
 * Initialize a new `BuildKite` test reporter.
 *
 * @api public
 * @param {Runner} runner
 */
function BuildKite(runner) {
  Base.call(this, runner);

  var self = this;
  var indents = 0;
  var n = 0;

  function indent() {
    return Array(indents).join('  ');
  }

  runner.on('start', function() {
    console.log();
  });

  runner.on('suite', function(suite) {
    ++indents;

    if ( !suite.root && suite.parent.root ) {
      console.log(color('suite', '%s%s'), "--- ", suite.title);
    } else {
      console.log(color('suite', '%s%s'), indent(), suite.title);
    }
  });

  runner.on('suite end', function() {
    --indents;
    if (indents === 1) {
      console.log();
    }
  });

  runner.on('pending', function(test) {
    var fmt = indent() + color('pending', '  - %s');
    console.log(fmt, test.title);
  });

  runner.on('pass', function(test) {
    var fmt;
    if (test.speed === 'fast') {
      fmt = indent()
        + color('checkmark', '  ' + Base.symbols.ok)
        + color('pass', ' %s');
      cursor.CR();
      console.log(fmt, test.title);
    } else {
      fmt = indent()
        + color('checkmark', '  ' + Base.symbols.ok)
        + color('pass', ' %s')
        + color(test.speed, ' (%dms)');
      cursor.CR();
      console.log(fmt, test.title, test.duration);
    }
  });

  runner.on('fail', function(test) {
    cursor.CR();
    expandTopSuiteAfterFailure(test.parent);
    console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
  });

  runner.on('end', function() {
    console.log("+++ Result"); // make the result have it's own section
    self.epilogue();
  });
}

/**
 * Inherit from `Base.prototype`.
 */
inherits(BuildKite, Base);
