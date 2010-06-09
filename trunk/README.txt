There's really very little code to see here.  Most people will want to 
simply upload photos to a Picasa Web album, then use Picasa Web's embed
feature to produce code to copy-and-paste into a webpage.

But if you want a zoomable, HTML+Javascript viewer that you can host
and hack on yourself, you've come to the right place.

src/viewer/ contains the embeddable javascript viewer

examples/ contains an example of how to use the embedded viewer
in src/viewer.

src/object-scanner/ contains some hacked-up code for automatically capturing
images from a libgphoto2-supported camera and turning a turntable.  Useful
if you want to try building automatic image-capturing turntables.


