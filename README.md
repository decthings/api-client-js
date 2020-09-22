# Decthings JavaScript API client

**Early access:** We continue development and would really appreciate any feedback, notes or concerns you might have. In the meantime, note that Decthings is not suitable for production use.

---

[Decthings](https://free.decthings.com) is an early accesss cloud-based API for artificial intelligence and machine learning.

`npm install @decthings/api-client`

Can be used either in the browser or in Node.js.

---

#### Evaluation example in Node.js

```typescript
import * as fs from 'fs';
import { DecthingsClient } from '@decthings/api-client';

// Read image and convert to base64 data
const imageData = fs.readFileSync('/path/to/image').toString('base64');

// Create a client which will communicate with the server
const decthingsClient = new DecthingsClient();

// This is the ID for the Midas depth estimation model
const modelId = "e149309a-4922-4332-a858-6e65d9518b81";

// Construct an array containing the input data
const data = [{ name: 'input', value: { type: 'image', imageFormat: 'png', value: imageData } }];

// Provide the modelId and input data to the evaluate function
decthingsClient.freeModelRpc.evaluate(modelId, data).then(response => {
    if (response.failed) {
        // hmm, something bad happened.
        console.log(response.failed);
    }
    else {
        // success!
        console.log(response.success);
        fs.writeFileSync('/path/to/output', Buffer.from((response.success.result[0] as any).value, 'base64'))
    }
})
```