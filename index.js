var _uglify = require('uglify-js');
var _jsp = _uglify.parser;
var _pro = _uglify.uglify;
var _url = require('url');
var _fs = require('fs');
var _os = require('os');
var _path = require('path');
var _tsapi = require("typescript.api");

var defaults = {
	compress:    true,
	files:       [],
	dest:        null,
	mangle:      true,
	squeeze:     true,
	force:       false,
	verbose:     false,
	cacheOutput: true
};


_tsapi.reset({languageVersion: "EcmaScript5"});

function compilets(file, code, cb)
{
	function fail(units)
	{
		var str = '';
		for (var n in units)
		{

			for (var m in units[n].diagnostics)
			{
				if (str.length)
				{
					str += '\n';
				}

				str += units[n].diagnostics[m].toString();
			}
		}

		cb(new Error(str));
	}


	_tsapi.resolve([file], function (resolved)
	{

		if (!_tsapi.check(resolved))
		{
			return fail(resolved);
		}
		else
		{
			_tsapi.compile(resolved, function (compiled)
			{

				if (!_tsapi.check(compiled))
				{
					return fail(compiled);
				}
				else
				{
					return cb(null, compiled.map(function (u)
					{
						return u.content;
					}).join('\n'));
				}
			});
		}
	});
}

module.exports = function (options)
{

	if (!options)
	{
		options = {};
	}
	for (var opt in defaults)
	{
		if (typeof(options[opt]) == "undefined")
		{
			options[opt] = defaults[opt];
		}
	}

	if (!options.dest)
	{
		throw new Error("Uglifile: destination path not set.");
	}

	function cacheFilePath(file)
	{
		var pre = ['compress', 'mangle', 'squeeze'].map(function(p) { return options[p] ? '1' : '0'; }).join('_');

		var cache = _path.join(_os.tmpDir(), 'uglifile_' + pre + file.replace(/\//g, '_'));

 		return cache;
	}

	function compileFile(file, callback)
	{
		if (!_fs.existsSync(file))
		{
			return callback(new Error(file + ' does not exist'));
		}

		var fCache = options.cacheOutput && _path.extname(file) == '.ts';

		var stats = _fs.statSync(file);

		// Only cache typescript for now
		if (fCache)
		{
			var cfile = cacheFilePath(file);

			try
			{
				var cs = _fs.statSync(cfile);

				if (cs.mtime.getTime() == stats.mtime.getTime())
				{
					// Cache file is good, send it back
					var str = _fs.readFileSync(cfile, 'utf8');

					if (!options.compress)
						str = "\n\n// " + file + "\n\n" + str;

					return callback(null, str);
				}

			}
			catch(ex)
			{
				// No cache item, fall through
			}
		}

		var start;
		if (options.verbose)
			start = Date.now();

		_fs.readFile(file, 'utf8', function (err, code)
		{
			if (err)
			{
				return callback(err);
			}

			function saveCacheFile(js)
			{
				var cfile = cacheFilePath(file);

				_fs.writeFileSync(cfile, js, 'utf8');

				_fs.utimesSync(cfile, stats.atime, stats.mtime);
			}

			function finish(js)
			{
				if (fCache)
					saveCacheFile(js);

				if (options.verbose)
				{
					console.log('Compiled %s in %d ms', file, Date.now() - start);
					if (fCache)
						console.log('    => %s', cfile);

				}
			}

			// Check for typescript

			function uglify(js)
			{
				if (!options.compress)
				{
					finish(js);

					return callback(null, "\n\n// " + file + "\n\n" + js);
				}

				var ast = _jsp.parse(js);
				if (options.mangle)
				{
					ast = _pro.ast_mangle(ast);
				}

				if (options.squeeze)
				{
					ast = _pro.ast_squeeze(ast);
				}

				var ugly = _pro.gen_code(ast);

				finish(ugly);

				callback(null, ugly);
			}

			if (_path.extname(file) === '.ts')
			{
				compilets(file, code, function (err, str)
				{
					if (err)
					{
						return callback(err);
					}

					uglify(str);
				});
			}
			else
			{
				uglify(code);
			}

		});
	}

	var fileIndex;
	var output;

	function compile(callback)
	{
		fileIndex = 0;
		output = "";
		function compileFiles()
		{
			var start;

			if (fileIndex >= options.files.length)
			{
				return _fs.writeFile(options.dest, output, 'utf8', callback);
			}

			var file = options.files[fileIndex++];

			compileFile(file, function (err, str)
			{
				if (err)
				{
					return callback(err);
				}

				output += str + ';\n';

				process.nextTick(compileFiles);
			});
		}

		compileFiles();
	}

	return function (req, res, next)
	{

		if (options.force)
		{
			return compile(function (err)
			{
				if (err)
				{
					return next(err);
				}

				res.sendfile(options.dest, {root:'/'});
			});
		}

		_fs.stat(options.dest, function (err, uglyStats)
		{
			if (err)
			{
				// gonna swallow the other errors and assume the file doesn't exist
				return compile(function (err)
				{
					if (err)
						return next(err);

					res.sendfile(options.dest,{root:'/'});
				});
			}
			res.sendfile(options.dest);
		});
	};
};
