const express = require('express');
const app = express();


app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

app.use('/static', express.static(__dirname + '/static'));
app.use('/sw.js', express.static(__dirname + '/static/sw.js'));

app.listen(8080, () => console.log('Server now running at port 8080'));
