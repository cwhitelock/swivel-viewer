// Copyright 2009 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

// Compile with:
// g++ -lgphoto2 -o object-scanner object-scanner.cc
//

// Usage: ./object-scanner scan-directory-to-create
// Creates a directory with images captured by the tethered 
// gphoto2-supported camera.  (Tested with Canon Rebel, EOS 1Ds mark II and
// III cameras).
//
// If you're turning the turntable by hand, you may find it more efficient
// to just press the shutter button on the camera and then download the images
// from the flash card later.  But this code is a good starting point if you
// want to build a motorized turntable that automatically rotates between
// images.
//
// This code supports multiple cameras (just change the NUM_CAMERAS
// below) and optionally controls an IMS MDrive motor like this one:
// http://www.imshome.com/products/mdrive34plus.html
//

//#define USE_IMSHOME_MOTOR 
#define NUM_CAMERAS (1)

// camera stuff:
#include <unistd.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <gphoto2/gphoto2.h>

#ifdef USE_IMSHOME_MOTOR
// serial port stuff
#include <termios.h>
#include <unistd.h>
#include <stdio.h>
#include <sys/signal.h>
#include <sys/types.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>
#endif

int open_or_die(const char *directory, const char *fn) {

  char complete_fn[255];
  snprintf(complete_fn, 254, "%s/%s", directory, fn);
  unlink(complete_fn);

  int fd = open(complete_fn, O_CREAT | O_WRONLY, 00666);
  if (fd < 0) {
    perror(complete_fn);
    exit(6);
  }

  return fd;
}

#ifdef USE_IMSHOME_MOTOR

void write_line_to_turntable(int fd, const char *string) {
  tcflush(fd, TCIFLUSH);

  int len = strlen(string);
  for (int i=0; i<len; i++) {
    write(fd, &(string[i]), 1);
    //usleep(100000);
  }
  write(fd, "\r", 1);
//  usleep(1000000);
//  some versions of the motor firmware freak out if you give them a \n
//  write(fd, "\n", 1);

  // block until we get something back
  char c;
  read(fd, &c, 1);
  usleep(300000);
}

int serial_fd;

void init_turntable(const char *serial_device) {
  int fd = open(serial_device, O_RDWR | O_NOCTTY);
  if (fd < 0) {
     perror("error opening /dev/ttyS0");
     exit(1);
   }

  struct termios termio;
  memset(&termio, 0, sizeof(termio));

  termio.c_cflag = B9600 | CS8 | CLOCAL |CREAD;

  termio.c_cc[VMIN] = 1;

  tcflush(fd, TCIFLUSH);
  tcsetattr(fd, TCSANOW, &termio);

  char cancel[2] = { 0x03, 0 };

  write_line_to_turntable(fd, cancel); // control-c reboots the motor
  usleep(3000000);
  write_line_to_turntable(fd, "em=3"); // probably useless, since the ims
      // motors we have don't really wait until command is finished
      // before returning the prompt

  // these values need to be tweaked depending on whether you're using
  // a gear reduction on the motor output.  If you're doing direct drive,
  // plan on at least a NEMA-34 sized motor.
  write_line_to_turntable(fd, "a=500");
  write_line_to_turntable(fd, "d=500");
  write_line_to_turntable(fd, "rc=100");
  write_line_to_turntable(fd, "vm=5000");

  serial_fd = fd;
}

void advance_turntable(int degrees) {
  // for 81:1 reduction
  //int units_per_degree = 11520;
  // for 9:1 reduction
  //int units_per_degree = 1280;
  // for 27:1 reduction
  //int units_per_degree = 3840;
  int units_per_degree = 142; // actually, 142.2222

  char line[255];
  sprintf(line, "mr %d", units_per_degree * degrees);

  write_line_to_turntable(serial_fd, line);
  usleep(3000000);
}
#else

void advance_turntable(int degrees) {
  char buf[1000];

  printf("Please advance the turntable %d degrees, then hit enter.\n", degrees);
  fgets(buf, 999, stdin);
}
#endif

int suppress_log = 0;

void errordumper(GPLogLevel level, const char *domain, const char *format,
                 va_list args, void *data) {


  if (suppress_log) return;

  fprintf(stdout, "xxxxx: ");
  vfprintf(stdout, format, args);
  fprintf(stdout, "\n");
}

void enable_capture(Camera *camera, GPContext *cameracontext) {
  int retval;

  //printf("Get root config.\n");
  CameraWidget *rootconfig; // okay, not really
  CameraWidget *actualrootconfig;

  retval = gp_camera_get_config(camera, &rootconfig, cameracontext);
  actualrootconfig = rootconfig;
  //printf("  Retval: %d\n", retval);

  //printf("Get main config.\n");
  CameraWidget *child;
  retval = gp_widget_get_child_by_name(rootconfig, "main", &child);
  //printf("  Retval: %d\n", retval);

  //printf("Get settings config.\n");
  rootconfig = child;
  retval = gp_widget_get_child_by_name(rootconfig, "settings", &child);
  //printf("  Retval: %d\n", retval);

  //printf("Get capture config.\n");
  rootconfig = child;
  retval = gp_widget_get_child_by_name(rootconfig, "capture", &child);
  //printf("  Retval: %d\n", retval);


  CameraWidget *capture = child;

  const char *widgetinfo;
  gp_widget_get_name(capture, &widgetinfo);
  //printf("config name: %s\n", widgetinfo );

  const char *widgetlabel;
  gp_widget_get_label(capture, &widgetlabel);
  //printf("config label: %s\n", widgetlabel);

  int widgetid;
  gp_widget_get_id(capture, &widgetid);
  //printf("config id: %d\n", widgetid);

  CameraWidgetType widgettype;
  gp_widget_get_type(capture, &widgettype);
  //printf("config type: %d == %d \n", widgettype, GP_WIDGET_TOGGLE);


  //printf("Set value.\n");

  int one=1;
  retval = gp_widget_set_value(capture, &one);
  //printf("  Retval: %d\n", retval);

  //printf("Enabling capture.\n");
  retval = gp_camera_set_config(camera, actualrootconfig, cameracontext);
  //printf("  Retval: %d\n", retval);
}

void capture_to_file(Camera *camera, GPContext *cameracontext, char *fn) {
  int retval;

  //printf("Capturing.\n");
  CameraFilePath camera_file_path;

  // NOP: This gets overridden in the library to /capt0000.jpg
  strcpy(camera_file_path.folder, "/");
  strcpy(camera_file_path.name, "foo.jpg");

  retval = gp_camera_capture(camera, GP_CAPTURE_IMAGE, &camera_file_path, cameracontext);
  //printf("  Retval: %d\n", retval);

  //printf("Pathname on the camera: %s/%s\n", camera_file_path.folder, camera_file_path.name);

  CameraFile *camerafile;

  retval = gp_file_new(&camerafile);
  //printf("  Retval: %d\n", retval);
  retval = gp_camera_file_get(camera, camera_file_path.folder, camera_file_path.name,
                     GP_FILE_TYPE_NORMAL, camerafile, cameracontext);
  //printf("  Retval: %d\n", retval);

  const char *filedata;
  unsigned long int filesize;

  retval = gp_file_get_data_and_size(camerafile, &filedata, &filesize);
  //printf("  Retval: %d\n", retval);

  int fd = open(fn, O_CREAT | O_WRONLY, 0644);
  write(fd, filedata, filesize);
  close(fd);

  //printf("Deleting.\n");
  retval = gp_camera_file_delete(camera, camera_file_path.folder, camera_file_path.name,
                        cameracontext);
  //printf("  Retval: %d\n", retval);

  gp_file_free(camerafile);
}

// Pass in the address of the first element of an array of 3 Camera pointers.
void init_cameras(GPContext *cameracontext, Camera **cameras) {

  GPPortInfoList *portinfolist = NULL;
  gp_port_info_list_new(&portinfolist);
  gp_port_info_list_load(portinfolist);
  gp_port_info_list_count(portinfolist);

  CameraAbilitiesList *abilities_list;
  gp_abilities_list_new(&abilities_list);

  gp_abilities_list_load(abilities_list, cameracontext);

  CameraList *detected;
  gp_list_new(&detected);
  gp_abilities_list_detect(abilities_list, portinfolist, detected, cameracontext);

  int num_cameras_found = gp_list_count(detected);

  if (NUM_CAMERAS == 1) {
    // as far as I can tell, you might get one or two entries if you have
    // just one camera
  } else if (num_cameras_found != NUM_CAMERAS+1) {
    printf("Found %d cameras, but expected %d.\n",
           num_cameras_found-1, NUM_CAMERAS);
    exit(2);
  }

  for (int camera_num=0; camera_num<NUM_CAMERAS; camera_num++) {
    const char *camera_model, *camera_port;

    camera_model = camera_port = NULL;

    int detected_camera;
    if (NUM_CAMERAS == 1) {
      detected_camera = camera_num;
    } else {
      detected_camera = camera_num + 1;
    }

    gp_list_get_name(detected, detected_camera, &camera_model);
    gp_list_get_value(detected, detected_camera, &camera_port);

    printf("Opening camera #%d: %s %s\n", detected_camera, camera_model, camera_port);
    int model = gp_abilities_list_lookup_model(abilities_list, camera_model);
  
    CameraAbilities abilities;
    gp_abilities_list_get_abilities(abilities_list, model, &abilities);

    gp_camera_new(&(cameras[camera_num]));
    gp_camera_set_abilities(cameras[camera_num], abilities);
  
    int port = gp_port_info_list_lookup_path(portinfolist, camera_port);
  
    if (port == GP_ERROR_UNKNOWN_PORT) {
      printf("Couldn't find port.\n");
      exit(4);
    }
  
    GPPortInfo port_info;
    int ret = gp_port_info_list_get_info(portinfolist, port, &port_info);
    if (ret < GP_OK) {
      printf("gp_port_info_list_get_info() failed.\n"
          "Perhaps you don't have a libgphoto2-compatible camera connected?\n");
      exit(3);
    }
  
    ret = gp_camera_set_port_info(cameras[camera_num], port_info);
    if (ret < GP_OK) {
      printf("gp_camera_set_port_info() failed.\n");
      exit(4);
    }

    printf("Camera init.\n");
    int retval = gp_camera_init(cameras[camera_num], cameracontext);
    //printf("  Retval: %d\n", retval);

    enable_capture(cameras[camera_num], cameracontext);
  }
}


int main(int argc, char **argv) {

  if (argc != 2) {
    printf("Usage: %s directory_to_create\n", argv[0]);
    return 5;
  }

  // We used the code below with some clever CGI scripts to use this binary as
  // part of a web interface
  //printf("<html><head><meta http-equiv=\"refresh\" content=\"3\"></head><body><pre>\n");
  printf("Scanning...\n");
  fflush(stdout);

  char *object_name = argv[1];
  mkdir(object_name, 00755);

#ifdef USE_IMSHOME_MOTOR
  fprintf(stderr, "init turntable\n");
  init_turntable("/dev/ttyS0");
#endif

  suppress_log = 1;

  // When I set GP_LOG_DEBUG instead of GP_LOG_ERROR, I noticed that the
  // init function seems to traverse the entire filesystem on the camera.  This
  // made it take much longer to init.
  gp_log_add_func(GP_LOG_ERROR, errordumper, NULL);

  GPContext *cameracontext = gp_context_new();
  Camera *cameras[NUM_CAMERAS+2];

  fprintf(stderr, "camera init\n");
  init_cameras(cameracontext, cameras);

  suppress_log = 0;
  //set_capturetarget(camera, cameracontext);

  for (int angle=0; angle<360; angle+=10) {

  	for (int i=0; i<NUM_CAMERAS; i++) {
	    char fn[255];

      snprintf(fn, 254, "%s/%d-%.3d.jpg", object_name, (i+1)*10, angle);
     	fn[254]=0;

      capture_to_file(cameras[i], cameracontext, fn);
	    printf("Capturing %s.\n", fn);
  	  fflush(stdout);
    }

    advance_turntable(10);
  }

  for (int i=0; i<NUM_CAMERAS; i++) {
    gp_camera_exit(cameras[i], cameracontext);
  }

  printf("Done.\n");
}
