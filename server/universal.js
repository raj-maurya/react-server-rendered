const path = require('path')
const fs = require('fs')
const request = require('request')

import React from 'react'
import { renderToString } from 'react-dom/server'
import { match, RouterContext } from 'react-router'

import createRoutes from '../src/routes'
import configureStore from '../src/store'
import { Provider } from 'react-redux'
import Helmet from 'react-helmet'

const routes = createRoutes({})

module.exports = function universalLoader(req, res) {
  //res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'))
  const filePath = path.resolve(__dirname, '..', 'build', 'index.html')

  fs.readFile(filePath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('read err', err)
      return res.status(404).end()
    }
    match({ routes, location: req.url }, (err, redirect, renderProps) => {
      if (err) {
        console.error('match err', err)
        return res.status(404).end()
      } else if (redirect) {
        res.redirect(302, redirect.pathname + redirect.search)
      } else if (renderProps) {
        if (renderProps.params.splat) {
          let param = renderProps.params.splat

          let store = configureStore()
          const ReactApp = renderToString(
            <Provider store={store}>
              <RouterContext {...renderProps} />
            </Provider>
          )
          request({
            url: 'http://34.209.188.46:3003/api/titulos/' + param,
            json: true
          }, function (error, response, body) {
            let filme = body

            const html = `
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="shortcut icon" href="%PUBLIC_URL%/favicons/favicon.ico">
                <title>${filme.title} - Sugestão Netflix</title>
                <meta property="og:type" content="video.other">
                <meta property="og:image" content="${filme.poster}">
                <meta property="og:title" content="${filme.title}">
                <meta property="og:url" content="http://34.209.188.46:8080/" + ${param}">
                <meta property="og:description" content="${filme.description}">
              </head>
              <body>
                <noscript>
                  Please enable javascript for this page
                </noscript>
                <div id="root">${ReactApp}</div>
              </body>
            </html>
            `


            res.send(html)
          })
        } else {
          let store = configureStore()
          const ReactApp = renderToString(
            <Provider store={store}>
              <RouterContext {...renderProps} />
            </Provider>
          )
          const RenderedApp = htmlData.replace('{{SSR}}', ReactApp)
          res.send(RenderedApp)
        }
      } else {
        return res.status(404).end()
      }
    })
  })
}

