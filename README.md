Uglifile
========

This is a wrapper around the uglify.js code that produces a single file to be rendered out of express.

Usage
-----

		var uglifile = require("uglifile");

		app.get("/scripts/target.js", uglifile ({
		    dest: __basedir + "/scriptCache/target.js",
		    files: [
		    	__basedir + "/scriptSource/file1.js",
		    	__basedir + "/scriptSource/file2.js"
		    ],
		    // optional: forces compile each time
		    force: false,
		    // optional: can be used to prevent compression in dev
		    compress: true,
		    // optional: uglify mangle 
		    mangle: true,
		    // optional: uglify squeeze
		    squeeze: true
		}));


MIT LICENCE
-----------

Copyright (c) 2012 Sugendran Ganess

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.