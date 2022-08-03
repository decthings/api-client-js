<img src="https://app.decthings.com/logo.png" alt="decthings" style="zoom: 33%;" />

## Decthings API-client

**Early access:** We continue development and would really appreciate any feedback, notes or concerns you might have. In the meantime, note that Decthings is not suitable for production use.

---

[![npm version](https://badge.fury.io/js/@decthings%2Fapi-client.svg)](https://badge.fury.io/js/@decthings%2Fapi-client)

[Decthings](https://decthings.com) is cloud-based API for artificial intelligence and machine learning.

`npm install @decthings/api-client`

Can be used either in the browser or in Node.js.

---
#### Documentation

Documentation for this package is available [here](https://decthings.com/docs/using-the-api/nodejs).

---

#### Evaluation example in Node.js

```typescript
import * as fs from 'fs';
import { DecthingsClient, Data, DataElement } from '@decthings/api-client';

// Read image and convert to base64 data
const imageData = fs.readFileSync('/path/to/image');

// Create a client which will communicate with the server
const decthingsClient = new DecthingsClient();

// This is the ID for the Midas depth estimation model
const modelId = "e149309a-4922-4332-a858-6e65d9518b81";

// Construct an array containing the input data
const data = new Data([DataElement.image('png', imageData)]);

// Provide the modelId and input data to the evaluate function
decthingsClient.model.evaluate(modelId, [{ name: 'input', data }]).then(response => {
    if (response.error) {
        // hmm, something bad happened.
        console.log(response.error);
    }
    else {
        // success!
        console.log(response.result);
    }
})
```