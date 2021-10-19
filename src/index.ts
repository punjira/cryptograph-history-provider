import express from 'express';
const app = express();
require('./database/mongo');
require('./nats/subscription');

app.use(function (req, res) {
     console.log('/');
});

app.listen(process.env.PORT, () => {
     console.log('server is up on port ', process.env.PORT);
});
