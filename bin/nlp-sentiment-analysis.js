#!/usr/bin/env node
'use strict';

const fs = require('fs');
const CartoDB = require('cartodb');
const sls = require('single-line-string');
const algorithmia = require("algorithmia");
const algorithmiaClient = algorithmia(process.env.ALGORITHMIA_API_KEY);

const tableTweets = process.env.CARTO_TABLE; // table in carto of @realDonaldTrump's tweets since 10/05/2016
const ssaUrl = 'https://api.algorithmia.com/v1/algo/nlp/SocialSentimentAnalysis';
const count = 1942; // total no. of tweets in db as of 08/12/2017
const tweetsQuery = `SELECT * FROM ${tableTweets} ORDER BY date_time DESC LIMIT ${count}`;

const sql = new CartoDB.SQL({
  user: process.env.CARTO_USER,
  api_key: process.env.CARTO_API_KEY
});

const tweetsAnalyzed = [];

function queryCarto(query, callback) {
  sql.execute(query)
    .done((data) => {
      console.log(`Executed in ${data.time}, total rows: ${data.total_rows}`);
      if (callback && typeof callback === 'function') {
        callback(null, data.rows);
      }
    })
    .error((error) => {
      console.log(`There was an error: ${error}`);
      callback(error);
    });
}

function parseTweets(error, tweets) {
  if (error) throw error;

  tweets.forEach(function(tweet, i) {
    delay(function() {
      console.log('parsing tweet: ', tweet.content);
      analyzeTweet(tweet);
    }, i);
  });
}

function delay(action, n) {
  // delay, so that we don't ping the API too frequently
  setTimeout(action, n * 300);
}

function analyzeTweet(tweet) {
  // pass tweet text to Algorithmia's SocialSentimentAnalysis API
  const id = tweet.cartodb_id;
  const text = tweet.content;

  algorithmiaClient.algo('algo://nlp/SocialSentimentAnalysis')
    .pipe(text)
    .then(function(response) {
      processAnalysis(response, id);

      if (tweetsAnalyzed.length === count) {
        // save tweets after storing them all
        saveProcessedTweets();
      }
    });
}

function processAnalysis(response, tweetId) {
  // parse the response and store it to tweetsAnalyzed array
  const toSave = response.get()[0];
  toSave.id = tweetId;
  // don't need to store the tweet content
  delete toSave.sentence;
  tweetsAnalyzed.push(toSave);
}

function saveProcessedTweets() {
  fs.writeFile('data/tweetsAnalyzed.json', JSON.stringify(tweetsAnalyzed), function(error) {
    if (error) {
      console.log(error);
      process.exit();
    }
    console.log('json file saved');
  });
}

queryCarto(tweetsQuery, parseTweets);
