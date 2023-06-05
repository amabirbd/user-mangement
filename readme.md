# User Management App

## Usage

make sure you have installed and running Postgres in your system.

Rename the .envexample to .env

Add your PostgresSQL DATABSE_URL in th .env file.

run ,

```
npx prisma generate

```

and

```
npx prisma migrate dev

```

### Install dependencies

# Backend deps

at root folder

```
npm install
```

### Run App

At root folder run -

```
npm run dev
```

App should be running at port [http://localhost:5000/](http://localhost:5000/)

### Api testing

api is provided in the root folder in file `Test.postman_collection.json`
