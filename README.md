# trump-tweets
tracking &amp; visualizing tweets from @realDonaldTrump

Make sure to have a `.env` file in the root of this repo with the following:

```
CARTO_USER=<your_carto_user_name>
CARTO_API_KEY=<your_carto_api_key>
CARTO_TABLE=<your_table_name_on_carto>
```

To update a table on [CARTO](https://carto.com) with the latest tweets, do:

```
foreman run node bin/index.js latest
```

To populate the table with data scraped on 2017-01-06, do:

```
foreman run node bin/index.js initial
```
