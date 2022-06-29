const express = require('express');
const app = express();
const router = express.Router();
const http = require('node:http');
const fs = require('fs');

const ACCESSIBILITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const PRICE = {
  FREE: 'Free',
  LOW: 'Low',
  HIGH: 'High',
};

router.get('/activity', (req, res) => {
  fs.readFile('user.json', 'utf-8', (error, data) => {
    let existingUser = null;
    let url = 'http://www.boredapi.com/api/activity';

    if (error) {
      console.log(error);
    } else {
      const user = JSON.parse(data.toString());
      const { accessibility, price } = user;
      existingUser = user;

      let paramAccessibility = '';
      switch (accessibility) {
        case ACCESSIBILITY.HIGH:
          paramAccessibility = 'minaccessibility=0&maxaccessibility=0.25';
          break;
        case ACCESSIBILITY.MEDIUM:
          paramAccessibility = 'minaccessibility=0.250001&maxaccessibility=0.75';
          break;
        case ACCESSIBILITY.LOW:
          paramAccessibility = 'minaccessibility=0.750001&maxaccessibility=1';
          break;
        default:
      }

      let paramPrice = '';
      switch (price) {
        case PRICE.FREE:
          paramPrice = 'price=0';
          break;
        case PRICE.LOW:
          paramPrice = 'minprice=0.000001&maxprice=0.5';
          break;
        case PRICE.HIGH:
          paramPrice = 'minprice=0.500001&maxprice=1';
          break;
        default:
      }

      url += `?${paramAccessibility}&${paramPrice}`;
    }

    const request = http.request(url, (response) => {
      response.on('data', (data) => {
        const parsedData = JSON.parse(data);
        console.log('GET result:\n', parsedData);
  
        const { accessibility, price } = parsedData;
        let mappedAccessibility = '';
        if (accessibility <= 0.25) {
          mappedAccessibility = ACCESSIBILITY.HIGH;
        } else if (accessibility > 0.25 && accessibility <= 0.75) {
          mappedAccessibility = ACCESSIBILITY.MEDIUM;
        } else if (accessibility > 0.75) {
          mappedAccessibility = ACCESSIBILITY.LOW;
        }
  
        let mappedPrice = '';
        if (price === 0) {
          mappedPrice = PRICE.FREE;
        } else if (price <= 0.5) {
          mappedPrice = PRICE.LOW;
        } else if (price > 0.5) {
          mappedPrice = PRICE.HIGH;
        }
  
        const mappedData = { ...parsedData, accessibility: mappedAccessibility, price: mappedPrice };
        res.send({ user: existingUser, activity: mappedData });
      })
    });
  
    request.on('error', (error) => {
      console.log(error);
      res.send('Error fetching activities.');
    });
  
    request.end();
  });
});

router.post('/user', (req, res) => {
  const { name, accessibility, price } = req.body;
  const user = { name, accessibility, price };
  const data = JSON.stringify(user, null, 4);

  fs.writeFile('user.json', data, (error) => {
    if (error) {
      console.log(error);
      res.send('Failed to create the user.')
    } else {
      console.log('JSON data is saved.');
      res.send('User created.');
    }
  });
});

app.use(express.json());
app.use(router);

const port = 5000;
const server = app.listen(port, () => console.log(`Listening on Port ${port}...`));

module.exports = server;
