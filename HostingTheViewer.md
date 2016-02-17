This page has tips on serving the open source viewer from your own site.

If you just want to embed an album on a blog or web page, visit the [HOWTO](HOWTO.md).  But if you want to serve up the images and viewer yourself, you've come to the right place.

# Embedding the viewer #

From the Downloads tab above, you can download an archive containing the viewer itself, an [example HTML page](http://code.google.com/p/swivel-viewer/source/browse/trunk/src/viewer/example.html) showing how to embed the viewer and pass in a list of URLs, and some supporting files.

In most cases, it should be sufficient to drop swivel\_compiled.js, example.html and the images/ directory (which has the arrows\_curved\_small image shown when the viewer first loads) somewhere and load them in a web browser.

# Supplying a list of image URLs #

In the example code, we supply a list of URLs for images in a [Picasa Web Album](http://picasaweb.google.com).  That's handy for this project site because it means we don't have to worry about hosting the images ourselves.

(We used [GoogleCL](http://code.google.com/p/googlecl) as an easy way to get the list of image URLs for the album: `google picasa list url-direct --title "Fuji Camera"` )

But it's just as easy to give relative or absolute URLs for photos hosted elsewhere.

# Hacking on the viewer #

If you want to make changes to the viewer itself, check out the [README.txt](http://code.google.com/p/swivel-viewer/source/browse/trunk/src/viewer/README.txt) in the source archive.

We used the [Closure Tools](http://code.google.com/closure/) to provide browser compatibility and other features.  As the readme explains, you can use the closure compiler to create an optimized, "compiled" viewer.

But you don't have to have the closure tools if you just want to make simple changes to the viewer.  Just modify the "compiled" viewer that comes in our source archive, which is really just our viewer plus all its dependencies in one big file.

And of course we'd love to have your improvements.  Visit the "Issues" tab above and create an issue with your patch attached.  We will need a CLA before we can accept the patch, though:

  * If you are an individual writing original source code and you're sure you own the intellectual property, then you'll need to sign an [individual CLA](http://code.google.com/legal/individual-cla-v1.0.html).
  * If you work for a company that wants to allow you to contribute your work to Google Data Python Client Library, then you'll need to sign a [corporate CLA](http://code.google.com/legal/corporate-cla-v1.0.html)