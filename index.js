/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author nighca <nighca@live.cn>
*/

var fs = require('fs');
var path = require('path');
var Crox = require('crox-p');

var includeReg = /\{\{\s*include[\s\n\r]+[\"\']?([^\s\"\']*)\s*[\"\']?([^(\}\})]*)\}\}/gm;

var precompile = function (root, tmpl, stack, handler) {
    return tmpl.replace(includeReg, function(includeStmt, included, other) {
        var tplPath = path.join(path.dirname(root), included);
        if (stack.indexOf(tplPath) != -1) {
            throw Error('[Crox] Circular dependency detected: ' + stack.join(' --> '));
        }
        if (fs.existsSync(tplPath)) {
            stack.push(tplPath);

            handler(tplPath);

            var content = fs.readFileSync(tplPath).toString();
            var result = precompile(tplPath, content, stack, handler);

            stack.pop();
            return [
                '{{include "start"' + other + '}}',
                result,
                '{{include "end"' + other + '}}'
            ].join('\n');
        } else {
            throw Error('[Crox] File not found: ' + tplPath);
        }
    });
};

module.exports = function(content) {
	this.cacheable && this.cacheable();

	var loader = this;
	content = precompile(this.resourcePath, content, [this.resourcePath], function (p) {
		loader.addDependency(p);
	});

    // do strip
    content = content.replace(/(\s*\n\r*\s*)+/g, '\n');

	return 'module.exports = ' + Crox.compile(content).toString();
};