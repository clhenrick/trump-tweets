CREATE TABLE trump_tweets (
  id bigint PRIMARY KEY,
  is_retweet boolean,
  username text,
  content text,
  date_time timestamp with time zone,
  updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP(2),
  images text[],
  reply_count bigint,
  retweet_count bigint,
  favorite_count bigint
);
