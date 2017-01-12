#!/usr/bin/env node
'use strict';

const TwitterPosts = require('twitter-screen-scrape');
const CartoDB = require('cartodb');
const sls = require('single-line-string');
const fs = require('fs');

const table = process.env.CARTO_TABLE;
const values = [];

const sql = new CartoDB.SQL({
  user: process.env.CARTO_USER,
  api_key: process.env.CARTO_API_KEY
});

const tweetStream = new TwitterPosts({
  username: 'realDonaldTrump',
  retweets: false
});

function sqlifyTweet(tweet) {
  // formats a tweet's data into a valid SQL VALUES statement
  const { id, isRetweet, username, text, time, images, reply, retweet, favorite } = tweet;

  // explicitly insert a null array if no images present
  let imagesFormatted = `${images}`;
  if (imagesFormatted.length === 0) imagesFormatted = 'NULL';

  // make sure to escape single quotes in tweet text
  let textFormatted = text.replace(/'/g, "''");

  return sls`(
    ${id},
    ${isRetweet},
    '${username}',
    '${textFormatted}',
    to_timestamp(${time}),
    ARRAY[${imagesFormatted}],
    ${reply},
    ${retweet},
    ${favorite}
  )`;
}

function makeUpsertQuery(values) {
  // creates the upsert query
  return sls`
    WITH
    n(id,
      is_retweet,
      username,
      content,
      date_time,
      images,
      reply_count,
      retweet_count,
      favorite_count
    ) AS (
    VALUES ${values}
    ),
    upsert AS (
    UPDATE ${table} o
    SET reply_count = n.reply_count,
        retweet_count = n.retweet_count,
        favorite_count = n.favorite_count
    FROM n WHERE o.id = n.id
    RETURNING o.id
    )
    INSERT INTO ${table} (
      id,
      is_retweet,
      username,
      content,
      date_time,
      images,
      reply_count,
      retweet_count,
      favorite_count
    )
    SELECT
      n.id,
      n.is_retweet,
      n.username,
      n.content,
      n.date_time,
      n.images,
      n.reply_count,
      n.retweet_count,
      n.favorite_count
    FROM n
    WHERE n.id NOT IN (
      SELECT id FROM upsert
    )
  `;
}

function callUpsert(query) {
  sql.execute(query)
    .done((data) => {
      console.log(`Executed in ${data.time}, total rows: ${data.total_rows}`);
    })
    .error((error) => {
      console.log(`There was an error: ${error}`);
    });
}

function getLatestTweets() {
  tweetStream.on('readable', () => {
    const tweet = tweetStream.read();
    values.push(sqlifyTweet(tweet));
  });

  tweetStream.on('end', () => {
    values.join('');
    callUpsert(makeUpsertQuery(values));
  });
}

function initialImport() {
  const test = JSON.parse(fs.readFileSync('./data/2017-01-06.json', 'utf-8'));
  const values = test.map(sqlifyTweet);
  const upsert = makeUpsertQuery(values);
  callUpsert(upsert);
}

function init() {
  if (process.argv[2] === 'latest') {
    getLatestTweets();
  } else if (process.argv[2] === 'initial') {
    initialImport();
  } else {
    console.error('call script with either `latest` or `initial`');
    process.exit();
  }
}

init();
