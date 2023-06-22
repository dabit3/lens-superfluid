# Lens Protocol X Superfluid

This is an example project showing how to stream payments to your top followers on Lens using Superfluid.

This project also uses the Lens BigQuery table and API to query for a user's top followers.

## Prerequisites

To run this project, you must have the following:

1. Node.js installed on your machine
2. A GCP Keyfile configured with an account that has acces to BigQuery. To learn how to set this up, see [this video](https://www.youtube.com/watch?v=b98UZ0Bqr7E).

## Running this app

1. Clone the repo

```sh
git clone https://github.com/dabit3/lens-superfluid
```

2. Install the dependencies

```sh
npm install

# or yarn, pnpm
```

3. Save your `keyfile` in a file named `keyfile.json` at the root of your app.

4. Run the app

```sh
npm run dev
```