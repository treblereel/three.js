#!/bin/bash

/home/treblereel/workspace/google/closure-compiler/bazel-bin/compiler_unshaded --js_output_file test.js --compilation_level BUNDLE  --js constants.js --js utils.js --js */*.js --js */*/*.js --js */*/*/*.js --entry_point box.js --js  box.js --externs webxr.js