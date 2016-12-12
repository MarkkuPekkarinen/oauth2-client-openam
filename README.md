# Test Client for OAuth2 authorization flow
This client is set-up to work with OpenAM as the identity and OAuth provider.


## Set-up

```sh
$ cd {project folder}
$ npm install
$ npm start
```


## Running
The flow is split into 3 main steps.
 - Step 1, Authenticate, have 2 options.
    - Open new window to authenticate and authorize to get authorize code
    - Split into 2 steps. A and B. (This requires MSISDN Number to include permission, bypassing authorize page)
        - Step 1a - Login Auth API. Authenticate through API call and get cookie
        - Step 1b - Authorize (GET). Get authorize code through API call with cookie

 - Step 2 - Get Access Token (POST).
 - Step 3 - Call API with Access Token (GET).