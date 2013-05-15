#!/bin/bash

#Copyright (c) 2013 Charly Molter

#Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

#The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

#THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#########################################################
##
## This script will run convert and ffmpeg to generate
## the files which will later be used as reference
## in the tests
##
########################################################

DIR_TEST="testFiles/"
DIR_CHECK="checkFiles/"

function usage() {
  echo "usage : $1"
  echo "generates videos from the testFiles and put them in checkFiles"
}

function generate_video() {
  TESTNAME=$(basename "$1")
  FORMAT=$(echo "$TESTNAME" | cut -d '_' -f1)
  DURATION=$(echo "$TESTNAME" | cut -d '_' -f2)
  RESULT_FILE="$DIR_CHECK$TESTNAME.mpeg"

  #Generate the video by first converting the images
  (for J in $(ls "$1/"* 2> /dev/null); do
    convert "$J" -background '#000000' -resize "$FORMAT" -gravity center -extent "$FORMAT" -strip -sampling-factor '4:2:0' -type TrueColor jpeg:-
  done) | avconv -f image2pipe -r 1/"$DURATION" -c:v mjpeg -i - -vcodec libx264 -r 20 -f mpegts - > "$RESULT_FILE"
}

if [ $# -eq 0 ]; then
  if [ -d "$DIR_CHECK" ]; then
    rm "$DIR_CHECK"*
  else
    mkdir "$DIR_CHECK"
  fi
  if [ -d "$DIR_TEST" ]; then
    rm -rf "$DIR_TEST"*
  else
    mkdir "$DIR_TEST"
  fi
  s3cmd sync s3://wideortest "$DIR_TEST"

  for I in $(ls -d "$DIR_TEST"* 2> /dev/null); do
    generate_video "$I"
  done
else
  usage $0
  exit -1
fi


