The code was originally written for a high volume object scanner.  An
operator placed an object on a motorized turntable, and this program
alternately snapped photos and turned the table.

If you're just experimenting with object photos on a turntable, just turn
the object by hand and press your camera's shutter button for each shot.  We
wrote this once we had worked out our lighting and backdrop, and wanted to shoot
a lot of objects very efficiently.

Think of this code as a starting point for a fancier program. It's
not polished or fancy, and will probably break.

Usage: ./object-scanner scan-directory-to-create

Creates a directory with images captured by the tethered gphoto2-supported
camera.  (Tested with Canon Rebel, EOS 1Ds mark II and III cameras).

Compile with:
g++ -lgphoto2 -o object-scanner object-scanner.cc

