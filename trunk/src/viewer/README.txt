This directory contains the swivel viewer in both source and compiled 
(but unoptimized) form.  See example.html for how to embed the viewer 
in a web page.

The viewer uses the Google Closure library, so if you want to make changes,
you have two options.  You can hack on the "compiled" source directly,
since compiling without optimization primarily just rolls up all the 
dependencies.  (And because of dependencies we can't just load
swivel_source.js in our HTML files.)

Or, you can download the closure library, hack on swivel_source.js, then
use calcdeps.py to compile it with or without optimization.  Here's a 
little background:

http://code.google.com/closure/library/docs/calcdeps.html

calcdeps.py can be found in closure-library-read-only/closure/bin.
To create a non-optimized viewer (with javascript humans can easily parse),
using just calcdeps.py:

/path/to/calcdeps.py \
  -p /path/to/closure-library-read-only \
  -p . \
  -i swivel_source.js \
  -o script > swivel_compiled.js

Here's how to compile with optimization using compiler.jar (requires Java):

/path/to/calcdeps.py \
  -p /path/to/closure-library-read-only \
  -p . \
  -i swivel_source.js \
  -o compiled \
  -c /path/to/closure-compiler/compiler.jar > swivel_compiled.js

