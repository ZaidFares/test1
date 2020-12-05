/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the legal
 * directory for license terms. You may choose either license, or both.
 *
 */

/*
  This gulp file downloads Raspbian/ Raspberry Pi toolchain tar.gz archives from artifactory.
  Unpacks them to TOOLCHAIN_DIR and sets environment variables to point to this toolchain for ARM.

  When this is done, it builds node_modules for ARM - Raspberry Pi/Raspbian.
*/

var gulp = require('gulp');
var download = require('gulp-download');
var exec = require('gulp-exec');
var gulpRun = require('gulp-run');
var ifElse = require('gulp-if-else');
const yargs = require("yargs");
var mkdirp = require('mkdirp');
var path = require('path');
var filesExist = require('files-exist');

// Raspberry Pi cross compilation tools
const TOOLS_ARCHIVE = 'tools-17.09.2018.tar.gz';
const ROOTFS_ARCHIVE = 'rootfs-4.14.62.1134.tar.gz';
// IoT Device Client JS Library
const IOT_DEVICE_LIB_ARCHIVE = 'iot-javascript-client-library-19.1.1.0.0-3.zip';
const IOT_DEVICE_LIB_BIN_ZIP = 'iot/client_library/javascript/iotcs-csl-js-bin-19.1.1.0.0-3.zip';

// Resources archives from artifactory will be downloaded here
const DOWNLOAD_DIR = '../../downloads/';
// Resources - cross compile tools for raspberry pi will be unpacked here
const TOOLCHAIN_DIR = '../../rpi-toolchain';

const DOWNLOAD_FILES = [DOWNLOAD_DIR + TOOLS_ARCHIVE,
                        DOWNLOAD_DIR + ROOTFS_ARCHIVE,
                        DOWNLOAD_DIR + IOT_DEVICE_LIB_ARCHIVE];

const TARGET_FILES = [DOWNLOAD_DIR + TOOLS_ARCHIVE,
                      DOWNLOAD_DIR + ROOTFS_ARCHIVE];

const SOURCE_FILES = ['https://iot.us.oracle.com/artifactory/bacs/oracle/com/cw/gateway/raspberrypi/tools/17.09.2018/' + TOOLS_ARCHIVE,
                      'https://iot.us.oracle.com/artifactory/bacs/oracle/com/cw/gateway/raspberrypi/rootfs/4.14.62.1134/' + ROOTFS_ARCHIVE,
                      'https://iot.us.oracle.com/artifactory/iot-promoted-builds/19.1.1.0.0-3/' + IOT_DEVICE_LIB_ARCHIVE];

function addYargs(yargs) {
    return yargs
            .option("buildVersion", {
                                describe: "Long version of build",
                                alias: "V",
                                type: "string",
                                default: "dev"
                            })
            .option("buildNumber", {
                                describe: "Serial build number",
                                alias: "N",
                                type: "string",
                                default: "1"
                            })
            .option("versionCode", {
                                describe: "Version code. Sets the version code for the application",
                                alias: "C",
                                type: "string"
                            })
            .usage("Usage: gulp [commands] [options]")
                 .command("[default]", "Build and budle cw-gateway.tar.gz");
}
                    
// Parse args
const argv = addYargs(yargs).help().argv; 
var fullVersion = argv.buildVersion + "-" + argv.buildNumber;
// Get short version that included three first numbers separated by dots
var shortVersion = argv.buildVersion.split(".", 3).join(".") || require("./package").version;

console.log(argv);
console.log("Full version: " + fullVersion);
console.log("Short version: " + shortVersion); 

/* Download cross compilation toolchain archives */
gulp.task('downloadResources', function (done) {
    var files = filesExist(DOWNLOAD_FILES, { throwOnMissing: false });

    var missing_targets = DOWNLOAD_FILES.filter((file) => {
        return files.indexOf(file) === -1;
    });

    var files_to_download = missing_targets.map((target) => {
	return SOURCE_FILES[DOWNLOAD_FILES.indexOf(target)];
    });

    if (files_to_download.length > 0) {
        console.log('Downloading resources ...', files_to_download);
        return download(files_to_download)
	   	   .pipe(gulp.dest(DOWNLOAD_DIR));
    }
    console.log('Resources already downloaded');
    done();
});

/* Extract toolchain */
gulp.task('extract-toolchain', function () {
  var options = {
      continueOnError: false, // dtrue means don't emit error event
      pipeStdout: false, // true means stdout is written to file.contents
      destination: TOOLCHAIN_DIR // content passed to lodash.template()
  };
  var reportOptions = {
      err: true, // false means don't write err
      stderr: true, // false means don't write stderr
      stdout: true // false means don't write stdout
  };

  // Create TOOLCHAIN_DIR if neccessary
  mkdirp(TOOLCHAIN_DIR, function(error) {
      if (error) {
          console.error(err);
      } else {
          console.log('Toolchain directory ' + TOOLCHAIN_DIR);
      }
  });

  // Decompress - we use shell command tar xf instead of decompress / gunzip / untar npm modules as
  // there was problem with ssymbolic links when we used them
  return gulp.src(TARGET_FILES)
	     .pipe(exec('tar xf <%= file.path %> -C <%= options.destination %>', options))
             .pipe(exec.reporter(reportOptions));
});

/* Extract IoT Device Client Library */
gulp.task('extract-device-library-phase1', function () {
  var options = {
      continueOnError: false, // true means don't emit error event
      pipeStdout: false, // true means stdout is written to file.contents
      destination: DOWNLOAD_DIR // content passed to lodash.template()
  };
  var reportOptions = {
      err: true, // false means don't write err
      stderr: true, // false means don't write stderr
      stdout: true // false means don't write stdout
  };

  // We use shell command unzip
  return gulp.src([DOWNLOAD_DIR + IOT_DEVICE_LIB_ARCHIVE])
	     .pipe(exec('unzip -uo <%= file.path %> -d <%= options.destination %>', options))
             .pipe(exec.reporter(reportOptions));
});
/* Extract IoT Device Client Library */
gulp.task('extract-device-library-phase2', function () {
  var options = {
      continueOnError: false, // true means don't emit error event
      pipeStdout: false, // true means stdout is written to file.contents
      destination: DOWNLOAD_DIR // content passed to lodash.template()
  };
  var reportOptions = {
      err: true, // false means don't write err
      stderr: true, // false means don't write stderr
      stdout: true // false means don't write stdout
  };

  // We use shell command unzip
  return gulp.src([DOWNLOAD_DIR + IOT_DEVICE_LIB_BIN_ZIP])
             .pipe(exec('unzip -uo <%= file.path %> -d <%= options.destination %>', options))
             .pipe(exec.reporter(reportOptions));
});


/* Setup build environment */
gulp.task('setup-build', function(done) {
    const HOST = 'arm-linux-gnueabihf';
    const RPI_DIR = path.resolve(TOOLCHAIN_DIR);

    process.env.PATH = RPI_DIR + '/tools/arm-bcm2708/gcc-linaro-arm-linux-gnueabihf-raspbian-x64/bin:' + process.env.PATH;
    process.env.CPP = HOST + '-gcc -E';
    process.env.STRIP = HOST + '-strip';
    process.env.OBJCOPY = HOST + '-objcopy';
    process.env.AR = HOST + '-ar';
    process.env.RANLIB = HOST + '-ranlib';
    process.env.LD = HOST + '-ld';
    process.env.OBJDUMP = HOST + '-objdump';
    process.env.CC = HOST + '-gcc';
    process.env.CXX = HOST + '-g++';
    process.env.NM = HOST + '-nm';
    process.env.AS = HOST + '-as';
    process.env.PS1 = '[' + HOST + '] \w';
    process.env.C_INCLUDE_PATH = RPI_DIR + '/rootfs/usr/include:'
                                 + RPI_DIR + '/rootfs/usr/include/' + HOST + ':'
                                 + process.env.C_INCLUDE_PATH;
    process.env.LDFLAGS='-L' + RPI_DIR + '/rootfs/lib -L' + RPI_DIR + '/rootfs/lib/' + HOST;
    // For debugging - view env properties
    gulpRun('export', {verbosity: 3}).exec();

    done();
});

/* Build npm_modules for Raspbian / Raspberry Pi ARM */
gulp.task('build', function() {
    console.log('Running build for ARM');
    return gulpRun('MACHINE=arm npm --target-arch=arm install', {verbosity: 3}).exec();
});

/* Build npm_modules for Raspbian / Raspberry Pi ARM */
gulp.task('build-console', function() {
    console.log('Running console build for ARM');
    return gulpRun('MACHINE=arm npm --target-arch=arm install', {verbosity: 3, cwd: '../cw-gw-console'}).exec();
});

/* Build Oracle JET staging files */
gulp.task('build-ojet', function() {
    console.log('Building Oracle JET web console application');
    return gulpRun('ojet build', {verbosity: 3, cwd: '../cw-gw-console'}).exec();
});

/* Bundle build results into gziped tarball */
gulp.task('bundle', function() {
    console.log('Preparing release artifacts bundle');
    var options = {
        continueOnError: false, // true means don't emit error event
        pipeStdout: false, // true means stdout is written to file.contents
        maxBuffer: 10024000 // make stdout buffer large enough
    };
    var reportOptions = {
        err: true, // false means don't write err
        stderr: true, // false means don't write stderr
        stdout: true // false means don't write stdout
    };

    gulpRun('pwd').exec();
    // We use shell command unzip
    return gulp.src(['../../cw-gateway'])
               .pipe(exec('tar --exclude-from=release.ignore -zcvf ../../cw-gateway-' + fullVersion + '.tar.gz ../../cw-gateway', options))
               .pipe(exec.reporter(reportOptions));
});

gulp.task('default', gulp.series('downloadResources',
                                 'extract-toolchain',
                                 'extract-device-library-phase1',
                                 'extract-device-library-phase2',
                                 'setup-build',
                                 'build',
                                 'build-console',
                                 'build-ojet',
                                 'bundle',
				 function(done) {
				     console.log('Done.');
				     done();
	                         })
);
