# trump-tweets
Tracking &amp; (eventually), visualizing tweets from @realDonaldTrump

Make sure to have a `.env` file in the root of this repo with the following:

```
CARTO_USER=<your_carto_user_name>
CARTO_API_KEY=<your_carto_api_key>
CARTO_TABLE=<your_table_name_on_carto>
ALGORITHMIA_API_KEY=<your_algorithmia_api_key>
```
You'll need to have [foreman](http://ddollar.github.io/foreman/) installed (or another way of loading environment variables from a `.env` file), as well as the project dependencies in `package.json`.

## Running the Twitter scraper scripts
To update a table on [CARTO](https://carto.com) with the latest tweets, do:

```
foreman run node bin/index.js latest
```

To populate the table with data scraped on 2017-01-06, do:

```
foreman run node bin/index.js initial
```

This script is currently running on a Heroku scheduler and storing the tweets to a Postgres database on [CARTO](https://carto.com).

## Natural Language Processing

My initial idea was to run every tweet through a NLP Sentiment Analysis algorithm to get an idea of how positive, negative, or neutral each tweet is. [Algorithmia](https://algorithmia.com) provides RESTful API endpoints for various NLP algorithms. For Sentiment Analysis it currently provides two different algorithms.

The **Social Sentiment Analysis** assigns sentiment ratings (0 - 1) for positive, negative, neutral, and compound.

Example API call:

```bash

curl -X POST -d '{"sentence": "We will continue to follow developments in Charlottesville, and will provide whatever assistance is needed. We are ready, willing and able."}' \
-H 'Content-Type: application/json' -H 'Authorization: Simple <API_KEY>' https://api.algorithmia.com/v1/algo/nlp/SocialSentimentAnalysis
```

The regular **Sentiment Analysis** gives a range for how positive (1) to negative (-1) a text block is.

Example API call:

```bash
curl -X POST -d '{
  "document": "Condolences to the family of the young woman killed today, and best regards to all of those injured, in Charlottesville, Virginia. So sad!"
}' -H 'Content-Type: application/json' -H 'Authorization: Simple <API_KEY>' https://api.algorithmia.com/v1/algo/nlp/SentimentAnalysis/1.0.3
```

For the first experiment I ended up using [Algorithmia's Social Sentiment Analysis](https://algorithmia.com/algorithms/nlp/SocialSentimentAnalysis).

To run the script do:

```
foreman run node bin/nlp-sentiment-analysis.js
```

The response is stored in `data/tweets-analyzed-2017-08-12.json`.
