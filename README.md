<img src="https://decthings.com/logo.png" alt="decthings logo" style="zoom: 33%;" />

## Decthings API-client

**Early access:** We continue development and would really appreciate any feedback, notes or concerns you might have. In the meantime, note that Decthings is not suitable for production use.

---

[![npm version](https://badge.fury.io/js/@decthings%2Fapi-client.svg)](https://badge.fury.io/js/@decthings%2Fapi-client)

[Decthings](https://decthings.com) is a cloud-based API for artificial intelligence and machine learning. This package is officially supported by Decthings.

`npm install @decthings/api-client`

Can be used either in the browser or in Node.js.

---
#### Documentation

Documentation for this package is available [here](https://decthings.com/docs/api-nodejs).

---

#### Evaluation example in Node.js

```typescript
import * as fs from 'fs';
import { DecthingsClient, Data, DataElement } from '@decthings/api-client';

// Read image and convert to base64 data
const imageData = fs.readFileSync('/path/to/image.png');

// Create a client which will communicate with the server
const decthingsClient = new DecthingsClient();

// This is the ID for the Midas depth estimation model
const modelId = "20712947-6b2f-49f4-b2ff-8b9204971fa3";

// Construct an array containing the input data
const data = new Data([DataElement.image('png', imageData)]);

// Provide the modelId and input data to the evaluate function
decthingsClient.model.evaluate(modelId, [{ name: 'input', data }]).then(response => {
    if (response.error) {
        // The evaluation failed to start..
        console.log('The evaluation failed to start', response.error);
    }
    else if (response.result.failed) {
        // The evaluation was started but failed to complete..
        console.log('The evaluation failed to complete', response.result.failed);
    }
    else if (response.result.failed) {
        // success!
        console.log(response.result.success);
    }
})
```