var uglify = require('uglify-js'),
	jsp = uglify.parser,
	pro = uglify.uglify,
	url = require('url'),
	fs = require('fs');

var defaults = {
	compress: true,
	files: [],
	dest: null,
	mangle: true,
	squeeze: true,
	force: false
};

module.exports = function(options) {

	if (!options) options = {};
	for (opt in defaults) {
		if (typeof(options[opt]) == "undefined") {
			options[opt] = defaults[opt];
		}
	}

	if (!options.dest) {
		throw new Error("Uglifile: destination path not set.");
	}

	function compileFile(file, callback) {
		if (!fs.existsSync(file))
			throw new Error(file + ' does not exist');
		fs.readFile(file, 'utf8', function(err, str) {
			if (err) return next(err);
			if (!options.compress) {
				return callback("\n\n// " + file + "\n\n" + str);
			}
			var ast = jsp.parse(str);
			if (options.mangle) ast = pro.ast_mangle(ast);
			if (options.squeeze) ast = pro.ast_squeeze(ast);
			var ugly = pro.gen_code(ast);

			callback(ugly);
		});
	}

	var fileIndex;
	var output;

	function compile(callback) {
		fileIndex = 0;
		output = "";
		function compileFiles(str) {
			if (str) {
				output += str;
				output += ";\n";
			}
			if (fileIndex < options.files.length) {
				compileFile(options.files[fileIndex++], compileFiles);
			} else {
				fs.writeFile(options.dest, output, 'utf8', callback);
			}
		}
		compileFiles();
	}

	return function(req, res, next) {

		if (options.force) {
			return compile(function(err) {
				if (err) return next(err);
				res.sendfile(options.dest);
			});
		}

		fs.stat(options.dest, function(err, uglyStats) {
			if (err) {
				// gonna swallow the other errors and assume the file doesn't exist
				return compile(function(err) {
					if (err) return next(err);
					res.sendfile(options.dest);
				});
			}
			res.sendfile(options.dest);
		});
	};
};
