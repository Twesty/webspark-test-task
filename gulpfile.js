let preprocessor = 'sass', // Preprocessor (sass, less, styl); 'sass' also work with the Scss syntax in blocks/ folder.
  fileswatch = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

import pkg from 'gulp'
const { src, dest, parallel, series, watch } = pkg

import browserSync from 'browser-sync'
import bssi from 'browsersync-ssi'
import ssi from 'ssi'
import webpackStream from 'webpack-stream'
import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import gulpSass from 'gulp-sass'
import * as dartSass from 'sass'
const sass = gulpSass(dartSass)
import sassglob from 'gulp-sass-glob'
import postCss from 'gulp-postcss'
import cssnano from 'cssnano'
import autoprefixer from 'autoprefixer'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import imageminSvgo from 'imagemin-svgo'
import path from 'path'
import fs from 'fs-extra'
import concat from 'gulp-concat'
import rsync from 'gulp-rsync'
import { deleteAsync } from 'del'

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'app/',
      middleware: bssi({ baseDir: 'app/', ext: '.html' })
    },
    ghostMode: { clicks: false },
    notify: false,
    online: true,
    // tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
  })
}

function scripts() {
  return src([
    'app/js/*.js', '!app/js/*.min.js',
    'app/libs/*.js', '!app/libs/*.min.js',
  ])
    .pipe(webpackStream({
      mode: 'production',
      performance: { hints: false },
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['babel-plugin-root-import']
              }
            }
          }
        ]
      },
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: { format: { comments: false } },
            extractComments: false
          })
        ]
      },
    }, webpack, (err, stats) => {
      if (err) {
        console.error('❌ Webpack Error:', err);
        this.emit('end');
      }
      if (stats.hasErrors()) {
        console.error('❌ Webpack Stats Errors:', stats.toString({ colors: true }));
        this.emit('end');
      }
    }))
    .on('error', function (err) {
      console.error('❌ Error in Gulp task scripts:', err.message);
      this.emit('end');
    })
    .pipe(concat('app.min.js'))
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function styles() {
  return src([`app/scss/*.*`, `!app/scss/_*.*`])
    .pipe(eval(`sassglob`)())
    .pipe(eval('sass')({
      'include css': true,
      silenceDeprecations: ['legacy-js-api', 'mixed-decls', 'color-functions', 'global-builtin', 'import'],
      loadPaths: ['./']
    })).on('error', function handleError(err) {
      console.error('❌ Preprocessor error:', err.message);
      this.emit('end');
    })
    .pipe(postCss([
      autoprefixer({ grid: 'autoplace' }),
      cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
    ]))
    .pipe(concat('app.min.css'))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function buildcopy() {
  return src([
    '{app/js,app/css}/*.min.*',
    'app/assets/webp/**/*.webp',
    'app/assets/svg/**/*.svg',
    'app/assets/fonts/**/*',
    'app/assets/favicon.ico',
  ], { base: 'app/', encoding: false })
    .pipe(dest('dist'))
}

async function buildhtml() {
  let includes = new ssi('app/', 'dist/', '/**/*.html')
  includes.compile()
  await deleteAsync('dist/parts', { force: true })
}

async function cleandist() {
  await deleteAsync('dist/**/*', { force: true })
}

function startwatch() {
  watch([`app/scss/**/*`], { usePolling: true }, styles)
  watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
  watch([`app/**/*.{${fileswatch}}`], { usePolling: true }).on('change', browserSync.reload)
}

export { scripts, styles }
export let assets = series(scripts, styles)
export let build = series(cleandist, scripts, styles, buildcopy, buildhtml)

export default series(scripts, styles, parallel(browsersync, startwatch))
